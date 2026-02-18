import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
}

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Mask email for logging to protect PII
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const maskedLocal = local.length > 2 
    ? local[0] + '***' + local[local.length - 1]
    : '***';
  return `${maskedLocal}@${domain}`;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const MIN_RESPONSE_TIME_MS = 2000; // Normalize response time to prevent timing-based email enumeration

  // Helper to ensure consistent response timing
  const sendResponse = async (response: Response): Promise<Response> => {
    const elapsed = Date.now() - startTime;
    if (elapsed < MIN_RESPONSE_TIME_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
    }
    return response;
  };

  try {
    const { email }: SendOTPRequest = await req.json();
    
    if (!email || !email.includes('@')) {
      console.log("Invalid email format provided");
      return sendResponse(new Response(
        JSON.stringify({ error: "Please provide a valid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      ));
    }

    const maskedEmail = maskEmail(email);
    console.log("Processing password reset request for:", maskedEmail);

    // Create Supabase admin client to check if user exists
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if user exists using admin API
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error checking user existence");
      return sendResponse(new Response(
        JSON.stringify({ error: "An error occurred. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      ));
    }

    const userExists = users.users.some(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!userExists) {
      console.log("User lookup completed for:", maskedEmail);
      // Return generic message to prevent email enumeration
      return sendResponse(new Response(
        JSON.stringify({ success: true, message: "If an account exists with this email, you will receive a reset code." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      ));
    }

    // Rate limiting: Check for recent OTP requests (max 3 per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentOTPs, error: recentError } = await supabaseAdmin
      .from("password_reset_otps")
      .select("created_at")
      .eq("email", email.toLowerCase())
      .gte("created_at", oneHourAgo);

    if (recentError) {
      console.error("Error checking recent OTPs");
    }

    if (recentOTPs && recentOTPs.length >= 3) {
      console.log("Rate limit exceeded for:", maskedEmail);
      return sendResponse(new Response(
        JSON.stringify({ error: "Too many reset requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      ));
    }

    // Invalidate any existing unused OTPs for this email
    const { error: invalidateError } = await supabaseAdmin
      .from("password_reset_otps")
      .update({ used: true })
      .eq("email", email.toLowerCase())
      .eq("used", false);

    if (invalidateError) {
      console.error("Error invalidating old OTPs");
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: insertError } = await supabaseAdmin
      .from("password_reset_otps")
      .insert({
        email: email.toLowerCase(),
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        used: false,
        attempts: 0
      });

    if (insertError) {
      console.error("Error storing OTP");
      return sendResponse(new Response(
        JSON.stringify({ error: "Failed to generate reset code. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      ));
    }

    console.log("OTP generated and stored successfully for:", maskedEmail);

    // Send OTP via email
    const emailResponse = await resend.emails.send({
      from: "Expense Tracker <onboarding@resend.dev>",
      to: [email],
      subject: "Password Reset Code - Expense Tracker",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .otp-box { 
              background: #f5f5f5; 
              padding: 20px; 
              text-align: center; 
              border-radius: 8px;
              margin: 20px 0;
            }
            .otp-code { 
              font-size: 32px; 
              font-weight: bold; 
              letter-spacing: 8px; 
              color: #2563eb;
            }
            .footer { 
              text-align: center; 
              color: #666; 
              font-size: 12px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <p>Hello,</p>
            <p>We received a request to reset your password for your Expense Tracker account. Use the code below to reset your password:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Expense Tracker. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully for:", maskedEmail);

    return sendResponse(new Response(
      JSON.stringify({ success: true, message: "If an account exists with this email, you will receive a reset code." }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    ));
  } catch (error: unknown) {
    console.error("Error in send-password-reset-otp:", error);
    return sendResponse(new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    ));
  }
};

serve(handler);
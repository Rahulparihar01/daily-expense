import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  email: string;
  otp: string;
  newPassword?: string;
  action: "verify" | "reset";
}

const MAX_ATTEMPTS = 5;

// Mask email for logging to protect PII
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const maskedLocal = local.length > 2 
    ? local[0] + '***' + local[local.length - 1]
    : '***';
  return `${maskedLocal}@${domain}`;
}

// Validate password strength
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }
  return { valid: true };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, newPassword, action }: VerifyOTPRequest = await req.json();
    
    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate OTP format (must be 6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const maskedEmail = maskEmail(email);
    console.log(`Processing ${action} request for:`, maskedEmail);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Fetch the OTP record (get most recent unused OTP for this email)
    const { data: otpRecords, error: fetchError } = await supabaseAdmin
      .from("password_reset_otps")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Error fetching OTP");
      return new Response(
        JSON.stringify({ error: "An error occurred. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!otpRecords || otpRecords.length === 0) {
      console.log("No valid OTP found for:", maskedEmail);
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP. Please request a new one." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const otpRecord = otpRecords[0];

    // Check if too many failed attempts
    const attempts = otpRecord.attempts || 0;
    if (attempts >= MAX_ATTEMPTS) {
      console.log("Too many failed attempts for:", maskedEmail);
      // Mark as used to prevent further attempts
      await supabaseAdmin
        .from("password_reset_otps")
        .update({ used: true })
        .eq("id", otpRecord.id);
      
      return new Response(
        JSON.stringify({ error: "Too many failed attempts. Please request a new code." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if OTP is expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      console.log("OTP expired for:", maskedEmail);
      // Mark as used since it's expired
      await supabaseAdmin
        .from("password_reset_otps")
        .update({ used: true })
        .eq("id", otpRecord.id);
      
      return new Response(
        JSON.stringify({ error: "This code has expired. Please request a new one." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate OTP code (timing-safe comparison would be ideal but not critical for 6-digit codes)
    if (otpRecord.otp_code !== otp) {
      console.log("Invalid OTP code attempt for:", maskedEmail);
      
      // Increment attempts counter
      await supabaseAdmin
        .from("password_reset_otps")
        .update({ attempts: attempts + 1 })
        .eq("id", otpRecord.id);
      
      const remainingAttempts = MAX_ATTEMPTS - attempts - 1;
      return new Response(
        JSON.stringify({ 
          error: remainingAttempts > 0 
            ? `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
            : "Invalid OTP. Please request a new code."
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // If just verifying, return success
    if (action === "verify") {
      console.log("OTP verified successfully for:", maskedEmail);
      return new Response(
        JSON.stringify({ success: true, message: "OTP verified successfully" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // For password reset, we need the new password
    if (action === "reset") {
      if (!newPassword) {
        return new Response(
          JSON.stringify({ error: "Password is required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Validate password strength
      const validation = validatePassword(newPassword);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ error: validation.error }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Find the user
      const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (userError) {
        console.error("Error finding user");
        return new Response(
          JSON.stringify({ error: "An error occurred. Please try again." }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        console.log("User not found for password reset:", maskedEmail);
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Update the user's password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.error("Error updating password");
        return new Response(
          JSON.stringify({ error: "Failed to update password. Please try again." }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Mark OTP as used
      await supabaseAdmin
        .from("password_reset_otps")
        .update({ used: true })
        .eq("id", otpRecord.id);

      console.log("Password reset successfully for:", maskedEmail);

      return new Response(
        JSON.stringify({ success: true, message: "Password updated successfully" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in verify-otp-reset-password:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
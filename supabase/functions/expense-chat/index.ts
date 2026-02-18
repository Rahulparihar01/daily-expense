import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
  owner: string;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, expenses, currentMonth } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Calculate expense analytics for context
    const expenseAnalytics = calculateAnalytics(expenses, currentMonth);
    
    const systemPrompt = buildSystemPrompt(expenseAnalytics, expenses);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("expense-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function calculateAnalytics(expenses: Expense[], currentMonth: string) {
  if (!expenses || expenses.length === 0) {
    return {
      totalExpenses: 0,
      categoryBreakdown: {},
      ownerBreakdown: {},
      dailyAverage: 0,
      weeklyAverage: 0,
      monthlyTotal: 0,
      recentTrends: [],
      topCategories: [],
    };
  }

  // Total expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
  });

  // Owner breakdown
  const ownerBreakdown: Record<string, number> = {};
  expenses.forEach((e) => {
    ownerBreakdown[e.owner] = (ownerBreakdown[e.owner] || 0) + e.amount;
  });

  // Daily breakdown for trends
  const dailyTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.amount;
  });

  const uniqueDays = Object.keys(dailyTotals).length;
  const dailyAverage = uniqueDays > 0 ? totalExpenses / uniqueDays : 0;

  // Weekly average (assuming 7 days per week)
  const weeklyAverage = dailyAverage * 7;

  // Get recent 7 days trends
  const sortedDates = Object.keys(dailyTotals).sort().slice(-7);
  const recentTrends = sortedDates.map((date) => ({
    date,
    amount: dailyTotals[date],
  }));

  // Top categories
  const topCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }));

  return {
    totalExpenses,
    categoryBreakdown,
    ownerBreakdown,
    dailyAverage,
    weeklyAverage,
    monthlyTotal: totalExpenses,
    recentTrends,
    topCategories,
    totalTransactions: expenses.length,
    uniqueDays,
  };
}

function buildSystemPrompt(analytics: ReturnType<typeof calculateAnalytics>, expenses: Expense[]) {
  const today = new Date().toISOString().split('T')[0];
  
  // Get recent expenses for context
  const recentExpenses = expenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20)
    .map(e => `${e.date}: ${e.category} - ₹${e.amount} (${e.owner})${e.description ? ` - ${e.description}` : ''}`)
    .join('\n');

  return `You are an intelligent expense tracking assistant for a family expense management app. You help users understand their spending patterns, analyze expenses, and make predictions.

## Current Date
Today is ${today}

## Expense Summary
- Total Expenses: ₹${analytics.totalExpenses.toFixed(2)}
- Total Transactions: ${analytics.totalTransactions || 0}
- Daily Average: ₹${analytics.dailyAverage.toFixed(2)}
- Weekly Average: ₹${analytics.weeklyAverage.toFixed(2)}

## Category Breakdown
${Object.entries(analytics.categoryBreakdown)
  .map(([cat, amount]) => `- ${cat}: ₹${(amount as number).toFixed(2)}`)
  .join('\n')}

## Owner Breakdown
${Object.entries(analytics.ownerBreakdown)
  .map(([owner, amount]) => `- ${owner}: ₹${(amount as number).toFixed(2)}`)
  .join('\n')}

## Top Spending Categories
${analytics.topCategories.map((c, i) => `${i + 1}. ${c.category}: ₹${c.amount.toFixed(2)}`).join('\n')}

## Recent Daily Trends
${analytics.recentTrends.map(t => `${t.date}: ₹${t.amount.toFixed(2)}`).join('\n')}

## Recent Expenses (Last 20)
${recentExpenses || 'No recent expenses'}

## Your Capabilities
1. Answer questions about current and past expenses
2. Analyze spending patterns by category, owner, or time period
3. Provide predictions for weekly/monthly spending based on trends
4. Give budgeting advice and savings tips
5. Compare spending between owners (husband/wife)
6. Identify unusual spending patterns

## Response Guidelines
- Always use ₹ symbol for currency (Indian Rupees)
- Be concise but helpful
- When making predictions, explain your reasoning based on historical data
- Use bullet points and formatting for clarity
- If asked about data you don't have, politely explain what information is available
- Be encouraging about good financial habits`;
}

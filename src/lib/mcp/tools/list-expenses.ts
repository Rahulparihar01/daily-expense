import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export default defineTool({
  name: "list_expenses",
  title: "List expenses",
  description: "List the signed-in user's expenses, optionally filtered by date range, category or owner.",
  inputSchema: {
    start_date: dateStr.optional().describe("Start date (inclusive), YYYY-MM-DD."),
    end_date: dateStr.optional().describe("End date (inclusive), YYYY-MM-DD."),
    category: z.string().optional().describe("Category, e.g. Food, Milk, Transport."),
    owner: z.enum(["husband", "wife"]).optional().describe("Who spent it."),
    limit: z.number().int().min(1).max(500).optional().describe("Max rows (default 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ start_date, end_date, category, owner, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supabaseForUser(ctx)
      .from("expenses")
      .select("id,date,category,amount,description,owner,payment_method")
      .order("date", { ascending: false })
      .limit(limit ?? 100);
    if (start_date) q = q.gte("date", start_date);
    if (end_date) q = q.lte("date", end_date);
    if (category) q = q.eq("category", category);
    if (owner) q = q.eq("owner", owner);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const expenses = (data ?? []).map((e) => ({
      id: e.id, date: e.date, category: e.category, amount: Number(e.amount),
      description: e.description, owner: e.owner, payment_method: e.payment_method,
    }));
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    return {
      content: [{ type: "text", text: JSON.stringify({ total, count: expenses.length, expenses }) }],
      structuredContent: { total, count: expenses.length, expenses },
    };
  },
});

import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_expense",
  title: "Add expense",
  description: "Add a new expense for the signed-in user. Dates cannot be in the future.",
  inputSchema: {
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Expense date, YYYY-MM-DD."),
    category: z.string().trim().min(1).max(50).describe("Category, e.g. Food, Milk, Transport, Other."),
    amount: z.number().positive().max(10_000_000).describe("Amount in rupees."),
    owner: z.enum(["husband", "wife"]).describe("Who spent it."),
    payment_method: z.enum(["cash", "card", "online"]).optional().describe("Defaults to cash."),
    description: z.string().max(500).optional().describe("Optional note."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const today = new Date(Date.now() + 14 * 3600 * 1000).toISOString().slice(0, 10); // allow latest timezone
    if (input.date > today) throw new ToolError("Expense date cannot be in the future.");
    const { data, error } = await supabaseForUser(ctx)
      .from("expenses")
      .insert({
        user_id: ctx.getUserId()!,
        date: input.date,
        category: input.category,
        amount: input.amount,
        owner: input.owner,
        payment_method: input.payment_method ?? "cash",
        description: input.description ?? null,
      })
      .select("id,date,category,amount,owner,payment_method,description")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const expense = { ...data, amount: Number(data.amount) };
    return { content: [{ type: "text", text: `Added ₹${expense.amount} for ${expense.category} on ${expense.date}.` }], structuredContent: { expense } };
  },
});

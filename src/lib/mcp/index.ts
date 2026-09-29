import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listExpensesTool from "./tools/list-expenses";
import addExpenseTool from "./tools/add-expense";

// Issuer must be the direct Supabase host, built from the project ref (inlined at build time).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "expense-dashboard",
  title: "Expense Dashboard",
  version: "0.1.0",
  instructions:
    "Tools for the signed-in user's family expense tracker (amounts in Indian Rupees). Use `list_expenses` to read and total expenses by date range, category or owner (husband/wife), and `add_expense` to record a new one.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listExpensesTool, addExpenseTool],
});

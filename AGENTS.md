
## Agent integrations (MCP)
- MCP server lives in src/lib/mcp (tools per file), bundled by mcpPlugin into supabase/functions/mcp; secured with OAuth so RLS runs as the signed-in user. Why: external AI assistants must only see the caller's own data.

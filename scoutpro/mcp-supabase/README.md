# Supabase MCP server

This folder contains a minimal MCP server that provides a read-only
`supabase_select` tool.

## Setup
1. Install dependencies:
   - `npm install`
2. Run the server (Cursor will start it using MCP configuration):
   - `npm run start`

## Required environment variables
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Notes
- The server is read-only and limits results to max 1000 rows.
- For production, keep RLS enabled and scope the anon key to the required
  tables/columns.

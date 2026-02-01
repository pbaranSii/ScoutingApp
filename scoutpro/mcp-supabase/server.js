import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY. Provide them in the MCP server environment."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TOOL_NAME = "supabase_select";

const server = new Server(
  { name: "local-supabase-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: TOOL_NAME,
        description:
          "Read-only select from a Supabase table with filters and limits.",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string" },
            select: { type: "string", default: "*" },
            filters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  column: { type: "string" },
                  operator: {
                    type: "string",
                    enum: [
                      "eq",
                      "neq",
                      "gt",
                      "gte",
                      "lt",
                      "lte",
                      "like",
                      "ilike",
                      "is",
                      "in",
                    ],
                  },
                  value: {},
                },
                required: ["column", "operator", "value"],
                additionalProperties: false,
              },
            },
            order: {
              type: "object",
              properties: {
                column: { type: "string" },
                ascending: { type: "boolean", default: true },
              },
              required: ["column"],
              additionalProperties: false,
            },
            limit: { type: "integer", default: 50 },
          },
          required: ["table"],
          additionalProperties: false,
        },
      },
    ],
  };
});

function applyFilter(query, filter) {
  const { column, operator, value } = filter;
  switch (operator) {
    case "eq":
      return query.eq(column, value);
    case "neq":
      return query.neq(column, value);
    case "gt":
      return query.gt(column, value);
    case "gte":
      return query.gte(column, value);
    case "lt":
      return query.lt(column, value);
    case "lte":
      return query.lte(column, value);
    case "like":
      return query.like(column, value);
    case "ilike":
      return query.ilike(column, value);
    case "is":
      return query.is(column, value);
    case "in":
      if (!Array.isArray(value)) {
        throw new Error("Filter operator 'in' requires an array value.");
      }
      return query.in(column, value);
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== TOOL_NAME) {
    return {
      content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
      isError: true,
    };
  }

  const args = request.params.arguments ?? {};
  const table = args.table;
  const select = args.select ?? "*";
  const filters = Array.isArray(args.filters) ? args.filters : [];
  const order = args.order ?? null;
  const limit = Number.isInteger(args.limit) ? args.limit : 50;
  const safeLimit = Math.min(Math.max(limit, 1), 1000);

  try {
    let query = supabase.from(table).select(select).limit(safeLimit);

    for (const filter of filters) {
      query = applyFilter(query, filter);
    }

    if (order?.column) {
      query = query.order(order.column, {
        ascending: order.ascending !== false,
      });
    }

    const { data, error } = await query;
    if (error) {
      return {
        content: [{ type: "text", text: `Supabase error: ${error.message}` }],
        isError: true,
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: err instanceof Error ? err.message : "Unknown error",
        },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

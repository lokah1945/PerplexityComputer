import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { callAgent, runParallelTasks, testApiConnectivity } from "./agents.js";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { db } from "./db.js";
import { intelligence } from "./intelligence.js";
import { type Preset } from "./router.js";
import { loopHint, nextState, type WorkflowState } from "./loop.js";
import { telemetry } from "./telemetry.js";
import { scout } from "./intelligence/scout.js";

const VERSION = "5.0.0";
const server = new McpServer({ name: "perplexity-agent", version: VERSION });

// ... (existing tools)

// ─── Tool 15: You.com Scout - Pure Research ───────────────────────────────────
server.tool(
  "pplx_scout",
  "High-efficiency web research using You.com Research API. Use this as a first-pass scouting layer to save costs.",
  {
    query: z.string().describe("Topik yang ingin diteliti"),
    level: z.enum(["lite", "standard", "deep", "exhaustive"]).default("lite")
  },
  async ({ query, level }) => {
    const report = await scout.masterScout(query);
    return { content: [{ type: "text", text: report }] };
  }
);

// ─── Startup ──────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
// ...
}

main().catch((err) => {
  logger.error("Fatal startup error", { error: String(err) });
  process.exit(1);
});

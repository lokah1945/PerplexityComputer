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

const VERSION = "4.2.0";
const server = new McpServer({ name: "perplexity-agent", version: VERSION });

// ─── Tool 1: Fast Search ─────────────────────────────────────────────────────
server.tool(
  "pplx_fast_search",
  "Quick web search. Untuk cek versi library, lookup cepat, konfirmasi info singkat. Hemat token.",
  { query: z.string() },
  async ({ query }) => {
    const r = await callAgent({ prompt: query, preset: "fast-search" });
    return { content: [{ type: "text", text: `${r.text}\n\nSources: ${r.citations.join(", ") || "n/a"}` }] };
  }
);

// ─── Tool 2: Code Research ────────────────────────────────────────────────────
server.tool(
  "pplx_code_research",
  "Research mendalam untuk coding. Dokumentasi, best practice, contoh implementasi. Gunakan untuk persiapan sebelum coding.",
  {
    query: z.string().describe("Topik coding yang ingin diteliti"),
    focus_areas: z.array(z.string()).optional()
  },
  async ({ query, focus_areas }) => {
    const enriched = focus_areas?.length
      ? `${query}\n\nFokus pada:\n${focus_areas.map((a) => `- ${a}`).join("\n")}`
      : query;
    const r = await callAgent({ prompt: enriched, preset: "deep-research" });
    return { content: [{ type: "text", text: r.text }] };
  }
);

// ─── Tool 3: Code Agent (Claude Opus 4.6) ─────────────────────────────────────
server.tool(
  "pplx_code_agent",
  "Coding agent penuh dengan Claude Opus 4.6. Untuk generate kode kompleks, refactor besar, desain arsitektur. Hasilkan kode lengkap siap pakai.",
  {
    goal: z.string().describe("Goal coding yang ingin dicapai secara spesifik"),
    project_context: z.string().optional().describe("Konteks: stack, patterns, constraints"),
    language: z.string().default("typescript"),
    structured_output: z.boolean().default(false)
  },
  async ({ goal, project_context, language, structured_output }) => {
    const prompt = [
      project_context ? `## Project Context\n${project_context}` : "",
      `## Language\n${language}`,
      `## Goal\n${goal}`,
      "\nReturn kode yang lengkap dan siap dijalankan. Format: filename di comment pertama, lalu kode."
    ]
      .filter(Boolean)
      .join("\n\n");

    const r = await callAgent({
      prompt,
      preset: "advanced-deep-research",
      responseFormat: structured_output ? "json_object" : "text"
    });
    return { content: [{ type: "text", text: r.text }] };
  }
);

// ─── Tool 4: Parallel Agents ──────────────────────────────────────────────────
server.tool(
  "pplx_parallel_agents",
  "Jalankan beberapa Perplexity sub-agent secara PARALEL. Gunakan untuk task yang bisa dipecah menjadi sub-task independen.",
  {
    tasks: z
      .array(
        z.object({
          id: z.string(),
          prompt: z.string(),
          preset: z
            .enum(["fast-search", "pro-search", "deep-research", "advanced-deep-research"])
            .optional()
        })
      )
      .min(2)
      .max(8)
  },
  async ({ tasks }) => {
    const text = await runParallelTasks(tasks);
    return { content: [{ type: "text", text }] };
  }
);

// ─── Tool 5: Debug Loop ───────────────────────────────────────────────────────
server.tool(
  "pplx_debug_loop",
  "Analisis error + hasilkan patch yang langsung bisa diapply. Gunakan dalam fix loop setelah test gagal.",
  {
    error_log: z.string().describe("Error message / stack trace"),
    relevant_code: z.string().describe("Kode yang bermasalah"),
    language: z.string().default("typescript"),
    attempt_number: z.number().default(1).describe("Attempt ke berapa, untuk contextualize")
  },
  async ({ error_log, relevant_code, language, attempt_number }) => {
    const prompt = `Debug ${language} code. Attempt #${attempt_number}.

## Error
\`\`\`
${error_log}
\`\`\`

## Code
\`\`\`${language}
${relevant_code}
\`\`\`

Return:
1. Root cause (1-2 kalimat)
2. Fixed code (LENGKAP, siap di-paste langsung)
3. Perubahan yang dibuat (singkat)`;

    const preset: Preset = attempt_number >= 3 ? "advanced-deep-research" : "pro-search";
    const r = await callAgent({ prompt, preset });
    return { content: [{ type: "text", text: r.text }] };
  }
);

// ─── Tool 6: Architecture Advisor ─────────────────────────────────────────────
server.tool(
  "pplx_architecture",
  "Desain atau review arsitektur sistem. Gunakan untuk keputusan high-level: pilih teknologi, desain database schema, system design.",
  {
    question: z.string(),
    constraints: z.array(z.string()).optional(),
    existing_stack: z.string().optional()
  },
  async ({ question, constraints, existing_stack }) => {
    const tasks: Array<{ id: string; prompt: string; preset: Preset }> = [
      {
        id: "patterns",
        prompt: `Architecture patterns for: ${question}`,
        preset: "deep-research"
      },
      {
        id: "tradeoffs",
        prompt: `Trade-offs and considerations for: ${question}. Constraints: ${constraints?.join(", ") ?? "none"}`,
        preset: "deep-research"
      },
      {
        id: "implementation",
        prompt: `Concrete implementation guide for: ${question}. Stack: ${existing_stack ?? "Node.js TypeScript"}`,
        preset: "advanced-deep-research"
      }
    ];
    const text = await runParallelTasks(tasks);
    return { content: [{ type: "text", text }] };
  }
);

// ─── Tool 7: Autonomous Loop State Machine ────────────────────────────────────
server.tool(
  "pplx_autonomous_loop",
  "Enhanced State machine: plan -> research -> code -> test -> fix -> done.",
  {
    objective: z.string(),
    has_error: z.boolean().default(false),
    attempts: z.number().default(0),
    current_state: z.enum(["plan", "research", "code", "test", "fix", "done"]).default("plan")
  },
  async ({ objective, has_error, attempts, current_state }) => {
    const state = current_state as WorkflowState;
    const next = nextState(state, { objective, attempts, lastError: has_error ? "error" : undefined });
    const text = `Current: ${state}\nNext: ${next}\nHint: ${loopHint(next)}\nGoal: ${objective}`;
    return { content: [{ type: "text", text }] };
  }
);

// ─── Tool 8: Strategic Thinker ────────────────────────────────────────────────
server.tool(
  "pplx_think",
  "Meta-Planning tool. Breaks down complex goals into optimal sub-tasks and assigns models.",
  { goal: z.string() },
  async ({ goal }) => {
    const prompt = `Develop a master execution plan for: ${goal}. 
Decide which sub-agents (fast, pro, deep, advanced) are needed for each component.
Suggest parallel research points. Return structured plan.`;
    const r = await callAgent({ prompt, preset: "deep-research", includeContext: true });
    return { content: [{ type: "text", text: r.text }] };
  }
);

// ─── Tool 9: Contextual Code Agent ────────────────────────────────────────────
server.tool(
  "pplx_contextual_code",
  "Environment-aware code generation. Automatically scans project stack and structure.",
  {
    goal: z.string(),
    language: z.string().default("typescript")
  },
  async ({ goal, language }) => {
    const r = await callAgent({ 
      prompt: goal, 
      preset: "advanced-deep-research", 
      includeContext: true 
    });
    return { content: [{ type: "text", text: r.text }] };
  }
);

// ─── Tool 10: Telemetry Stats ──────────────────────────────────────────────────
server.tool(
  "pplx_telemetry",
  "View API usage and cost statistics.",
  {},
  async () => {
    const summary = await telemetry.getSummary();
    return { content: [{ type: "text", text: summary }] };
  }
);

// ─── Tool 11: Intelligence Hub - Learn ─────────────────────────────────────────
server.tool(
  "pplx_learn",
  "Record a lesson learned from a task to improve future precision. Assign a success score and optional critique.",
  {
    taskDescription: z.string(),
    result: z.string(),
    successScore: z.number().min(1).max(5),
    critique: z.string().optional(),
    preset: z.string()
  },
  async ({ taskDescription, result, successScore, critique, preset }) => {
    await intelligence.saveLesson({
      taskDescription,
      result,
      successScore,
      critique,
      strategy: `Used preset: ${preset}`,
      preset: preset as any
    });
    return { content: [{ type: "text", text: `Lesson learned and saved to MongoDB for task: ${taskDescription}` }] };
  }
);

// ─── Tool 12: Intelligence Hub - Stats ─────────────────────────────────────────
server.tool(
  "pplx_memory_stats",
  "View statistics about the Super-Orchestrator's intelligence hub.",
  {},
  async () => {
    const col = await db.getCollection("lessons");
    const count = await col.countDocuments();
    const topLessons = await col.find({ successScore: 5 }).limit(5).toArray();
    const goldenCol = await db.getCollection("golden_sets");
    const goldenCount = await goldenCol.countDocuments();
    
    return {
      content: [{
        type: "text",
        text: `Intelligence Hub Stats:\n- Total Lessons: ${count}\n- Perfect Patterns: ${topLessons.length}\n- Golden Traces (Benchmarks): ${goldenCount}`
      }]
    };
  }
);

// ─── Tool 13: InstructionOps - Optimize ─────────────────────────────────────────
server.tool(
  "pplx_optimize_instructions",
  "Autonomous Instruction Optimization. Analyzes failures and proposes AGENTS.md updates.",
  {},
  async () => {
    // In a real scenario, this would trigger the TextGrad loop
    // For now, we provide a placeholder response that triggers the reflection
    return { 
      content: [{ 
        type: "text", 
        text: "Instruction optimization loop triggered. I will now analyze recent telemetry and propose surgical edits to AGENTS.md to improve precision." 
      }] 
    };
  }
);

// ─── Tool 14: InstructionOps - Save Golden Trace ────────────────────────────────
server.tool(
  "pplx_save_golden_trace",
  "Archive a successful task execution as a 'Golden Trace' for future benchmarking.",
  {
    taskDescription: z.string(),
    preset: z.string(),
    outcome: z.enum(["PASS", "FAIL"]),
    metrics: z.object({
      duration: z.number(),
      tokens: z.number(),
      steps: z.number()
    })
  },
  async ({ taskDescription, preset, outcome, metrics }) => {
    await intelligence.saveGoldenTrace({
      taskDescription,
      preset: preset as any,
      systemPromptVersion: VERSION,
      trace: [], // In practice, pass the actual trace here
      outcome,
      metrics
    });
    return { content: [{ type: "text", text: `Golden Trace saved for: ${taskDescription}` }] };
  }
);

// ─── Tool 8: Healthcheck ──────────────────────────────────────────────────────
server.tool(
  "pplx_healthcheck",
  "Check readiness konfigurasi dan koneksi endpoint API.",
  {},
  async () => {
    const masked = `${config.PERPLEXITY_API_KEY.slice(0, 8)}...${config.PERPLEXITY_API_KEY.slice(-4)}`;

    // Test actual API connectivity
    const apiTest = await testApiConnectivity();

    const lines = [
      `## Perplexity Agent MCP Server v${VERSION}`,
      "",
      `| Config | Value |`,
      `|--------|-------|`,
      `| status | ${apiTest.ok ? "✅ connected" : "❌ disconnected"} |`,
      `| base_url | ${config.PPLX_BASE_URL} |`,
      `| timeout_ms | ${config.PPLX_HTTP_TIMEOUT_MS} |`,
      `| max_retries | ${config.PPLX_MAX_RETRIES} |`,
      `| concurrency | ${config.PPLX_CONCURRENCY} |`,
      `| api_key | ${masked} |`,
      `| api_latency | ${apiTest.latencyMs >= 0 ? `${apiTest.latencyMs}ms` : "n/a"} |`,
      ...(config.WORKSPACE_ROOT ? [`| workspace | ${config.WORKSPACE_ROOT} |`] : []),
      ...(apiTest.error ? [``, `**Error:** ${apiTest.error}`] : [])
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// ─── Startup ──────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  logger.info("Starting MCP server", {
    name: "perplexity-agent",
    version: VERSION,
    baseUrl: config.PPLX_BASE_URL,
    tools: 8
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  logger.error("Fatal startup error", { error: String(err) });
  process.exit(1);
});

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { callAgent, runParallelTasks } from "./agents.js";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { loopHint, nextState } from "./loop.js";
const server = new McpServer({ name: "perplexity-agent", version: "4.0.0" });
server.tool("pplx_fast_search", "Quick web search. Untuk cek versi library, lookup cepat, konfirmasi info singkat. Hemat token.", { query: z.string() }, async ({ query }) => {
    const r = await callAgent({ prompt: query, preset: "fast-search" });
    return { content: [{ type: "text", text: `${r.text}\n\nSources: ${r.citations.join(", ") || "n/a"}` }] };
});
server.tool("pplx_code_research", "Research mendalam untuk coding. Dokumentasi, best practice, contoh implementasi. Gunakan untuk persiapan sebelum coding.", {
    query: z.string().describe("Topik coding yang ingin diteliti"),
    focus_areas: z.array(z.string()).optional()
}, async ({ query, focus_areas }) => {
    const enriched = focus_areas?.length
        ? `${query}\n\nFokus pada:\n${focus_areas.map((a) => `- ${a}`).join("\n")}`
        : query;
    const r = await callAgent({ prompt: enriched, preset: "deep-research" });
    return { content: [{ type: "text", text: r.text }] };
});
server.tool("pplx_code_agent", "Coding agent penuh dengan Claude Opus 4.6. Untuk generate kode kompleks, refactor besar, desain arsitektur. Hasilkan kode lengkap siap pakai.", {
    goal: z.string().describe("Goal coding yang ingin dicapai secara spesifik"),
    project_context: z.string().optional().describe("Konteks: stack, patterns, constraints"),
    language: z.string().default("typescript"),
    structured_output: z.boolean().default(false)
}, async ({ goal, project_context, language, structured_output }) => {
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
});
server.tool("pplx_parallel_agents", "Jalankan beberapa Perplexity sub-agent secara PARALEL. Gunakan untuk task yang bisa dipecah menjadi sub-task independen.", {
    tasks: z
        .array(z.object({
        id: z.string(),
        prompt: z.string(),
        preset: z
            .enum(["fast-search", "pro-search", "deep-research", "advanced-deep-research"])
            .optional()
    }))
        .min(2)
        .max(8)
}, async ({ tasks }) => {
    const text = await runParallelTasks(tasks);
    return { content: [{ type: "text", text }] };
});
server.tool("pplx_debug_loop", "Analisis error + hasilkan patch yang langsung bisa diapply. Gunakan dalam fix loop setelah test gagal.", {
    error_log: z.string().describe("Error message / stack trace"),
    relevant_code: z.string().describe("Kode yang bermasalah"),
    language: z.string().default("typescript"),
    attempt_number: z.number().default(1).describe("Attempt ke berapa, untuk contextualize")
}, async ({ error_log, relevant_code, language, attempt_number }) => {
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
    const preset = attempt_number >= 3 ? "advanced-deep-research" : "pro-search";
    const r = await callAgent({ prompt, preset });
    return { content: [{ type: "text", text: r.text }] };
});
server.tool("pplx_architecture", "Desain atau review arsitektur sistem. Gunakan untuk keputusan high-level: pilih teknologi, desain database schema, system design.", {
    question: z.string(),
    constraints: z.array(z.string()).optional(),
    existing_stack: z.string().optional()
}, async ({ question, constraints, existing_stack }) => {
    const tasks = [
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
});
server.tool("pplx_autonomous_loop", "State machine sederhana: plan -> research -> code -> test -> fix -> done.", {
    objective: z.string(),
    has_error: z.boolean().default(false),
    attempts: z.number().default(0),
    current_state: z.enum(["plan", "research", "code", "test", "fix", "done"]).default("plan")
}, async ({ objective, has_error, attempts, current_state }) => {
    const state = current_state;
    const next = nextState(state, { objective, attempts, lastError: has_error ? "error" : undefined });
    const text = `Current: ${state}\nNext: ${next}\nHint: ${loopHint(next)}`;
    return { content: [{ type: "text", text }] };
});
server.tool("pplx_healthcheck", "Check readiness konfigurasi dan koneksi endpoint API.", {}, async () => {
    const masked = `${config.PERPLEXITY_API_KEY.slice(0, 6)}...${config.PERPLEXITY_API_KEY.slice(-4)}`;
    const text = [
        "status=ready",
        `base_url=${config.PPLX_BASE_URL}`,
        `timeout_ms=${config.PPLX_HTTP_TIMEOUT_MS}`,
        `max_retries=${config.PPLX_MAX_RETRIES}`,
        `concurrency=${config.PPLX_CONCURRENCY}`,
        `api_key=${masked}`
    ].join("\n");
    return { content: [{ type: "text", text }] };
});
async function main() {
    logger.info("Starting MCP server", {
        name: "perplexity-agent",
        version: "4.0.0",
        baseUrl: config.PPLX_BASE_URL
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    logger.error("Fatal startup error", { error: String(err) });
    process.exit(1);
});

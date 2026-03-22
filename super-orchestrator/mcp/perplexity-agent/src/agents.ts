import { config } from "./config.js";
import { postJson } from "./http.js";
import { logger } from "./logger.js";
import { PRESET_MODELS, type Preset, smartRoute, PRESET_SYSTEM_PROMPTS } from "./router.js";
import { contextAnalyzer } from "./context.js";
import { telemetry } from "./telemetry.js";
import { scout } from "./intelligence/scout.js";

const AGENT_ENDPOINT = `${config.PPLX_BASE_URL}/agent`;

export interface AgentCallParams {
  prompt: string;
  preset: Preset;
  includeContext?: boolean;
  responseFormat?: "text" | "json_object";
  extraTools?: Array<Record<string, unknown>>;
  scoutFirst?: boolean;
}
// ... (interfaces)

import { intelligence } from "./intelligence.js";

export interface AgentCallResult {
  text: string;
  citations: string[];
  searchResults: Array<{ title?: string; url?: string; date?: string }>;
  raw: unknown;
  /** How long the API call took in milliseconds */
  durationMs: number;
}

function extractText(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text) return data.output_text;
  const output = data?.output;
  if (Array.isArray(output)) {
    for (const item of output) {
      if (Array.isArray(item?.content)) {
        for (const content of item.content) {
          if (typeof content?.text === "string" && content.text) return content.text;
        }
      }
    }
  }
  return JSON.stringify(data);
}

export async function callAgent(params: AgentCallParams): Promise<AgentCallResult> {
  const memory = await intelligence.scoutSimilar(params.prompt);
  const memoryPrompt = intelligence.formatMemory(memory);

  // Enrichment Layer 2: Real-time Web Scout (You.com)
  let scoutReport = "";
  const isResearchTask = params.preset === "deep-research" || params.preset === "advanced-deep-research";
  if (isResearchTask || params.scoutFirst) {
    scoutReport = await scout.masterScout(params.prompt);
  }

  const context = params.includeContext ? await injectContext("") : ""; // Empty prompt for raw context
  const finalPrompt = params.prompt.trim();

  // Optimizing for Prompt Caching: Static parts (System + Context) come first.
  // Dynamic parts (Scout + Memories + Prompt) come last.
  const input = `[SYSTEM]: ${PRESET_SYSTEM_PROMPTS[params.preset]}\n\n[CONTEXT]:\n${context}\n\n[SCOUT]:\n${scoutReport}\n\n[MEMORY]:\n${memoryPrompt}\n\n[TASK]:\n${finalPrompt}`;

  const payload: Record<string, unknown> = {
    model: PRESET_MODELS[params.preset],
    preset: params.preset,
    input,
    stream: false,
    tools: [
      { type: "web_search" },
      { type: "fetch_url" },
      ...(params.extraTools ?? [])
    ]
  };

  // Cost-Optimization: Cap expensive model output
  if (params.preset === "advanced-deep-research") {
    payload.max_tokens = 2000; // Prevent runaway expensive generation
  }

  if (params.responseFormat) {
    payload.response_format = { type: params.responseFormat };
  }

  logger.debug("Calling Perplexity Agent", {
    preset: params.preset,
    model: PRESET_MODELS[params.preset],
    inputLength: input.length
  });

  const startMs = Date.now();
  let data: any;
  let success = false;
  let errorMsg: string | undefined;

  try {
    data = await postJson(AGENT_ENDPOINT, payload, {
      Authorization: `Bearer ${config.PERPLEXITY_API_KEY}`
    }, { preset: params.preset });
    success = true;
  } catch (err) {
    errorMsg = String(err);
    throw err;
  } finally {
    const durationMs = Date.now() - startMs;
    telemetry.record({
      preset: params.preset,
      durationMs,
      success,
      error: errorMsg
    });
    
    logger.info("Agent call recorded", {
      preset: params.preset,
      durationMs,
      success
    });
  }

  return {
    text: extractText(data),
    citations: Array.isArray(data?.citations) ? data.citations : [],
    searchResults: Array.isArray(data?.search_results) ? data.search_results : [],
    raw: data,
    durationMs: Date.now() - startMs
  };
}

async function injectContext(prompt: string): Promise<string> {
  const ctx = await contextAnalyzer.analyze();
  const contextStr = contextAnalyzer.format(ctx);
  return `${contextStr}\n\nTask:\n${prompt}`;
}

async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T, index: number) => Promise<unknown>) {
  const results: PromiseSettledResult<unknown>[] = new Array(items.length);
  let cursor = 0;

  async function consume(): Promise<void> {
    while (true) {
      const idx = cursor;
      cursor += 1;
      if (idx >= items.length) return;
      try {
        const value = await worker(items[idx], idx);
        results[idx] = { status: "fulfilled", value };
      } catch (error) {
        results[idx] = { status: "rejected", reason: error };
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => consume());
  await Promise.all(workers);
  return results;
}

export async function runParallelTasks(
  tasks: Array<{ id: string; prompt: string; preset?: Preset }>
): Promise<string> {
  const results = await runWithConcurrency(tasks, config.PPLX_CONCURRENCY, async (task) => {
      const preset = task.preset ?? smartRoute(task.prompt);
      const output = await callAgent({ prompt: task.prompt, preset });
      return { id: task.id, preset, output };
    });

  const formatted = results
    .map((r, i) => {
      if (r.status === "fulfilled") {
        const v = r.value as { id: string; preset: Preset; output: AgentCallResult };
        return `### ✅ [${v.id}] (${v.preset}, ${v.output.durationMs}ms)\n${v.output.text}`;
      }
      return `### ❌ [${tasks[i].id}] ERROR\n${String(r.reason)}`;
    })
    .join("\n\n---\n\n");

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  return `## Parallel Agent Results (${succeeded}/${tasks.length} succeeded)\n\n${formatted}`;
}

export async function testApiConnectivity(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  try {
    const startMs = Date.now();
    const data: any = await postJson(
      AGENT_ENDPOINT,
      {
        model: PRESET_MODELS["fast-search"],
        preset: "fast-search",
        input: "ping",
        stream: false,
        tools: [{ type: "web_search" }]
      },
      { Authorization: `Bearer ${config.PERPLEXITY_API_KEY}` },
      { timeoutMs: 15_000, preset: "fast-search" }
    );
    const latencyMs = Date.now() - startMs;
    return { ok: true, latencyMs };
  } catch (err) {
    return { ok: false, latencyMs: -1, error: String(err) };
  }
}

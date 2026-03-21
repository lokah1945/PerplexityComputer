import { config } from "./config.js";
import { postJson } from "./http.js";
import { logger } from "./logger.js";
import { PRESET_MODELS, smartRoute } from "./router.js";
const AGENT_ENDPOINT = `${config.PPLX_BASE_URL}/agent`;
function extractText(data) {
    if (typeof data?.output_text === "string" && data.output_text)
        return data.output_text;
    const output = data?.output;
    if (Array.isArray(output)) {
        for (const item of output) {
            if (Array.isArray(item?.content)) {
                for (const content of item.content) {
                    if (typeof content?.text === "string" && content.text)
                        return content.text;
                }
            }
        }
    }
    return JSON.stringify(data);
}
export async function callAgent(params) {
    const payload = {
        model: PRESET_MODELS[params.preset],
        preset: params.preset,
        input: params.prompt,
        stream: false,
        tools: [
            { type: "web_search" },
            { type: "fetch_url" },
            ...(params.extraTools ?? [])
        ]
    };
    if (params.responseFormat) {
        payload.response_format = { type: params.responseFormat };
    }
    logger.debug("Calling Perplexity Agent", {
        preset: params.preset,
        promptLength: params.prompt.length
    });
    const data = await postJson(AGENT_ENDPOINT, payload, {
        Authorization: `Bearer ${config.PERPLEXITY_API_KEY}`
    });
    return {
        text: extractText(data),
        citations: Array.isArray(data?.citations) ? data.citations : [],
        searchResults: Array.isArray(data?.search_results) ? data.search_results : [],
        raw: data
    };
}
async function runWithConcurrency(items, limit, worker) {
    const results = new Array(items.length);
    let cursor = 0;
    async function consume() {
        while (true) {
            const idx = cursor;
            cursor += 1;
            if (idx >= items.length)
                return;
            try {
                const value = await worker(items[idx], idx);
                results[idx] = { status: "fulfilled", value };
            }
            catch (error) {
                results[idx] = { status: "rejected", reason: error };
            }
        }
    }
    const workers = Array.from({ length: Math.min(limit, items.length) }, () => consume());
    await Promise.all(workers);
    return results;
}
export async function runParallelTasks(tasks) {
    const results = await runWithConcurrency(tasks, config.PPLX_CONCURRENCY, async (task) => {
        const preset = task.preset ?? smartRoute(task.prompt);
        const output = await callAgent({ prompt: task.prompt, preset });
        return { id: task.id, preset, output };
    });
    const formatted = results
        .map((r, i) => {
        if (r.status === "fulfilled") {
            const v = r.value;
            return `### [OK] [${v.id}] (${v.preset})\n${v.output.text}`;
        }
        return `### [ERROR] [${tasks[i].id}]\n${String(r.reason)}`;
    })
        .join("\n\n---\n\n");
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    return `## Parallel Agent Results (${succeeded}/${tasks.length} succeeded)\n\n${formatted}`;
}

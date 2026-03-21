import { config } from "./config.js";
import { logger } from "./logger.js";
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function isRetryable(status) {
    return status === 408 || status === 429 || status >= 500;
}
export async function postJson(url, body, headers) {
    let lastError;
    for (let attempt = 0; attempt <= config.PPLX_MAX_RETRIES; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), config.PPLX_HTTP_TIMEOUT_MS);
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...headers },
                body: JSON.stringify(body),
                signal: controller.signal
            });
            if (!res.ok) {
                const errText = await res.text();
                if (attempt < config.PPLX_MAX_RETRIES && isRetryable(res.status)) {
                    const delay = 250 * 2 ** attempt;
                    logger.warn("Retrying API request", { attempt: attempt + 1, status: res.status, delay });
                    await sleep(delay);
                    continue;
                }
                throw new Error(`HTTP ${res.status}: ${errText}`);
            }
            return (await res.json());
        }
        catch (error) {
            lastError = error;
            if (attempt < config.PPLX_MAX_RETRIES) {
                const delay = 250 * 2 ** attempt;
                logger.warn("Transient request failure, retrying", { attempt: attempt + 1, delay });
                await sleep(delay);
                continue;
            }
        }
        finally {
            clearTimeout(timeout);
        }
    }
    throw new Error(`Request failed after retries: ${String(lastError)}`);
}

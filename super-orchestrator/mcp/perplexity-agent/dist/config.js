import { z } from "zod";
const envSchema = z.object({
    PERPLEXITY_API_KEY: z.string().min(8),
    PPLX_BASE_URL: z.string().url().default("https://api.perplexity.ai/v1"),
    PPLX_HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
    PPLX_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
    PPLX_CONCURRENCY: z.coerce.number().int().min(1).max(12).default(4),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info")
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
}
export const config = parsed.data;

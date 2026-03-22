import { z } from "zod";

const envSchema = z.object({
  PERPLEXITY_API_KEY: z.string().min(8),
  PPLX_BASE_URL: z.string().url().default("https://api.perplexity.ai/v1"),
  PPLX_HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
  PPLX_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  PPLX_CONCURRENCY: z.coerce.number().int().min(1).max(12).default(4),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  WORKSPACE_ROOT: z.string().optional(),
  MONGODB_URI: z.string().url().default("mongodb://localhost:27017/super_orchestrator"),
  YOU_API_KEY: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const config = parsed.data;

/** Per-preset timeout overrides (ms). Deep research needs more time. */
export const PRESET_TIMEOUTS: Record<string, number> = {
  "fast-search": 30_000,
  "pro-search": 60_000,
  "deep-research": 120_000,
  "advanced-deep-research": 180_000
};

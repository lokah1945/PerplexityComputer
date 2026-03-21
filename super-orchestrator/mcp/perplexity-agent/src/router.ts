export type Preset =
  | "fast-search"
  | "pro-search"
  | "deep-research"
  | "advanced-deep-research";

export const PRESET_MODELS: Record<Preset, string> = {
  "fast-search": "xai/grok-4-1-fast-non-reasoning",
  "pro-search": "openai/gpt-5.1",
  "deep-research": "openai/gpt-5.2",
  "advanced-deep-research": "anthropic/claude-opus-4-6"
};

export function smartRoute(taskHint: string): Preset {
  const hint = taskHint.toLowerCase();
  if (/quick|lookup|version|check|cek|versi/.test(hint)) return "fast-search";
  if (/debug|fix|patch|error/.test(hint)) return "pro-search";
  if (/implement|build|create|buat|generate|refactor|architecture|arsitektur/.test(hint)) {
    return "advanced-deep-research";
  }
  return "deep-research";
}

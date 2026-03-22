import { PRESET_MODELS, PRESET_SYSTEM_PROMPTS } from "./router.js";

/**
 * Strategic auto-routing: determine the best preset based on task requirements
 * and cost efficiency.
 */
export function smartRoute(hint: string, inputLength?: number): Preset {
  const h = hint.toLowerCase();
  
  // Cost-Optimization: If input is huge (>150k chars) and not explicitly complex,
  // use the cheaper Pro model instead of Deep Research.
  const isLargeInput = (inputLength || 0) > 150000;

  // 1. Architecture & Design (Highest Complexity)
  if (/arch|desain|arsitekt|rancang|blueprint|system design|trade-off|schema|db design/.test(h)) {
    return "advanced-deep-research";
  }

  // 2. Implementation & Multi-file (High Complexity)
  if (/implement|build|create|buat|generate|refactor|migrate|migrasi|setup|scaffold|full code/.test(h)) {
    return "advanced-deep-research";
  }

  // 3. Debugging & Testing (Medium Complexity)
  if (/debug|fix|patch|error|bug|test|testing|lint|warning|issue|fails/.test(h)) {
    return "pro-search";
  }

  // 4. Quick lookups & facts (Low Complexity)
  if (/quick|lookup|version|check|cek|versi|latest|terbaru|compare|bandingkan|npm version|library version/.test(h)) {
    return "fast-search";
  }

  // Cost-aware default: Use GPT-5.1 (Pro) for large inputs unless Deep is strictly needed
  if (isLargeInput) {
    return "pro-search";
  }

  // Default to balanced research
  return "deep-research";
}

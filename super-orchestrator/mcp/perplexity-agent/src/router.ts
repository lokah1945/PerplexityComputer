export type Preset =
  | "fast-search"
  | "pro-search"
  | "deep-research"
  | "advanced-deep-research"
  | "consensus-reasoning";

export const PRESET_MODELS: Record<Preset, string> = {
  "fast-search": "xai/grok-4-1-fast-non-reasoning",
  "pro-search": "openai/gpt-5.1",
  "deep-research": "openai/gpt-5.2",
  "advanced-deep-research": "anthropic/claude-opus-4-6",
  "consensus-reasoning": "multi-agent-consensus"
};

export const PRESET_SYSTEM_PROMPTS: Record<Preset, string> = {
  "fast-search": "You are a speed-focused research assistant. Provide concise, accurate facts. Use web search extensively.",
  "pro-search": "You are a professional developer and debugger. Analyze errors deeply, suggest robust fixes, and follow best practices.",
  "deep-research": "You are a comprehensive research specialist. Synthesize information from multiple sources into a structured report.",
  "advanced-deep-research": "You are a world-class software architect and lead engineer. Design complex systems, generate production-ready code, and explain architectural trade-offs.",
  "consensus-reasoning": "Council of Agents mode. Multi-model consensus for high-stakes decisions."
};

/**
 * Strategic auto-routing: determine the best preset based on task requirements
 * and cost efficiency.
 */
export function smartRoute(hint: string, inputLength?: number): Preset {
  const h = hint.toLowerCase();
  
  const isLargeInput = (inputLength || 0) > 150000;

  // 1. Architecture & Design (Highest Complexity)
  if (/arch|desain|arsitekt|rancang|blueprint|system design|trade-off|schema|db design|keamanan|security/.test(h)) {
    return "consensus-reasoning";
  }

  // 2. Implementation & Multi-file (High Complexity)
  if (/implement|build|create|buat|generate|refactor|migrate|migrasi|setup|scaffold|full code/.test(h)) {
    return "advanced-deep-research";
  }

  if (/debug|fix|patch|error|bug|test|testing|lint|warning|issue|fails/.test(h)) {
    return "pro-search";
  }

  if (/quick|lookup|version|check|cek|versi|latest|terbaru|compare|bandingkan|npm version|library version/.test(h)) {
    return "fast-search";
  }

  if (/tujuan|apa itu|jelaskan|research|cari tahu|tell me about|how does|apa maksud/.test(h)) {
    return "deep-research"; 
  }

  if (isLargeInput) {
    return "pro-search";
  }

  return "deep-research";
}

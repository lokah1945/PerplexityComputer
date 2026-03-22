import { callAgent, type AgentCallResult } from "../agents.js";
import { logger } from "../logger.js";
import { type Preset } from "../router.js";

export interface ConsensusReport {
  agreed: boolean;
  finalDecision: string;
  rationale: string;
  contradictions: string[];
  metrics: {
    durationMs: number;
    modelsUsed: string[];
  };
}

export class ConsensusEngine {
  /**
   * Runs a task through the "Council of Agents" for high-stakes decisions.
   */
  public async runConsensus(prompt: string, preset: Preset): Promise<ConsensusReport> {
    const startMs = Date.now();
    logger.info("Invoking the Council of Agents for high-stakes reasoning...");

    // 1. Parallel Execution of two distinct top-tier models
    // We use different presets to trigger different models/behaviors
    const [resultA, resultB] = await Promise.all([
      callAgent({ prompt, preset, includeContext: true }),
      callAgent({ prompt, preset: "advanced-deep-research", includeContext: true })
    ]);

    // 2. Comparison Logic (The "Judge" Pass)
    const judgePrompt = `Sebagai Hakim AI, bandingkan dua solusi berikut untuk tugas: "${prompt}"
    
    SOLUSI A:
    ${resultA.text}
    
    SOLUSI B:
    ${resultB.text}
    
    Tugas Anda:
    1. Identifikasi kontradiksi faktual atau logis antara keduanya.
    2. Jika mereka setuju, sintesiskan menjadi satu jawaban terbaik.
    3. Jika mereka tidak setuju secara fundamental, tandai kontradiksi tersebut.
    
    Format output: JSON { "agreed": boolean, "synthesis": string, "rationale": string, "conflicts": string[] }`;

    const judgeResult = await callAgent({
      prompt: judgePrompt,
      preset: "pro-search", // Fast but smart enough for logic check
      responseFormat: "json_object"
    });

    try {
      const parsed = JSON.parse(judgeResult.text);
      
      // 3. Tie-Breaker (If needed)
      let finalDecision = parsed.synthesis;
      if (!parsed.agreed) {
        logger.warn("Council disagreement detected. Invoking Tie-Breaker...");
        const tieBreaker = await callAgent({
          prompt: `Selesaikan perselisihan antara Agent A dan B terkait: ${prompt}\n\nA said: ${resultA.text}\n\nB said: ${resultB.text}\n\nConflicts: ${parsed.conflicts.join(", ")}`,
          preset: "advanced-deep-research"
        });
        finalDecision = tieBreaker.text;
      }

      return {
        agreed: parsed.agreed,
        finalDecision,
        rationale: parsed.rationale,
        contradictions: parsed.conflicts || [],
        metrics: {
          durationMs: Date.now() - startMs,
          modelsUsed: ["Sonnet 3.5", "GPT-4o", "Opus (if tied)"]
        }
      };
    } catch (err) {
      logger.error("Consensus parsing failed", { error: String(err) });
      return {
        agreed: true, // Fallback to A
        finalDecision: resultA.text,
        rationale: "Consensus system error, defaulting to primary agent.",
        contradictions: [],
        metrics: { durationMs: Date.now() - startMs, modelsUsed: [] }
      };
    }
  }
}

export const consensus = new ConsensusEngine();

import { intelligence, type GoldenTrace } from "../intelligence.js";
import { callAgent } from "../agents.js";
import { logger } from "../logger.js";

export interface BenchmarkReport {
  totalTasks: number;
  passedTasks: number;
  precisionScore: number;
  avgDurationMs: number;
  avgTokens: number;
  regressions: string[];
}

export class BenchmarkEngine {
  public async runBenchmark(): Promise<BenchmarkReport> {
    const samples = await intelligence.getGoldenSamples(5); // Test top 5 successful traces
    if (samples.length === 0) {
      return { totalTasks: 0, passedTasks: 0, precisionScore: 0, avgDurationMs: 0, avgTokens: 0, regressions: [] };
    }

    let passed = 0;
    let totalDuration = 0;
    let totalTokens = 0;
    const regressions: string[] = [];

    logger.info(`Starting benchmark run with ${samples.length} tasks...`);

    for (const sample of samples) {
      const startMs = Date.now();
      try {
        const result = await callAgent({
          prompt: sample.taskDescription,
          preset: sample.preset,
          includeContext: true
        });

        const duration = Date.now() - startMs;
        totalDuration += duration;
        // In a real scenario, we would compare the output text similarity or run a validator
        // For now, if the API returns text, we consider it a pass for the benchmark logic demo
        if (result.text.length > 100) {
          passed++;
        } else {
          regressions.push(`Task: ${sample.taskDescription.slice(0, 30)}... - Output too short`);
        }
      } catch (err) {
        regressions.push(`Task: ${sample.taskDescription.slice(0, 30)}... - Failed with error`);
      }
    }

    const report: BenchmarkReport = {
      totalTasks: samples.length,
      passedTasks: passed,
      precisionScore: (passed / samples.length) * 100,
      avgDurationMs: totalDuration / samples.length,
      avgTokens: 0, // Placeholder for token tracking
      regressions
    };

    logger.info("Benchmark complete", { ...report } as any);
    return report;
  }
}

export const benchmark = new BenchmarkEngine();

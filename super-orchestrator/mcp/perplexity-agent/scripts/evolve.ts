import { benchmark } from "../src/intelligence/benchmark.js";
import { optimizer } from "../src/intelligence/optimizer.js";
import { logger } from "../src/logger.js";
import * as fs from "fs";
import * as path from "path";

async function main() {
  logger.info("Starting Autonomous Evolution Cycle...");

  const baseline = await benchmark.runBenchmark();
  logger.info(`Baseline Precision: ${baseline.precisionScore}%`);

  if (baseline.precisionScore === 100 && baseline.regressions.length === 0) {
    logger.info("System is at peak performance. No evolution needed.");
    return;
  }

  logger.info("Analyzing performance gaps...");
  const currentDir = process.cwd();
  const agentsMdPath = path.resolve(currentDir, "../../super-orchestrator/.brain/AGENTS.md");
  
  if (!fs.existsSync(agentsMdPath)) {
     logger.error("AGENTS.md not found", { path: agentsMdPath } as any);
     return;
  }

  const originalMd = fs.readFileSync(agentsMdPath, "utf-8");
  const modsections = optimizer.parseSections(originalMd);
  const protocolIdx = modsections.findIndex(s => s.heading.includes("Protocol"));
  if (protocolIdx !== -1) {
    modsections[protocolIdx].content += "\n- **Self-Correction Logic**: Always re-verify architectural assumptions before generating code.";
  }

  const modifiedMd = optimizer.reconstruct(modsections);
  const validation = optimizer.validate(originalMd, modifiedMd);
  if (!validation.valid) {
    logger.error("Optimization failed structural validation", { errors: validation.errors } as any);
    return;
  }

  fs.writeFileSync(agentsMdPath, modifiedMd);
  logger.info("Applied temporary optimizations. Running validation benchmark...");

  const newScore = await benchmark.runBenchmark();
  logger.info(`New Precision: ${newScore.precisionScore}%`);

  if (newScore.precisionScore >= baseline.precisionScore) {
    logger.info("Optimization PROMOTED. System has successfully evolved.");
  } else {
    logger.warn("Optimization REJECTED. Precision regression detected. Rolling back...");
    fs.writeFileSync(agentsMdPath, originalMd);
  }
}

main().catch(err => {
  console.error("Evolution cycle failed:", err);
  process.exit(1);
});

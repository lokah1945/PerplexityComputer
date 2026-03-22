import fs from "fs";
import path from "path";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { type Preset } from "./router.js";

const COST_PER_QUERY: Record<Preset, number> = {
  "fast-search": 0.0002,
  "pro-search": 0.003,
  "deep-research": 0.01,
  "advanced-deep-research": 0.05
};

export interface TelemetryEvent {
  preset: Preset;
  durationMs: number;
  tokens?: number;
  cacheReadTokens?: number;
  cacheCreatedTokens?: number;
  success: boolean;
  error?: string;
}

class TelemetryService {
  private logPath: string;

  constructor() {
    const brainDir = path.join(process.cwd(), ".brain", "telemetry");
    if (!fs.existsSync(brainDir)) {
      fs.mkdirSync(brainDir, { recursive: true });
    }
    this.logPath = path.join(brainDir, "usage.md");
    this.initializeLog();
  }

  private initializeLog() {
    if (!fs.existsSync(this.logPath)) {
      const header = `# Super-Orchestrator Telemetry Log\n\n| Timestamp | Preset | Duration (ms) | Cache Read | Cost ($) | Status |\n|---:|:---|---:|---:|---:|:---|\n`;
      fs.writeFileSync(this.logPath, header);
    }
  }

  public record(event: TelemetryEvent) {
    let cost = COST_PER_QUERY[event.preset] || 0;
    
    // Simple saving estimation: cache read tokens are 90% cheaper
    // We assume 1000 tokens = $0.01 for math simplicity in telemetry log
    const cacheSaving = (event.cacheReadTokens ?? 0) * 0.00001; 
    cost = Math.max(0, cost - cacheSaving);

    const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
    const status = event.success ? "✅ OK" : `❌ ERR: ${event.error?.slice(0, 20)}...`;
    const cacheTag = event.cacheReadTokens ? `🔄 ${event.cacheReadTokens}` : "➖";
    
    const line = `| ${timestamp} | ${event.preset} | ${event.durationMs} | ${cacheTag} | ${cost.toFixed(4)} | ${status} |\n`;

    fs.appendFileSync(this.logPath, line);
    logger.debug("Telemetry recorded", { preset: event.preset, cost, cacheSaving });
  }

  public async getSummary() {
    return `Telemetry log located at ${this.logPath}`;
  }
}

export const telemetry = new TelemetryService();

import { config } from "./config.js";

type Level = "debug" | "info" | "warn" | "error";

const levelOrder: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function emit(level: Level, message: string, meta?: Record<string, unknown>): void {
  if (levelOrder[level] < levelOrder[config.LOG_LEVEL]) return;
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...(meta ? { meta } : {})
  };
  const line = JSON.stringify(payload);
  if (level === "error" || level === "warn") {
    process.stderr.write(`${line}\n`);
  } else {
    process.stdout.write(`${line}\n`);
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => emit("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => emit("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit("error", message, meta)
};

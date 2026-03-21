import { config } from "./config.js";
const levelOrder = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40
};
function emit(level, message, meta) {
    if (levelOrder[level] < levelOrder[config.LOG_LEVEL])
        return;
    const payload = {
        ts: new Date().toISOString(),
        level,
        msg: message,
        ...(meta ? { meta } : {})
    };
    const line = JSON.stringify(payload);
    if (level === "error" || level === "warn") {
        process.stderr.write(`${line}\n`);
    }
    else {
        process.stdout.write(`${line}\n`);
    }
}
export const logger = {
    debug: (message, meta) => emit("debug", message, meta),
    info: (message, meta) => emit("info", message, meta),
    warn: (message, meta) => emit("warn", message, meta),
    error: (message, meta) => emit("error", message, meta)
};

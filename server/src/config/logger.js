import { env } from "./env.js";

function write(level, message, meta = {}) {
  const { timestamp: _t, level: _l, message: _m, ...safeMeta } = meta;
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...safeMeta,
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  if (level === "debug" && env.nodeEnv === "production") {
    return;
  }

  console.log(line);
}

export const logger = Object.freeze({
  info(message, meta) {
    write("info", message, meta);
  },
  warn(message, meta) {
    write("warn", message, meta);
  },
  error(message, meta) {
    write("error", message, meta);
  },
  debug(message, meta) {
    write("debug", message, meta);
  },
});

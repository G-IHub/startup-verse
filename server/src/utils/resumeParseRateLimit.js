const parseCounts = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PARSES_PER_WINDOW = 5;

export function checkResumeParseRateLimit(userId) {
  const key = String(userId || "");
  const now = Date.now();
  const entry = parseCounts.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    parseCounts.set(key, { windowStart: now, count: 1 });
    return { allowed: true };
  }

  if (entry.count >= MAX_PARSES_PER_WINDOW) {
    return {
      allowed: false,
      message: "Resume parse limit reached. Try again in about an hour.",
    };
  }

  entry.count += 1;
  parseCounts.set(key, entry);
  return { allowed: true };
}

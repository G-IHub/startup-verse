/**
 * Console policy
 * Keeps browser console focused on actionable issues.
 */

const NOOP = () => {};
const DEDUPE_WINDOW_MS = 30000;

const warnCache = new Map();
const errorCache = new Map();

function shouldSkipDuplicate(cache, args) {
  const key = args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      if (arg instanceof Error) return `${arg.name}:${arg.message}`;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join("|");

  const now = Date.now();
  const lastSeen = cache.get(key);
  if (lastSeen && now - lastSeen < DEDUPE_WINDOW_MS) {
    return true;
  }

  cache.set(key, now);
  return false;
}

export function applyConsolePolicy() {
  if (typeof window === "undefined") return;

  const verboseLogsEnabled = import.meta.env.VITE_VERBOSE_CONSOLE === "true";

  const nativeWarn = console.warn.bind(console);
  const nativeError = console.error.bind(console);

  if (!verboseLogsEnabled) {
    console.log = NOOP;
    console.info = NOOP;
    console.debug = NOOP;
  }

  console.warn = (...args) => {
    if (shouldSkipDuplicate(warnCache, args)) return;
    nativeWarn(...args);
  };

  console.error = (...args) => {
    if (shouldSkipDuplicate(errorCache, args)) return;
    nativeError(...args);
  };
}

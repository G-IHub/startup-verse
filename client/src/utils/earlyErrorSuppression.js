/**
 * EARLY ERROR SUPPRESSION
 * This runs BEFORE React initializes to catch Figma preview errors
 * Must be imported at the very top of the entry file
 */

// Patterns to suppress (Figma infrastructure errors only)
const SUPPRESSED_PATTERNS = [
  "IframeMessageAbortError",
  "message port was destroyed",
  "ResizeObserver loop",
  "figma.com/webpack-artifacts",
  "setupMessageChannel",
  "cleanup",
];

/**
 * Check if a message should be suppressed
 */
function shouldSuppressMessage(args) {
  const message = args.join(" ");
  return SUPPRESSED_PATTERNS.some((pattern) => message.includes(pattern));
}

/**
 * Check if an error should be suppressed
 */
function shouldSuppressError(error, message, source) {
  const errorMsg = message || error?.message || error?.toString() || "";
  const errorStack = error?.stack || "";
  const errorSource = source || "";

  return SUPPRESSED_PATTERNS.some(
    (pattern) =>
      errorMsg.includes(pattern) ||
      errorStack.includes(pattern) ||
      errorSource.includes(pattern),
  );
}

// Store original console methods
const originalError = console.error;
const originalWarn = console.warn;

// Override console methods
console.error = function (...args) {
  if (!shouldSuppressMessage(args)) {
    originalError.apply(console, args);
  }
};

console.warn = function (...args) {
  if (!shouldSuppressMessage(args)) {
    originalWarn.apply(console, args);
  }
};

// Add global error handlers to catch runtime errors
if (typeof window !== "undefined") {
  // Catch synchronous errors
  window.addEventListener(
    "error",
    (event) => {
      if (shouldSuppressError(event.error, event.message, event.filename)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    },
    true,
  ); // Use capture phase

  // Catch promise rejections
  window.addEventListener(
    "unhandledrejection",
    (event) => {
      if (shouldSuppressError(event.reason)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    },
    true,
  ); // Use capture phase
}

export {};

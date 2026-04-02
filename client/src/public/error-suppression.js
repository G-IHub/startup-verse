/**
 * Ultra-early error suppression.
 * This runs before app bootstrapping code.
 */

(function () {
  "use strict";

  const FIGMA_PATTERNS = [
    "IframeMessageAbortError",
    "message port was destroyed",
    "Message aborted",
    "setupMessageChannel",
    "figma.com/webpack-artifacts",
    "figma_app-",
    ".min.js.br",
    "s.cleanup",
    "l.cleanup",
    "eS.setupMessageChannel",
    "ResizeObserver",
  ];

  function shouldSuppress(msg, stack, source) {
    const fullText = [msg, stack, source].join(" ");
    return FIGMA_PATTERNS.some((pattern) => fullText.includes(pattern));
  }

  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = function (...args) {
    const message = args.join(" ");
    if (!shouldSuppress(message, "", "")) {
      originalError.apply(console, args);
    }
  };

  console.warn = function (...args) {
    const message = args.join(" ");
    if (!shouldSuppress(message, "", "")) {
      originalWarn.apply(console, args);
    }
  };

  window.onerror = function (message, source, lineno, colno, error) {
    const msg = String(message || "");
    const stack = error?.stack || "";
    const src = source || "";

    if (shouldSuppress(msg, stack, src)) {
      return true;
    }
    return false;
  };

  window.onunhandledrejection = function (event) {
    const reason = String(event.reason || "");
    const stack = event.reason?.stack || "";

    if (shouldSuppress(reason, stack, "")) {
      event.preventDefault();
      return true;
    }
    return false;
  };

  window.addEventListener(
    "error",
    function (event) {
      if (
        shouldSuppress(event.message, event.error?.stack || "", event.filename)
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return false;
      }
    },
    true,
  );

  window.addEventListener(
    "unhandledrejection",
    function (event) {
      const reason = String(event.reason || "");
      const stack = event.reason?.stack || "";

      if (shouldSuppress(reason, stack, "")) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return false;
      }
    },
    true,
  );
})();

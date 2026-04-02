/**
 * Initialize all error suppression
 * NOTE: Early suppression already handles most errors via earlyErrorSuppression.
 */
export function initializeErrorSuppression() {
  // No-op: early suppression is loaded before React bootstraps.
}

/**
 * Global error handler for uncaught errors
 * NOTE: Not used - handled by early suppression.
 */
export function setupGlobalErrorHandler() {
  // No-op
}

/**
 * Suppress errors related to embedded iframes
 * NOTE: Not used - handled by early suppression.
 */
export function suppressFigmaIframeErrors() {
  // No-op
}

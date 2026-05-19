/**
 * HTTP security headers (Step 6.2 / X2).
 * Disable with HELMET_DISABLED=true.
 */
import helmet from "helmet";

function isHelmetDisabled() {
  return (
    String(process.env.HELMET_DISABLED || "")
      .trim()
      .toLowerCase() === "true"
  );
}

const isProduction = process.env.NODE_ENV === "production";

const helmetOptions = {
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  strictTransportSecurity: isProduction,
};

const helmetHandler = helmet(helmetOptions);

export function securityHeadersMiddleware(req, res, next) {
  if (isHelmetDisabled()) return next();
  return helmetHandler(req, res, next);
}

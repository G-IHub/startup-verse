import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { corsOptions } from "./config/cors.js";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";
import requestId from "./middleware/requestId.js";
import apiRouter from "./routes/index.js";
import hostedSitePublicRouter from "./routes/hostedSitePublic.js";
import customDomainPublicMiddleware from "./routes/customDomainPublic.js";
import { getUploadRoot } from "./services/storage.js";
import { success as apiSuccess } from "./utils/apiResponse.js";

const app = express();

const SITES_HOSTNAME = process.env.SITES_HOSTNAME || "sites.startupverse.space";

/**
 * Robust hostname resolution — works behind proxies (Railway, Render,
 * Cloudflare) that rewrite Host or add X-Forwarded-Host. Checks in order:
 *   1. X-Forwarded-Host (proxy-set, may be comma-separated — take the first)
 *   2. req.headers.host (raw Host header from the client, includes port)
 *   3. req.hostname (Express-parsed fallback)
 */
function resolveHostname(req) {
  const fwd = req.headers["x-forwarded-host"];
  if (fwd) return String(fwd).split(",")[0].trim().split(":")[0].toLowerCase();
  const raw = req.headers.host;
  if (raw) return String(raw).split(":")[0].toLowerCase();
  return (req.hostname || "").toLowerCase();
}

// Real hosted-site CORS carve-out (2026-09-15): sites.startupverse.space is
// a fully public, unauthenticated surface (hosted pages + their real
// form-submit endpoint, hostedSitePublic.js) that must accept a request
// from ANY origin — including a founder's own real custom domain (Part 3),
// which is a genuinely cross-origin request from that domain's point of
// view. Runs BEFORE the main app's restrictive, allowlisted CORS policy
// below, which would otherwise reject an unrecognized origin's preflight
// before this host's own routes ever got a chance to respond. Every other
// host falls through to the real app-wide policy completely unchanged.
app.use((req, res, next) => {
  if (resolveHostname(req) !== SITES_HOSTNAME.toLowerCase()) return next();
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  return next();
});

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(requestId);

// Step 2.1 disk-driver static mount. Serves files persisted by
// `saveBufferToDisk` under the `/uploads/*` URL prefix that the disk driver
// hands back. Safe under the Cloudinary driver too (directory may not exist
// yet; `fallthrough: true` lets the request fall through to `notFound`).
app.use(
  "/uploads",
  express.static(getUploadRoot(), { fallthrough: true, maxAge: "1d" }),
);

// Real custom-domain feature (2026-09-15, Part 3): checks the request's
// real hostname against a real, verified CustomDomain before anything
// else gets a chance to respond — must run before the generic "/" handler
// below, which otherwise has no hostname awareness at all. Falls through
// via next() for every host that isn't a real matched custom domain.
app.use(customDomainPublicMiddleware);

app.get("/", (req, res) => {
  return apiSuccess(res, {
    service: "StartupVerse API",
    requestId: req.id || null,
  });
});

app.get("/health", (req, res) => {
  return apiSuccess(res, {
    status: "ok",
    timestamp: new Date().toISOString(),
    requestId: req.id || null,
  });
});

// Real hosted-link feature (2026-09-15): only ever engages for requests to
// the dedicated sites.startupverse.space host (see hostedSitePublic.js) —
// calls next() for every other host, so this has zero effect on the main
// app/API. Mounted before /api/v1 so it never has to compete with it, even
// though the single-segment /:slug pattern couldn't match a /api/v1/* path
// anyway.
app.use(hostedSitePublicRouter);

app.use("/api/v1", apiRouter);

app.get("/policy", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Privacy Policy — StartupVerse</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:15px;line-height:1.7;color:#1a1a1a;background:#fff;padding:48px 24px}
  .wrap{max-width:720px;margin:0 auto}
  h1{font-size:28px;font-weight:700;margin-bottom:6px}
  .sub{color:#6b7280;font-size:13px;margin-bottom:40px}
  h2{font-size:17px;font-weight:600;margin:32px 0 10px}
  p{margin-bottom:14px;color:#374151}
  ul{padding-left:20px;margin-bottom:14px;color:#374151}
  li{margin-bottom:6px}
  a{color:#4f46e5}
  .footer{margin-top:48px;padding-top:24px;border-top:1px solid #e5e7eb;font-size:13px;color:#9ca3af}
</style>
</head>
<body>
<div class="wrap">
  <h1>Privacy Policy</h1>
  <p class="sub">StartupVerse &nbsp;·&nbsp; Last updated: September 2026</p>

  <p>StartupVerse ("we", "our", or "us") operates the StartupVerse platform, an AI-powered execution environment for founders. This Privacy Policy explains how we collect, use, and protect information when you use our services, including integrations with third-party platforms such as LinkedIn.</p>

  <h2>1. Information We Collect</h2>
  <p>When you connect a third-party account (such as LinkedIn), we may collect:</p>
  <ul>
    <li>Your name and profile picture provided by the third-party platform</li>
    <li>A unique identifier (e.g. LinkedIn person URN) used to publish content on your behalf</li>
    <li>OAuth access tokens required to perform actions you have authorized</li>
  </ul>
  <p>We do not collect passwords, payment card numbers, or sensitive personal data through third-party OAuth integrations.</p>

  <h2>2. How We Use Your Information</h2>
  <p>Information collected through integrations is used solely to provide the features you have enabled:</p>
  <ul>
    <li><strong>LinkedIn integration:</strong> We use your OAuth token and person identifier to publish posts to your LinkedIn profile on your behalf, only when you explicitly initiate a post from within StartupVerse.</li>
    <li>We do not use your data for advertising, profiling, or selling to third parties.</li>
    <li>We do not read your LinkedIn inbox, connections, or any data beyond what is required to publish a post.</li>
  </ul>

  <h2>3. Data Storage and Security</h2>
  <p>OAuth access tokens are stored securely in our database with access restricted to your founder account. We use industry-standard security practices to protect stored credentials. Tokens are never logged or exposed in client-side code.</p>

  <h2>4. Data Sharing</h2>
  <p>We do not sell, rent, or share your personal data with third parties, except:</p>
  <ul>
    <li>To the platform you have connected (e.g. LinkedIn receives your post content when you publish)</li>
    <li>Where required by law or to protect the rights and safety of our users</li>
  </ul>

  <h2>5. Your Rights and Controls</h2>
  <p>You are in full control of your integrations:</p>
  <ul>
    <li><strong>Disconnect at any time:</strong> Go to StartupVerse → Integrations → LinkedIn → Disconnect. This removes your stored token immediately.</li>
    <li><strong>Revoke via LinkedIn:</strong> You can also revoke access directly from LinkedIn Settings → Security → Authorized applications.</li>
    <li><strong>Data deletion:</strong> To request deletion of all data associated with your account, contact us at the address below.</li>
  </ul>

  <h2>6. Third-Party Platforms</h2>
  <p>When you connect LinkedIn or other platforms, their own privacy policies also apply. We encourage you to review LinkedIn's Privacy Policy at <a href="https://www.linkedin.com/legal/privacy-policy" target="_blank" rel="noopener">linkedin.com/legal/privacy-policy</a>.</p>

  <h2>7. Changes to This Policy</h2>
  <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date at the top of this page. Continued use of StartupVerse after changes are posted constitutes your acceptance of the revised policy.</p>

  <h2>8. Contact Us</h2>
  <p>If you have questions or requests regarding your data, please contact us at:<br/>
  <a href="mailto:genomachub@gmail.com">genomachub@gmail.com</a></p>

  <div class="footer">© 2026 StartupVerse. All rights reserved.</div>
</div>
</body>
</html>`);
});

app.use(notFound);
app.use(errorHandler);

export default app;


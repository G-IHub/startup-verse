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
  if (req.hostname !== SITES_HOSTNAME) return next();
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

app.use(notFound);
app.use(errorHandler);

export default app;


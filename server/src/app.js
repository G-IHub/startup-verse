import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { corsOptions } from "./config/cors.js";
import { Sentry, sentryEnabled } from "./config/sentry.js";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";
import requestId from "./middleware/requestId.js";
import { securityHeadersMiddleware } from "./middleware/securityHeaders.js";
import {
  apiDefaultLimiter,
  authBurstLimiter,
  bulkSendLimiter,
  uploadLimiter,
} from "./middleware/rateLimit.js";
import apiRouter from "./routes/index.js";
import { success as apiSuccess } from "./utils/apiResponse.js";

const app = express();

app.use(securityHeadersMiddleware);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(requestId);

if (
  process.env.TRUST_PROXY === "true" ||
  process.env.NODE_ENV === "production"
) {
  app.set("trust proxy", 1);
}

app.use("/api/v1/auth/signin", authBurstLimiter);
app.use("/api/v1/auth/signup", authBurstLimiter);
app.use("/api/v1/uploads", uploadLimiter);
app.use("/api/v1/messages/bulk-send", bulkSendLimiter);
app.use("/api/v1", apiDefaultLimiter);

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

app.use("/api/v1", apiRouter);

app.use(notFound);
if (sentryEnabled) {
  Sentry.setupExpressErrorHandler(app);
}
app.use(errorHandler);

export default app;


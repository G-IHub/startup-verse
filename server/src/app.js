import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { corsOptions } from "./config/cors.js";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";
import requestId from "./middleware/requestId.js";
import apiRouter from "./routes/index.js";
import { getUploadRoot } from "./services/storage.js";
import { success as apiSuccess } from "./utils/apiResponse.js";

const app = express();

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
app.use(errorHandler);

export default app;


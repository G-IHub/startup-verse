import cors from "cors";
import express from "express";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";

const app = express();
const configuredCorsOrigin = (process.env.CORS_ORIGIN || "").trim();
const allowAnyOrigin =
  configuredCorsOrigin.length === 0 || configuredCorsOrigin === "*";

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: Boolean(
      process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== "*",
    ),
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      service: "StartupVerse API",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;

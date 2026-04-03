import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const REQUIRED_ENV_VARS = [
  "NODE_ENV",
  "PORT",
  "CORS_ORIGIN",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "MONGODB_CONNECTION_URI",
];

function getMissingEnvVars() {
  return REQUIRED_ENV_VARS.filter((name) => {
    const value = process.env[name];
    return typeof value !== "string" || value.trim().length === 0;
  });
}

function parsePort(rawPort) {
  const parsed = Number(rawPort);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("PORT must be a positive integer.");
  }
  return parsed;
}

function parseCorsOrigins(rawOrigin) {
  const origins = rawOrigin
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error("CORS_ORIGIN must contain at least one origin.");
  }

  return origins;
}

const missingEnvVars = getMissingEnvVars();

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
}

const nodeEnv = process.env.NODE_ENV.trim();
const port = parsePort(process.env.PORT.trim());
const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGIN.trim());

export const env = Object.freeze({
  nodeEnv,
  port,
  corsOrigins,
  jwtSecret: process.env.JWT_SECRET.trim(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN.trim(),
  mongodbConnectionUri: process.env.MONGODB_CONNECTION_URI.trim(),
  mongodbDbName: process.env.MONGODB_DB_NAME?.trim() || "",
});


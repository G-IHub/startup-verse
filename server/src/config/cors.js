import { env } from "./env.js";

const isWildcardCors = env.corsOrigins.length === 1 && env.corsOrigins[0] === "*";

export const corsOptions = Object.freeze({
  origin: isWildcardCors ? "*" : env.corsOrigins,
  credentials: !isWildcardCors,
});


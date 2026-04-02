import jwt from "jsonwebtoken";
import { env } from "./env.js";

export function signAuthToken({ userId, role, isAdmin = false }) {
  return jwt.sign(
    {
      userId,
      role,
      isAdmin: Boolean(isAdmin),
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, env.jwtSecret);
}


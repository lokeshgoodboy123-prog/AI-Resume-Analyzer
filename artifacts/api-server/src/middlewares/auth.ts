import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../lib/logger";

interface JwtPayload {
  userId: string;
}

// Extend Express Request to include userId
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = auth.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    logger.error("JWT_SECRET is not configured");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
}

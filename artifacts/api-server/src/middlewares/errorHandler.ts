import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger";

export interface AppError {
  status?: number;
  message: string;
}

/**
 * Centralized JSON error handler.
 * Must be registered AFTER all routes with 4 arguments so Express treats it as
 * an error-handling middleware.
 */
export function errorHandler(
  err: AppError & Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Multer file size / type errors
  if (err.message?.includes("Only PDF and DOCX") || err.message?.includes("File too large")) {
    res.status(400).json({ error: err.message });
    return;
  }

  // Mongoose CastError (invalid ObjectId)
  if ((err as unknown as { name: string }).name === "CastError") {
    res.status(400).json({ error: "Invalid ID format" });
    return;
  }

  // Mongoose ValidationError
  if ((err as unknown as { name: string }).name === "ValidationError") {
    res.status(400).json({ error: err.message });
    return;
  }

  // JWT errors
  if (
    (err as unknown as { name: string }).name === "JsonWebTokenError" ||
    (err as unknown as { name: string }).name === "TokenExpiredError"
  ) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const status = err.status ?? 500;

  if (status >= 500) {
    req.log?.error({ err }, "Unhandled server error");
    logger.error({ err, url: req.url, method: req.method }, "Unhandled error");
  }

  res.status(status).json({ error: status >= 500 ? "Internal server error" : err.message });
}

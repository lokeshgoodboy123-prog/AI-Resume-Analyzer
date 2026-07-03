import mongoose from "mongoose";
import { logger } from "./logger";

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.warn("MONGODB_URI not set — MongoDB features will be unavailable");
    return;
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    logger.info("MongoDB connected successfully");
  } catch (err) {
    logger.error({ err }, "MongoDB connection error");
    // Don't crash — let health endpoint still work
  }
}

export function isDBConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

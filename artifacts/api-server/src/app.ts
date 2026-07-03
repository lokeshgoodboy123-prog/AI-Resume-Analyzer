import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { connectDB } from "./lib/mongodb";
import { errorHandler } from "./middlewares/errorHandler";

const app: Express = express();

// Connect to MongoDB (non-blocking — health endpoint still works if DB is down)
connectDB().catch((err) =>
  logger.error({ err }, "Failed to initiate MongoDB connection"),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Centralized error handler — must be after routes
app.use(errorHandler);

export default app;

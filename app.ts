import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { orderRouter } from "./src/order.controller";

export const app = express();

// =========================
// Global Middlewares
// =========================
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// =========================
// Health Check
// =========================
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// =========================
// Routes
// =========================
app.use("/api/orders", orderRouter);

// =========================
// 404 Handler
// =========================
app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// =========================
// Global Error Handler
// =========================
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);

    res.status(err.status || 500).json({
      message: err.message || "Internal Server Error",
    });
  }
);
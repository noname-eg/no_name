import "dotenv/config";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { registerAuthRoutes } from "./auth";
import { registerStoreRoutes } from "./routes/store";

export function createServer() {
  const app = express();

  app.disable("x-powered-by");
  const isProduction = process.env.NODE_ENV === "production";
  app.use(cors(isProduction && process.env.APP_ORIGIN ? { origin: process.env.APP_ORIGIN, credentials: true } : { origin: true, credentials: true }));
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    next();
  });

  app.get("/api/ping", (_req, res) => {
    res.json({ message: "ok" });
  });

  app.get("/api/demo", handleDemo);
  registerAuthRoutes(app);
  registerStoreRoutes(app);

  return app;
}

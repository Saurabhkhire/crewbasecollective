import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { publicFormsRouter } from "./routes/forms.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, mode: "api" });
  });

  app.use("/api", publicFormsRouter);

  return app;
}

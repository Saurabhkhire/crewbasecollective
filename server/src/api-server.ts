import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApp } from "./app.js";
import { IMAGES_DIR, PUBLIC_IMAGES_DIR } from "./data/repository.js";

const app = createApp();
const PORT = parseInt(process.env.PORT || "4000", 10);

if (!process.env.VERCEL) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.resolve(__dirname, "../../client/dist");

  // Serve uploaded content images before the SPA catch-all
  app.use("/images", express.static(IMAGES_DIR));
  app.use("/images", express.static(PUBLIC_IMAGES_DIR));

  app.use(express.static(clientDist));
  app.get(/^(?!\/api)(?!\/images).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) res.status(404).send("Not found");
    });
  });
}

app.listen(PORT, () => {
  console.log(`Crewbase Collective API on http://localhost:${PORT}`);
});

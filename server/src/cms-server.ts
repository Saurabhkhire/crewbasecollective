import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { cmsRouter } from "./cms-routes.js";
import { IMAGES_DIR, buildDerivedData } from "./data/repository.js";
import { publicFormsRouter } from "./routes/forms.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.CMS_PORT || "4001", 10);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mode: "cms" });
});

// Serve local images for CMS preview
app.use("/images", express.static(IMAGES_DIR));

app.use("/api", publicFormsRouter);
app.use("/api/admin", cmsRouter);

// Nominatim place search for CMS location picker
app.get("/api/places/search", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < 2) {
      res.json([]);
      return;
    }
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("q", q);
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "6");
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "CrewbaseCollective/1.0 (CMS location picker)",
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      res.status(502).json({ error: "Place search unavailable" });
      return;
    }
    const rows = (await response.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      type?: string;
      class?: string;
    }>;
    res.json(
      rows.map((row) => ({
        label: row.display_name,
        lat: row.lat,
        lng: row.lon,
        type: row.type || row.class || null,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Place search failed" });
  }
});

try {
  buildDerivedData();
} catch (err) {
  console.warn("Initial buildDerivedData:", err);
}

app.listen(PORT, () => {
  console.log(`Crewbase CMS API on http://localhost:${PORT}`);
  console.log(`Admin UI: run npm run dev -w cms (proxies /api here)`);
});

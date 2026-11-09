/* Local preview, no dependencies (Node 18+).
   Serves public/ exactly like Vercel will, plus the AI endpoint from api/chat.js.
   Run:  npm run dev   →  http://localhost:3000/aimultiplayerhackathon-visual
*/
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "./api/chat.js";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(DIR, "public");
const PORT = Number(process.env.PORT) || 3000;
const BASE = "/aimultiplayerhackathon-visual";

// tiny .env loader (this folder only)
try {
  for (const line of fs.readFileSync(path.join(DIR, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".webp": "image/webp" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");

  if (url.pathname === BASE + "/api/chat" || url.pathname === "/api/chat") {
    let raw = "";
    for await (const c of req) { raw += c; if (raw.length > 60000) { res.writeHead(413); return res.end(); } }
    try { req.body = raw ? JSON.parse(raw) : undefined; } catch { req.body = raw; }
    res.status = code => { res.statusCode = code; return res; };
    res.json = obj => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(obj)); };
    return handler(req, res);
  }

  if (url.pathname === "/") { res.writeHead(302, { location: BASE }); return res.end(); }

  let file = path.normalize(path.join(PUBLIC, decodeURIComponent(url.pathname)));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { "content-type": "text/plain" }); return res.end("Not found"); }
    res.writeHead(200, { "content-type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`\n  AI Multiplayer Hackathon (visual) → http://localhost:${PORT}${BASE}`);
  console.log(process.env.OPENAI_API_KEY ? `  LLM agents: ON (${process.env.OPENAI_MODEL || "gpt-4.1-mini"})` : "  LLM agents: OFF (no OPENAI_API_KEY in .env), using offline agents");
});

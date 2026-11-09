// @ts-nocheck  (plain JS kept as .ts to match the other client/api functions)
/**
 * AI agents endpoint for the AI Multiplayer Hackathon visual site.
 * Only used by client/public/aim-hack-visual/.
 *
 *   GET  /api/aim-hack-chat  → { ok, llm, model }               (is LLM mode available?)
 *   POST /api/aim-hack-chat  { system, user, temperature } → { content }  (OpenAI JSON reply as a string)
 *   POST /api/aim-hack-chat  { kind: "image", prompt }      → { b64, format } (one generated image)
 *
 * The browser calls /api/aim-hack-chat directly (no rewrites needed).
 *
 * Env:
 *   OPENAI_API_KEY        required for LLM mode (otherwise the playground uses offline agents)
 *   OPENAI_MODEL          optional, default gpt-4.1-mini
 *   OPENAI_IMAGE_MODEL    optional, default gpt-image-1-mini (falls back to gpt-image-1)
 *   AIMP_IMAGES           optional, set to "off" to disable image generation
 *   AIMP_ALLOWED_ORIGINS  optional, comma list of allowed hostnames
 */

const MODEL = () => process.env.OPENAI_MODEL || "gpt-4.1-mini";
const KEY = () => process.env.OPENAI_API_KEY || "";
const IMAGE_MODEL = () => process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini";
const IMAGES_ON = () => !!KEY() && process.env.AIMP_IMAGES !== "off";

export const config = { maxDuration: 60 };

function allowedHosts() {
  const list = (process.env.AIMP_ALLOWED_ORIGINS || "crewbasecollective.com,localhost,127.0.0.1").split(",");
  // this project's own Vercel domains
  if (process.env.VERCEL_URL) list.push(process.env.VERCEL_URL);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) list.push(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  return list.map(s => s.trim().toLowerCase()).filter(Boolean);
}
function hostAllowed(req) {
  const src = String(req.headers?.origin || req.headers?.referer || "");
  if (!src) return false;
  try {
    const host = new URL(src).hostname.toLowerCase();
    return allowedHosts().some(a => host === a || host.endsWith("." + a));
  } catch { return false; }
}

// best-effort per-instance rate limit
const hits = new Map();
function limited(ip, map = hits, max = 90) {
  const now = Date.now(), arr = (map.get(ip) || []).filter(t => now - t < 60000);
  arr.push(now); map.set(ip, arr);
  return arr.length > max;
}
const imageHits = new Map();

async function makeImage(prompt, key) {
  const tries = [IMAGE_MODEL(), "gpt-image-1-mini", "gpt-image-1"].filter((m, i, a) => a.indexOf(m) === i);
  let lastErr = "Image generation failed";
  for (const model of tries) {
    const body = { model, prompt, n: 1, size: "1024x1024", quality: "low", output_format: "jpeg" };
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify(body)
    });
    const j = await r.json().catch(() => ({}));
    const b64 = j?.data?.[0]?.b64_json;
    if (r.ok && b64) return { b64, format: "jpeg" };
    lastErr = j?.error?.message || lastErr;
  }
  throw new Error(lastErr);
}

export default async function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  const key = KEY(), model = MODEL();

  if (req.method === "GET") return res.status(200).json({ ok: true, llm: !!key, model: key ? model : null, images: IMAGES_ON() });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!key) return res.status(503).json({ error: "No OPENAI_API_KEY configured." });
  if (!hostAllowed(req)) return res.status(403).json({ error: "Origin not allowed." });

  const ip = String(req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return res.status(429).json({ error: "Too many requests. Slow down a little." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Bad JSON" }); } }

  if (body?.kind === "image") {
    if (!IMAGES_ON()) return res.status(503).json({ error: "Image generation is off." });
    if (limited(ip, imageHits, 8)) return res.status(429).json({ error: "Too many images. Wait a minute." });
    const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 1500) : "";
    if (!prompt) return res.status(400).json({ error: "prompt required" });
    try { return res.status(200).json(await makeImage(prompt, key)); }
    catch (e) { return res.status(502).json({ error: e?.message || "Image generation failed" }); }
  }
  const system = body?.system, user = body?.user;
  if (typeof system !== "string" || typeof user !== "string") return res.status(400).json({ error: "system and user strings required" });

  const payload = {
    model,
    messages: [{ role: "system", content: system.slice(0, 12000) }, { role: "user", content: user.slice(0, 20000) }],
    response_format: { type: "json_object" },
    max_completion_tokens: 700
  };
  // reasoning models (o-series, gpt-5*) don't accept a custom temperature
  if (!/^(o\d|gpt-5)/.test(model)) payload.temperature = Math.min(1.3, Math.max(0, Number(body.temperature) || 1));

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify(payload)
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: j?.error?.message || "OpenAI error" });
    return res.status(200).json({ content: j?.choices?.[0]?.message?.content || "{}" });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach OpenAI: " + (e?.message || "unknown") });
  }
}

// @ts-nocheck  (plain JS kept as .ts to match the other client/api functions)
/**
 * AI agents endpoint for the AI Multiplayer Hackathon visual site.
 * Only used by client/public/aim-hack-visual/.
 *
 *   GET  /api/aim-hack-chat  → { ok, llm, images, providers: { openai, adal }, model, adalModel }
 *   POST /api/aim-hack-chat  { system, user, temperature, provider } → { content, provider }  (agent JSON reply as a string)
 *   POST /api/aim-hack-chat  { kind: "image", prompt, provider }      → { b64, format, provider } (one generated image)
 *
 * The visitor picks the provider in the page ("openai" or "adal"); a provider can only be used
 * when its keys are set below. If AdaL fails or times out, the request falls back to OpenAI.
 *
 * The browser calls /api/aim-hack-chat directly (no rewrites needed).
 *
 * Keys: locally in client/.env.local (template: client/.env.example), live in Vercel → Settings → Environment Variables.
 *
 * OpenAI:
 *   OPENAI_API_KEY        needed for OpenAI mode (and as the AdaL fallback)
 *   OPENAI_MODEL          optional, default gpt-4.1-mini
 *   OPENAI_IMAGE_MODEL    optional, default gpt-image-1-mini (falls back to gpt-image-1)
 * AdaL Cloud Agents (https://cloud.adal.sylph.ai, API: /openapi.json):
 *   ADAL_API_KEY          API token from the AdaL cloud app (API tab)
 *   ADAL_AGENT_ID         id of the agent you created in the AdaL cloud app
 *   ADAL_API_URL          optional, default https://cloud.adal.sylph.ai
 *   ADAL_MODEL            optional model name for new sessions (AdaL default if empty)
 *   ADAL_TIMEOUT_MS       optional, default 25000 (then falls back to OpenAI, inside Vercel's 60 s limit)
 * Other:
 *   AIMP_IMAGES           optional, set to "off" to disable image generation
 *   AIMP_ALLOWED_ORIGINS  optional, comma list of allowed hostnames
 */

const env = k => (process.env[k] || "").trim();
const MODEL = () => env("OPENAI_MODEL") || "gpt-4.1-mini";
const KEY = () => env("OPENAI_API_KEY");
const IMAGE_MODEL = () => env("OPENAI_IMAGE_MODEL") || "gpt-image-1-mini";
const ADAL_URL = () => (env("ADAL_API_URL") || "https://cloud.adal.sylph.ai").replace(/\/+$/, "");
const ADAL_READY = () => !!(env("ADAL_API_KEY") && env("ADAL_AGENT_ID"));
/* the visitor's choice, if that provider is configured; otherwise whatever is available */
const pick = want => (want === "adal" && ADAL_READY() ? "adal" : want === "openai" && KEY() ? "openai" : KEY() ? "openai" : ADAL_READY() ? "adal" : null);
const LLM_ON = () => !!KEY() || ADAL_READY();
const IMAGES_ON = () => env("AIMP_IMAGES") !== "off" && LLM_ON();

export const config = { maxDuration: 60 };

function allowedHosts() {
  const list = (env("AIMP_ALLOWED_ORIGINS") || "crewbasecollective.com,localhost,127.0.0.1").split(",");
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

/* ======================= OpenAI ======================= */
async function openaiJSON(system, user, temperature) {
  const model = MODEL();
  const payload = {
    model,
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
    response_format: { type: "json_object" },
    max_completion_tokens: 900
  };
  // reasoning models (o-series, gpt-5*) don't accept a custom temperature
  if (!/^(o\d|gpt-5)/.test(model)) payload.temperature = Math.min(1.3, Math.max(0, Number(temperature) || 1));
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY()}` },
    body: JSON.stringify(payload)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || "OpenAI error");
  return j?.choices?.[0]?.message?.content || "{}";
}

async function openaiImage(prompt) {
  const tries = [IMAGE_MODEL(), "gpt-image-1-mini", "gpt-image-1"].filter((m, i, a) => a.indexOf(m) === i);
  let lastErr = "Image generation failed";
  for (const model of tries) {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${KEY()}` },
      body: JSON.stringify({ model, prompt, n: 1, size: "1024x1024", quality: "low", output_format: "jpeg" })
    });
    const j = await r.json().catch(() => ({}));
    const b64 = j?.data?.[0]?.b64_json;
    if (r.ok && b64) return { b64, format: "jpeg" };
    lastErr = j?.error?.message || lastErr;
  }
  throw new Error(lastErr);
}

/* ======================= AdaL Cloud Agents =======================
   Flow from the public OpenAPI spec (cloud.adal.sylph.ai/openapi.json):
   POST /v1/sessions {agent_config_id, title, model?} → { id }
   POST /v1/sessions/{id}/provision                     (start the worker)
   POST /v1/sessions/{id}/chat/stream {message}         → streamed events
   GET  /v1/sessions/{id}/messages                      → [{ role, content }]  (fallback read) */
async function adalFetch(path, init, signal) {
  const r = await fetch(ADAL_URL() + path, {
    ...init,
    signal,
    headers: { "content-type": "application/json", authorization: `Bearer ${env("ADAL_API_KEY")}`, "x-api-key": env("ADAL_API_KEY"), ...(init && init.headers) }
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`AdaL ${path.split("/").slice(0, 3).join("/")} ${r.status}: ${t.slice(0, 160)}`);
  }
  return r;
}
/* Read the SSE stream. AdaL events look like {"type":"command.started"|"command.progress"|"command.completed"|"command.failed"|"ui.message.appended"|...}.
   Text arrives in message/answer/delta style events; a failure ends the stream with command.failed. */
async function readStream(r, signal) {
  const rd = r.body.getReader(), dec = new TextDecoder();
  let buf = "", answer = "", deltas = "", err = "";
  const take = line => {
    line = line.trim();
    if (!line.startsWith("data:")) return;
    let ev; try { ev = JSON.parse(line.slice(5).trim()); } catch { return; }
    const type = String(ev.type || "").toLowerCase();
    if (type === "command.failed") { err = ev.error?.message || "AdaL command failed"; return; }
    const msg = ev.message && typeof ev.message === "object" ? ev.message : null;
    if (msg && msg.level === "error") { err = err || msg.text; return; }
    const val = [ev.content, ev.answer, ev.text, ev.delta, msg && msg.text, msg && msg.content, ev.result && ev.result.answer, ev.data && ev.data.content]
      .find(v => typeof v === "string" && v.trim());
    if (!val) return;
    if (/answer|final|assistant|completed|message\.appended/.test(type)) answer = val;
    else if (/delta|token|chunk|text/.test(type)) deltas += val;
  };
  while (true) {
    if (signal.aborted) throw new Error("AdaL timed out");
    const { value, done } = await rd.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i; while ((i = buf.indexOf("\n")) >= 0) { take(buf.slice(0, i)); buf = buf.slice(i + 1); }
    if (err) { try { rd.cancel(); } catch {} throw new Error("AdaL: " + err); }
  }
  take(buf);
  if (err) throw new Error("AdaL: " + err);
  return answer || deltas;
}
/* A provisioned session takes ~40 s to start, so reuse one that is already "ready". */
let cachedSession = null;
async function adalSession(signal) {
  if (cachedSession) return cachedSession;
  const ls = await (await adalFetch("/v1/sessions?limit=20", { method: "GET" }, signal)).json();
  const list = Array.isArray(ls) ? ls : ls.items || [];
  const ready = list.find(x => x.agent_config_id === env("ADAL_AGENT_ID") && x.worker_status === "ready" && x.status === "active");
  if (ready) return (cachedSession = ready.id);
  const body = { agent_config_id: env("ADAL_AGENT_ID"), title: "Multiplayer AI playground" };
  if (env("ADAL_MODEL")) body.model = env("ADAL_MODEL");
  const s = await (await adalFetch("/v1/sessions", { method: "POST", body: JSON.stringify(body) }, signal)).json();
  const id = s.id || s.session_id;
  if (!id) throw new Error("AdaL: no session id");
  await adalFetch(`/v1/sessions/${id}/provision`, { method: "POST", body: "{}" }, signal);
  return (cachedSession = id);
}
async function adalRun(message) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), Number(env("ADAL_TIMEOUT_MS")) || 25000);
  try {
    const id = await adalSession(ctl.signal);
    const r = await adalFetch(`/v1/sessions/${id}/chat/stream`, { method: "POST", body: JSON.stringify({ message }) }, ctl.signal);
    const text = await readStream(r, ctl.signal);
    if (!text) throw new Error("AdaL: empty reply");
    return text;
  } catch (e) {
    if (/not found|404|expired|stopped/i.test(String(e && e.message))) cachedSession = null;
    throw e.name === "AbortError" ? new Error("AdaL timed out") : e;
  } finally { clearTimeout(timer); }
}
/* First balanced {...} block in a reply. */
function extractJSON(text) {
  const t = String(text).replace(/```(?:json)?/g, "");
  const start = t.indexOf("{");
  for (let i = start, depth = 0, inStr = false, esc = false; start >= 0 && i < t.length; i++) {
    const ch = t[i];
    if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) { const s = t.slice(start, i + 1); JSON.parse(s); return s; }
  }
  throw new Error("AdaL: reply was not JSON");
}
async function adalJSON(system, user) {
  const msg = `INSTRUCTIONS (follow exactly, you are playing a role inside a web game):\n${system}\n\nINPUT:\n${user}\n\nAnswer with ONE JSON object only. Do not use any tools, do not add any text before or after the JSON.`;
  return extractJSON(await adalRun(msg));
}
async function adalImage(prompt) {
  const msg = `Generate exactly one square image with your image generation tool (fast model). Prompt: ${prompt}\nWhen it is done, reply with ONLY a JSON object {"url":"<public https URL of the generated image>"}. If you cannot share a URL, reply {"error":"why"}.`;
  const out = JSON.parse(extractJSON(await adalRun(msg)));
  if (!out.url || !/^https:\/\//.test(out.url)) throw new Error("AdaL: " + (out.error || "no image URL returned"));
  const img = await fetch(out.url);
  if (!img.ok) throw new Error("AdaL: could not download the image");
  const type = img.headers.get("content-type") || "image/png";
  return { b64: Buffer.from(await img.arrayBuffer()).toString("base64"), format: type.split("/")[1] || "png" };
}

/* ======================= handler ======================= */
export default async function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true, llm: LLM_ON(), images: IMAGES_ON(),
      providers: { openai: !!KEY(), adal: ADAL_READY() },
      model: KEY() ? MODEL() : null,
      adalModel: ADAL_READY() ? "AdaL agent" + (env("ADAL_MODEL") ? ` (${env("ADAL_MODEL")})` : "") : null,
      // setup check: which AdaL setting NAMES this deployment can see (never values)
      adalSetup: ADAL_READY() ? "ok" : { seen: Object.keys(process.env).filter(k => /adal/i.test(k)), needs: ["ADAL_API_KEY", "ADAL_AGENT_ID"], env: process.env.VERCEL_ENV || "local" }
    });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!LLM_ON()) return res.status(503).json({ error: "No AI provider configured (set OPENAI_API_KEY and/or ADAL_API_KEY + ADAL_AGENT_ID)." });
  if (!hostAllowed(req)) return res.status(403).json({ error: "Origin not allowed." });

  const ip = String(req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return res.status(429).json({ error: "Too many requests. Slow down a little." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Bad JSON" }); } }
  const chosen = pick(String(body?.provider || "").toLowerCase());
  let adalErr = "";

  if (body?.kind === "image") {
    if (!IMAGES_ON()) return res.status(503).json({ error: "Image generation is off." });
    if (limited(ip, imageHits, 8)) return res.status(429).json({ error: "Too many images. Wait a minute." });
    const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 1500) : "";
    if (!prompt) return res.status(400).json({ error: "prompt required" });
    if (chosen === "adal") {
      try { return res.status(200).json({ ...(await adalImage(prompt)), provider: "adal" }); }
      catch (e) { adalErr = e?.message || "AdaL image failed"; if (!KEY()) return res.status(502).json({ error: adalErr }); console.warn("[aim-hack] AdaL image failed, using OpenAI:", adalErr); }
    }
    try { return res.status(200).json({ ...(await openaiImage(prompt)), provider: "openai", fallback: chosen === "adal", adalError: adalErr }); }
    catch (e) { return res.status(502).json({ error: e?.message || "Image generation failed" }); }
  }

  const system = body?.system, user = body?.user;
  if (typeof system !== "string" || typeof user !== "string") return res.status(400).json({ error: "system and user strings required" });
  const sys = system.slice(0, 12000), usr = user.slice(0, 20000);

  if (chosen === "adal") {
    try { return res.status(200).json({ content: await adalJSON(sys, usr), provider: "adal" }); }
    catch (e) { adalErr = e?.message || "AdaL error"; if (!KEY()) return res.status(502).json({ error: adalErr }); console.warn("[aim-hack] AdaL failed, using OpenAI:", adalErr); }
  }
  try { return res.status(200).json({ content: await openaiJSON(sys, usr, body.temperature), provider: "openai", fallback: chosen === "adal", adalError: adalErr }); }
  catch (e) { return res.status(502).json({ error: "OpenAI: " + (e?.message || "unknown") }); }
}

/* =========================================================
   Brain: the one door to the LLM (and image model).
   - LLM mode: POST /api/aim-hack-chat (client/api/aim-hack-chat.ts → OpenAI)
   - Offline mode: every caller passes a fallback() that simulates the agent.
   API:
     await Brain.init()                         → "llm" | "offline"; sets Brain.mode, Brain.model, Brain.images
     await Brain.ask(system, user, temp, fallback) → parsed JSON object (+ _src: "llm" | "offline")
     await Brain.image(prompt)                  → data URL string, or null if images are unavailable/failed
   Prompts live in the module that uses them (film.js, grow.js, games, studio.js, labs.js).
   ========================================================= */
window.Brain = (function () {
  const B = { mode: "checking", model: null, images: false, lastError: null };
  B.clip = (s, n) => String(s == null ? "" : s).trim().slice(0, n);
  B.rand = a => a[Math.floor(Math.random() * a.length)];

  B.init = async function () {
    try {
      const r = await fetch("/api/aim-hack-chat", { cache: "no-store" });
      const j = await r.json();
      B.mode = j.llm ? "llm" : "offline";
      B.model = j.model;
      B.images = !!j.images;
      B.provider = j.provider || null;          // "openai" | "adal" (agents)
      B.mediaProvider = j.mediaProvider || null; // "openai" | "adal" (images)
      B.providerName = B.provider === "adal" ? "AdaL" : "OpenAI";
      B.reason = j.llm ? "" : "The AI endpoint has no OPENAI_API_KEY configured.";
    } catch {
      B.mode = "offline";
      B.reason = "The AI endpoint is not reachable here.";
    }
    return B.mode;
  };

  async function llm(system, user, temperature) {
    const r = await fetch("/api/aim-hack-chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ system, user, temperature })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "LLM request failed");
    B.lastProvider = j.fallback ? j.provider + " (fallback)" : j.provider;
    return JSON.parse(j.content);
  }

  /* Try the LLM; fall back to the simulated brain if anything goes wrong. */
  B.ask = async function (system, user, temperature, fallback) {
    if (B.mode === "llm") {
      try { return { ...(await llm(system, user, temperature == null ? 0.9 : temperature)), _src: "llm" }; }
      catch (e) { B.lastError = e.message; }
    }
    await new Promise(r => setTimeout(r, 350 + Math.random() * 450));
    return { ...(fallback ? fallback() : {}), _src: "offline" };
  };

  /* Generate one image. Returns a data URL or null. */
  B.image = async function (prompt) {
    if (B.mode !== "llm" || !B.images) return null;
    try {
      const r = await fetch("/api/aim-hack-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "image", prompt: String(prompt).slice(0, 1500) })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.b64) { B.lastError = j.error || "image failed"; return null; }
      return "data:image/" + (j.format || "png") + ";base64," + j.b64;
    } catch (e) { B.lastError = e.message; return null; }
  };

  return B;
})();

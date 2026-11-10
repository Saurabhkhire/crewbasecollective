/* =========================================================
   Brain: the one door to the LLM (and image model).
   - LLM mode: POST /api/aim-hack-chat (client/api/aim-hack-chat.ts → OpenAI)
   - Offline mode: every caller passes a fallback() that simulates the agent.
   API:
     await Brain.init()                         → "llm" | "offline"; sets Brain.mode, Brain.model, Brain.images
     await Brain.ask(system, user, temp, fallback) → parsed JSON object (+ _src: "llm" | "offline")
     await Brain.image(prompt)                  → data URL string, or null if images are unavailable/failed
     Brain.picker(el, onChange)                 → renders the "Agents: OpenAI | AdaL · Images: OpenAI | AdaL" selector
   The visitor's choice is stored in localStorage and sent with every request.
   Prompts live in the module that uses them (film.js, grow.js, games, studio.js, labs.js).
   ========================================================= */
window.Brain = (function () {
  const B = { mode: "checking", model: null, images: false, lastError: null };
  B.clip = (s, n) => String(s == null ? "" : s).trim().slice(0, n);
  B.rand = a => a[Math.floor(Math.random() * a.length)];

  const load = () => { try { return JSON.parse(localStorage.getItem("aimp_provider") || "{}"); } catch { return {}; } };
  const store = () => { try { localStorage.setItem("aimp_provider", JSON.stringify({ agents: B.provider, images: B.mediaProvider })); } catch {} };
  const choose = want => (want && B.available && B.available[want] ? want : B.available && B.available.openai ? "openai" : B.available && B.available.adal ? "adal" : null);
  B.setProvider = function (kind, value) {
    if (!B.available || !B.available[value]) return;
    if (kind === "images") B.mediaProvider = value; else { B.provider = value; B.model = value === "adal" ? B.adalModel : B.openaiModel; }
    store();
  };
  B.name = p => (p === "adal" ? "AdaL" : "OpenAI");
  /* the selector shown in the playground and labs banners */
  B.picker = function (el, onChange) {
    if (!el) return;
    if (B.mode !== "llm") { el.innerHTML = ""; return; }
    const opt = (kind, cur) => ["openai", "adal"].map(p => `<button type="button" class="${cur === p ? "on" : ""}" data-pk="${kind}" data-pv="${p}" ${B.available[p] ? "" : `disabled title="Add ${p === "adal" ? "ADAL_API_KEY and ADAL_AGENT_ID" : "OPENAI_API_KEY"} to enable"`}>${p === "adal" ? "🤖 AdaL" : "◎ OpenAI"}</button>`).join("");
    el.innerHTML = `<span class="prov"><small>Agents</small><span class="prov-seg">${opt("agents", B.provider)}</span></span>${B.images ? `<span class="prov"><small>Images</small><span class="prov-seg">${opt("images", B.mediaProvider)}</span></span>` : ""}`;
    el.onclick = e => { const b = e.target.closest("[data-pk]"); if (!b || b.disabled) return; B.setProvider(b.dataset.pk, b.dataset.pv); B.picker(el, onChange); onChange && onChange(); };
  };

  B.init = async function () {
    try {
      const r = await fetch("/api/aim-hack-chat", { cache: "no-store" });
      const j = await r.json();
      B.mode = j.llm ? "llm" : "offline";
      B.model = j.model;
      B.images = !!j.images;
      B.available = j.providers || { openai: !!j.llm, adal: false };
      B.openaiModel = j.model; B.adalModel = j.adalModel;
      const saved = load();
      B.provider = choose(saved.agents);
      B.mediaProvider = choose(saved.images);
      B.model = B.provider === "adal" ? B.adalModel : B.openaiModel;
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
      body: JSON.stringify({ system, user, temperature, provider: B.provider })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "LLM request failed");
    B.lastProvider = j.fallback ? j.provider + " (fallback)" : j.provider;
    if (j.fallback) { B.adalError = j.adalError || "AdaL did not answer"; window.dispatchEvent(new CustomEvent("brain:fallback", { detail: B.adalError })); }
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
        body: JSON.stringify({ kind: "image", prompt: String(prompt).slice(0, 1500), provider: B.mediaProvider })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.b64) { B.lastError = j.error || "image failed"; return null; }
      return "data:image/" + (j.format || "png") + ";base64," + j.b64;
    } catch (e) { B.lastError = e.message; return null; }
  };

  return B;
})();

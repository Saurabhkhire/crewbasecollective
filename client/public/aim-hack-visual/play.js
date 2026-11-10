/* =========================================================
   Playground shell: shared UI helpers, character/scene library,
   pickers, sponsor tool bar, landing page and router.
   Routes:  #film  #game  #game/<id>  #grow  #studio  #studio/scenes
   Modules: Film (film.js) · Games (game.js) · Grow (grow.js) · Studio (studio.js)
   ========================================================= */
window.UI = (function () {
  const U = {};
  U.$ = s => document.querySelector(s);
  U.esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  U.rand = a => a[Math.floor(Math.random() * a.length)];
  U.app = () => U.$("#app");
  U.MOOD = { happy: "😄", angry: "😠", scared: "😨", sad: "😢", sly: "😏", shocked: "😱", calm: "😌", determined: "😤", neutral: "😐", thinking: "💭" };
  U.uid = p => (p || "id") + "-" + Math.random().toString(36).slice(2, 8);

  /* ---------- run control: pause / speed / abort ---------- */
  U.ctl = { paused: false, speed: 1, token: 0, voice: false };
  U.sleep = async function (ms, token) {
    let left = ms;
    while (left > 0) {
      if (token != null && token !== U.ctl.token) throw new Error("aborted");
      await new Promise(r => setTimeout(r, 100));
      if (!U.ctl.paused) left -= 100 * U.ctl.speed;
    }
    if (token != null && token !== U.ctl.token) throw new Error("aborted");
  };
  U.waitWhilePaused = async token => { while (U.ctl.paused) { await new Promise(r => setTimeout(r, 120)); if (token !== U.ctl.token) throw new Error("aborted"); } };

  /* ---------- voices (browser TTS, free) ---------- */
  let voices = [];
  const loadVoices = () => { try { voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)); } catch {} };
  if ("speechSynthesis" in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  /* speak(text, voiceIndex, {force, onend}) — plays only if voices are on (or force) */
  U.speak = function (text, idx, opts) {
    opts = opts || {};
    if ((!U.ctl.voice && !opts.force) || !text || !("speechSynthesis" in window)) { opts.onend && opts.onend(); return; }
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voices.length) u.voice = voices[(idx || 0) % voices.length];
      u.pitch = 0.75 + ((idx || 0) % 5) * 0.15;
      u.rate = 1.05 * Math.min(U.ctl.speed, 1.6);
      if (opts.onend) u.onend = opts.onend;
      speechSynthesis.speak(u);
    } catch { opts.onend && opts.onend(); }
  };
  U.stopVoice = () => { try { speechSynthesis.cancel(); } catch {} };

  /* ---------- step indicator ---------- */
  U.steps = function (labels, active, color) {
    U.$("#steps").innerHTML = labels ? `<ol class="steps" style="--c:${color}">${labels.map((l, i) =>
      `<li class="${i < active ? "done" : i === active ? "on" : ""}"><span>${i < active ? "✓" : i + 1}</span>${U.esc(l)}</li>`).join("")}</ol>` : "";
  };

  /* ---------- LLM status banner ---------- */
  U.banner = function () {
    const b = U.$("#modeBanner"), B = window.Brain;
    if (B.mode === "llm") {
      b.innerHTML = `<span class="pill ok">● LIVE AI AGENTS</span><span class="mb-txt">Every character is a separate ${B.provider === "adal" ? "AdaL cloud agent" : "OpenAI agent"} (<b>${U.esc(B.model)}</b>) deciding for itself.</span><span class="mb-pick" id="provPick"></span>`;
      B.picker(U.$("#provPick"), () => U.banner());
      if (B.provider === "adal" && B.adalError && B.adalState === "ready") b.insertAdjacentHTML("beforeend", `<span class="prov-note">⚠ AdaL didn't answer (${U.esc(B.adalError)}), so that step used OpenAI.</span>`);
    } else b.innerHTML = `<span class="pill warn">● OFFLINE DEMO AGENTS</span> ${U.esc(B.reason || "")} Agents are simulated from their personalities.`;
  };
  U.srcLabel = () => (Brain.mode === "llm" ? "🧠 " + U.esc(Brain.model) : "🧪 offline agents");

  /* ---------- generic modal ---------- */
  U.modal = function (html, onMount, cls) {
    let d = U.$("#uiModal");
    if (!d) { d = document.createElement("dialog"); d.id = "uiModal"; document.body.appendChild(d); d.addEventListener("click", e => e.target === d && d.close()); }
    d.className = "sp-modal play-modal " + (cls || "");
    d.innerHTML = `<button class="close" aria-label="Close">✕</button>${html}`;
    d.querySelector(".close").onclick = () => d.close();
    if (!d.open) d.showModal();
    onMount && onMount(d);
    return d;
  };

  /* ---------- "agent at work" panel ----------
     const w = UI.aiWork(el, ["Reading your idea", "Choosing a look", "Writing a personality"]);
     w.step(1); ... w.done("why text")  */
  U.aiWork = function (el, steps, title) {
    el.innerHTML = `<div class="ai-work"><b>🤖 ${U.esc(title || (Brain.mode === "llm" ? "Agent at work" : "Offline agent at work"))}</b>
      <ol>${steps.map((s, i) => `<li data-i="${i}"><i>○</i>${U.esc(s)}</li>`).join("")}</ol><div class="why"></div></div>`;
    const lis = [...el.querySelectorAll("li")];
    const set = k => lis.forEach((li, i) => { li.className = i < k ? "done" : i === k ? "on" : ""; li.querySelector("i").textContent = i < k ? "✓" : i === k ? "●" : "○"; });
    set(0);
    return { step: set, done: why => { set(lis.length); if (why) el.querySelector(".why").textContent = "“" + why + "”"; } };
  };
  /* animate the steps while a promise runs */
  U.aiRun = async function (el, steps, promise, title) {
    const w = U.aiWork(el, steps, title);
    let k = 0;
    const t = setInterval(() => { if (k < steps.length - 1) w.step(++k); }, 900);
    try { const r = await promise; w.done(r && (r.why || (Array.isArray(r.design_notes) ? r.design_notes[0] : ""))); return r; }
    finally { clearInterval(t); }
  };

  /* =========================================================
     LIBRARY: preset + user-created characters and scenes
     ========================================================= */
  const load = k => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const Lib = {
    chars() { return load("aimp_chars").map(c => ({ ...c, custom: true })).concat(PLAY.characters.map(c => ({ ...c }))); },
    char(id) { return Lib.chars().find(c => c.id === id); },
    saveChar(c) { const all = load("aimp_chars"); c = { ...c, id: c.id || U.uid("c"), custom: true }; const i = all.findIndex(x => x.id === c.id); if (i >= 0) all[i] = c; else all.unshift(c); save("aimp_chars", all.slice(0, 60)); return c; },
    removeChar(id) { save("aimp_chars", load("aimp_chars").filter(c => c.id !== id)); },
    scenes() { return load("aimp_scenes").map(s => ({ ...s, custom: true })).concat(PLAY.scenes.map(s => ({ ...s }))); },
    scene(id) { return Lib.scenes().find(s => s.id === id); },
    saveScene(s) { const all = load("aimp_scenes"); s = { ...s, id: s.id || U.uid("s"), custom: true }; const i = all.findIndex(x => x.id === s.id); if (i >= 0) all[i] = s; else all.unshift(s); save("aimp_scenes", all.slice(0, 40)); return s; },
    removeScene(id) { save("aimp_scenes", load("aimp_scenes").filter(s => s.id !== id)); }
  };
  U.Lib = Lib;

  /* Open the Studio's character creator as a modal (manual + AI). */
  U.createCharacter = function (onSave, initial) {
    if (window.Studio && Studio.characterModal) return Studio.characterModal({ initial, onSave: c => onSave(Lib.saveChar(c)) });
    location.hash = "#studio";
  };
  U.createScene = function (onSave, initial) {
    if (window.Studio && Studio.sceneModal) return Studio.sceneModal({ initial, onSave: s => onSave(Lib.saveScene(s)) });
    location.hash = "#studio/scenes";
  };

  /* ---------- cast picker ----------
     UI.castPicker(el, { selected: [ids], min, max, color, detail: "secret"|"goal"|"role", onChange(ids) }) */
  U.castPicker = function (el, o) {
    const sel = o.selected;
    const draw = () => {
      const chars = Lib.chars();
      el.innerHTML = `<div class="pick-cards">
        <button class="pc new" data-new style="--c:${o.color}"><span class="plus">＋</span><h4>Create a character</h4><p>Pick the look yourself, or describe it and let an AI agent design it.</p></button>
        ${chars.map(c => { const k = sel.indexOf(c.id); return `
          <button class="pc ${k >= 0 ? "on" : ""}" data-id="${U.esc(c.id)}" style="--c:${o.color}" aria-pressed="${k >= 0}">
            ${k >= 0 ? `<span class="n">${k + 1}</span>` : ""}${c.custom ? `<span class="yours">yours</span>` : ""}
            <div class="pc-fig"><div class="pup-slot"></div></div>
            <h4>${U.esc(c.name)}</h4><span class="role">${U.esc(c.role)}</span>
            <p>${U.esc(o.detail === "goal" ? "🎯 " + (c.goal || c.personality) : o.detail === "role" ? c.personality : c.personality)}</p>
          </button>`; }).join("")}</div>`;
      el.querySelectorAll(".pc[data-id]").forEach(b => Puppet.mount(b.querySelector(".pup-slot"), Lib.char(b.dataset.id)));
    };
    el.onclick = e => {
      if (e.target.closest("[data-new]")) return U.createCharacter(c => { if (sel.length < o.max) sel.push(c.id); draw(); o.onChange && o.onChange(sel); });
      const b = e.target.closest(".pc[data-id]"); if (!b) return;
      const id = b.dataset.id, k = sel.indexOf(id);
      if (k >= 0) sel.splice(k, 1); else if (sel.length < o.max) sel.push(id); else { sel.shift(); sel.push(id); }
      draw(); o.onChange && o.onChange(sel);
    };
    draw();
    return { redraw: draw };
  };

  /* ---------- scene picker ----------
     UI.scenePicker(el, { selected: [ids], max, color, onChange(ids) }) */
  U.scenePicker = function (el, o) {
    const sel = o.selected;
    const draw = () => {
      const scs = Lib.scenes();
      el.innerHTML = `<div class="sc-cards">
        <button class="scc new" data-new style="--c:${o.color}"><div class="thumb" style="display:grid;place-items:center;font-size:34px;background:rgba(255,255,255,.03)">＋</div><b>Create a scene</b><small>Office, forest, space… or describe one.</small></button>
        ${scs.map(s => { const k = sel.indexOf(s.id); return `<button class="scc ${k >= 0 ? "on" : ""}" data-id="${U.esc(s.id)}" style="--c:${o.color}">
          <div class="thumb">${k >= 0 && o.max > 1 ? `<span class="n">${k + 1}</span>` : ""}${Scenes.svg(s)}</div><b>${U.esc(s.name)}${s.custom ? " · yours" : ""}</b><small>${U.esc(s.desc || "")}</small></button>`; }).join("")}</div>`;
    };
    el.onclick = e => {
      if (e.target.closest("[data-new]")) return U.createScene(s => { if (o.max === 1) sel.splice(0, sel.length, s.id); else if (sel.length < o.max) sel.push(s.id); draw(); o.onChange && o.onChange(sel); });
      const b = e.target.closest(".scc[data-id]"); if (!b) return;
      const id = b.dataset.id, k = sel.indexOf(id);
      if (o.max === 1) sel.splice(0, sel.length, id);
      else if (k >= 0) { if (sel.length > 1) sel.splice(k, 1); } else if (sel.length < o.max) sel.push(id); else { sel.shift(); sel.push(id); }
      draw(); o.onChange && o.onChange(sel);
    };
    draw();
    return { redraw: draw };
  };

  /* ---------- sponsor tool bar ----------
     const bar = UI.sponsorBar(el, "film", activeSet, onChange)
     activeSet is a Set of sponsor ids; bar.on("band") → boolean */
  U.sponsorBar = function (el, track, active, onChange) {
    const tools = (PLAY.tools[track] || []).map(t => ({ ...t, sp: HACK.sponsors.find(s => s.id === t.id) })).filter(t => t.sp);
    const draw = () => {
      const on = tools.filter(t => active.has(t.id));
      el.innerHTML = `<div class="toolbar-sp"><span class="lbl">SPONSOR TOOLS</span>
        ${tools.map(t => `<button class="sp-tog ${active.has(t.id) ? "on" : ""}" data-t="${t.id}" style="--c:${t.sp.color}" title="${U.esc(t.does)}">${t.sp.icon} ${U.esc(t.sp.name)} <small>${U.esc(t.label)}</small></button>`).join("")}
        <span class="sp-hint">${on.length ? on.map(t => `<b>${U.esc(t.sp.name)}:</b> ${U.esc(t.does)}`).join(" · ") : "Switch on a sponsor's tool to see what it adds to this track."}</span></div>`;
    };
    el.onclick = e => { const b = e.target.closest("[data-t]"); if (!b) return; const id = b.dataset.t; active.has(id) ? active.delete(id) : active.add(id); draw(); onChange && onChange(active); };
    draw();
    return { on: id => active.has(id), redraw: draw };
  };
  U.sponsor = id => HACK.sponsors.find(s => s.id === id);

  /* =========================================================
     LANDING
     ========================================================= */
  U.picker = function () {
    U.steps(null);
    const cast = ["vega", "bolt", "luna", "jax", "zorp", "priya"].map(id => PLAY.characters.find(c => c.id === id));
    U.app().innerHTML = `
      <section class="pl-hero">
        <div class="pl-stage" id="plStage">
          ${cast.map((c, i) => `<div class="pl-actor" style="--d:${i * 0.35}s"><div class="pl-pup"></div></div>`).join("")}
          <div class="pl-copy">
            <p class="eyebrow">// Playground · Multiplayer AI</p>
            <h1>Don't read about it. <em>Watch agents decide.</em></h1>
            <p class="lead">Make characters, set a scene, and let a cast of AI agents take over: they direct films, play games with you, and interview you.</p>
            <div class="cta-row"><a class="btn" href="#film">▶ Make an agent film</a><a class="btn ghost" href="#studio">✨ Create a character</a></div>
          </div>
        </div>
      </section>
      <div class="pick-grid4">
        <a class="card pick" href="#film" style="--c:var(--film)"><span class="num">TRACK 01</span><span class="ico">🎬</span><h2>Agent Animated Film</h2>
          <p>Pick a cast and a scene, write one opening line, and watch 10–20 scenes play out. The agents decide the ending.</p><span class="go">Make a film →</span></a>
        <a class="card pick" href="#game" style="--c:var(--game)"><span class="num">TRACK 02</span><span class="ico">🎮</span><h2>Play with Agents</h2>
          <p>Zombie survival, Snakes & Ladders, Rock-Paper-Scissors, or build your own game, with AI teammates and rivals.</p><span class="go">Pick a game →</span></a>
        <a class="card pick" href="#grow" style="--c:var(--grow)"><span class="num">TRACK 03</span><span class="ico">🎓</span><h2>Grow with Agents</h2>
          <p>An agent panel interviews you, confers in private, adapts, and gives a verdict with evidence from your answers.</p><span class="go">Start a session →</span></a>
        <a class="card pick studio" href="#studio" style="--c:#c48bff"><span class="num">STUDIO</span><span class="ico">✨</span><h2>Characters & Scenes</h2>
          <p>Design characters by hand or describe them and let an AI agent create them. Build scenes like an office or a forest.</p><span class="go">Open the studio →</span></a>
      </div>
      <a class="card labs-link" href="/aim-hack-visual/sponsors.html#labs"><span>🧪</span><div><b>Sponsor Labs</b><p>Play with each sponsor's tool: wire up agents in a BAND channel, generate images and video with AdaL, and more.</p></div><span class="go">Open labs →</span></a>`;
    U.$("#plStage") && Scenes.mount(U.$("#plStage"), { base: "city", time: "night", weather: "clear" });
    document.querySelectorAll(".pl-pup").forEach((el, i) => { Puppet.mount(el, cast[i]); setTimeout(() => Puppet.gesture(el, ["wave", "jump", "nod", "raise", "shrug", "point"][i], 2600), 600 + i * 450); });
  };

  /* ---------- router ---------- */
  function route() {
    U.ctl.token++; U.ctl.paused = false; U.ctl.speed = 1; U.stopVoice();
    const [h, sub] = location.hash.replace("#", "").split("/");
    const go = (mod, ...a) => (window[mod] ? window[mod].start(...a) : U.picker());
    if (h === "film") go("Film", sub);
    else if (h === "game") go("Games", sub);
    else if (h === "grow") go("Grow", sub);
    else if (h === "studio") go("Studio", sub);
    else U.picker();
    window.scrollTo({ top: 0 });
  }
  window.addEventListener("brain:fallback", () => U.banner());
  window.addEventListener("brain:adal", () => U.banner());
  U.boot = async function () {
    U.$("#modeBanner").innerHTML = `<span class="pill">● Checking for the AI server…</span>`;
    await Brain.init();
    U.banner();
    route();
    window.addEventListener("hashchange", route);
  };
  return U;
})();

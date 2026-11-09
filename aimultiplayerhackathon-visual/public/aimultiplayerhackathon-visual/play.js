/* Playground shell: track picker, router, shared UI helpers */
window.UI = (function () {
  const U = {};
  U.$ = s => document.querySelector(s);
  U.esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  U.rand = a => a[Math.floor(Math.random() * a.length)];
  U.app = () => U.$("#app");
  U.MOOD = { happy: "😄", angry: "😠", scared: "😨", sad: "😢", sly: "😏", shocked: "😱", calm: "😌", determined: "😤", neutral: "😐", thinking: "💭" };

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
  U.speak = function (text, idx) {
    if (!U.ctl.voice || !text || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voices.length) u.voice = voices[idx % voices.length];
      u.pitch = 0.75 + (idx % 5) * 0.15;
      u.rate = 1.05 * Math.min(U.ctl.speed, 1.6);
      speechSynthesis.speak(u);
    } catch {}
  };
  U.stopVoice = () => { try { speechSynthesis.cancel(); } catch {} };

  /* ---------- step indicator ---------- */
  U.steps = function (labels, active, color) {
    U.$("#steps").innerHTML = `<ol class="steps" style="--c:${color}">${labels.map((l, i) =>
      `<li class="${i < active ? "done" : i === active ? "on" : ""}"><span>${i < active ? "✓" : i + 1}</span>${U.esc(l)}</li>`).join("")}</ol>`;
  };

  /* ---------- LLM status banner ---------- */
  U.banner = function () {
    const b = U.$("#modeBanner"), B = window.Brain;
    if (B.mode === "llm") b.innerHTML = `<span class="pill ok">● LIVE LLM AGENTS</span> Every character is a separate OpenAI agent (<b>${U.esc(B.model)}</b>) deciding for itself.`;
    else b.innerHTML = `<span class="pill warn">● OFFLINE DEMO AGENTS</span> ${U.esc(B.reason || "")} Agents are simulated from their personalities. <a href="#" id="howLLM">How to turn on real LLM agents</a>`;
    const h = U.$("#howLLM");
    if (h) h.onclick = e => { e.preventDefault(); U.modal(`<h3>Turn on OpenAI agents</h3>
      <ol class="howto"><li>In the main Crewbase Collective Vercel project → Settings → Environment Variables, add <code>OPENAI_API_KEY</code> (optional: <code>OPENAI_MODEL</code>).</li><li>Redeploy. The page calls <code>/aimultiplayerhackathon-visual/api/chat</code>.</li><li>Locally the playground runs with offline agents.</li></ol>
      <p class="muted">The key stays on the server and is never sent to the browser.</p>`); };
  };

  /* ---------- generic modal ---------- */
  U.modal = function (html, onMount) {
    let d = U.$("#uiModal");
    if (!d) { d = document.createElement("dialog"); d.id = "uiModal"; d.className = "sp-modal play-modal"; document.body.appendChild(d); d.addEventListener("click", e => e.target === d && d.close()); }
    d.innerHTML = `<button class="close" aria-label="Close">✕</button>${html}`;
    d.querySelector(".close").onclick = () => d.close();
    if (!d.open) d.showModal();
    onMount && onMount(d);
    return d;
  };

  /* ---------- character editor (film + game) ---------- */
  U.editCharacter = function (initial, opts) {
    const c = Object.assign({ name: "", role: "", avatar: U.rand(PLAY.avatars), personality: "", secret: "", goal: "" }, initial || {});
    const goalKey = opts.kind === "game" ? "goal" : "secret";
    const goalLabel = opts.kind === "game" ? "Goal in the game" : "Secret goal (only this agent knows it)";
    const goalPh = opts.kind === "game" ? "e.g. Become the richest player, but never hurt Tomo." : "e.g. Is secretly in love with the captain and will sabotage anyone who threatens her.";
    U.modal(`
      <span class="lm">${initial && initial.name ? "Edit character" : "Create your own character"}</span>
      <h3>${opts.kind === "game" ? "🤖 Agent player" : "🎭 Film character"}</h3>
      <form class="char-form" id="charForm">
        <label>Avatar</label>
        <div class="avatar-pick">${PLAY.avatars.map(a => `<button type="button" class="${a === c.avatar ? "on" : ""}" data-a="${a}">${a}</button>`).join("")}</div>
        <div class="two"><div><label>Name</label><input name="name" required maxlength="24" value="${U.esc(c.name)}" placeholder="e.g. Zara"></div>
        <div><label>Role</label><input name="role" required maxlength="28" value="${U.esc(c.role)}" placeholder="e.g. Pilot"></div></div>
        <label>Personality <small>how they think and talk</small></label>
        <textarea name="personality" required maxlength="220" rows="2" placeholder="e.g. Fearless, sarcastic, fiercely loyal to her friends.">${U.esc(c.personality)}</textarea>
        <label>${goalLabel}</label>
        <textarea name="goal" required maxlength="220" rows="2" placeholder="${goalPh}">${U.esc(c[goalKey])}</textarea>
        <div class="row"><button class="btn btn-sm" type="submit">Save character</button></div>
      </form>`, d => {
      let av = c.avatar;
      d.querySelectorAll(".avatar-pick button").forEach(b => b.onclick = () => { av = b.dataset.a; d.querySelectorAll(".avatar-pick button").forEach(x => x.classList.toggle("on", x === b)); });
      d.querySelector("#charForm").onsubmit = e => {
        e.preventDefault();
        const f = new FormData(e.target);
        const out = Object.assign({}, initial || {}, { name: f.get("name").trim(), role: f.get("role").trim(), avatar: av, personality: f.get("personality").trim() });
        out[goalKey] = f.get("goal").trim();
        out.custom = initial ? initial.custom : true;
        d.close();
        opts.onSave(out);
      };
    });
  };

  /* ---------- track picker ---------- */
  U.picker = function () {
    U.$("#steps").innerHTML = "";
    U.app().innerHTML = `
      <div class="play-hero">
        <p class="eyebrow">// Playground</p>
        <h1>Don't read about it. <em>Watch agents decide.</em></h1>
        <p class="lead">Pick a track, choose your characters, set the scene, and let a cast of AI agents take over. Run it twice and you'll get a different ending.</p>
      </div>
      <div class="pick-grid">
        <a class="card pick big" href="#film" style="--c:var(--film)">
          <span class="ribbon">▶ Start here</span>
          <span class="num">TRACK 01</span><span class="ico">🎬</span>
          <h2>Agent Animated Film</h2>
          <p>Pick a cast, pick a story, and watch the agents write the plot live, right up to an ending nobody scripted.</p>
          <ul><li>Choose 3–5 characters or write your own</li><li>Pick a story mode, tone and length</li><li>Throw in plot twists while it runs</li></ul>
          <span class="go">Choose characters →</span>
        </a>
        <a class="card pick" href="#game" style="--c:var(--game)">
          <span class="num">TRACK 02</span><span class="ico">🎮</span>
          <h2>Co-op Multiplayer Game</h2>
          <p>Play against AI agent players who trade, ally, steal, betray and hold grudges, and who trigger world events on their own.</p>
          <ul><li>1–2 human players + 3–4 agents</li><li>Agents remember what you did</li></ul>
          <span class="go">Set up a game →</span>
        </a>
        <div class="card pick soon" style="--c:var(--grow)">
          <span class="num">TRACK 03</span><span class="ico">🎓</span>
          <h2>Grow with Agents</h2>
          <p>An agent panel that interviews, coaches and grades you. Coming soon.</p>
          <span class="go">Coming soon</span>
        </div>
      </div>`;
  };

  /* ---------- router ---------- */
  function route() {
    U.ctl.token++; U.ctl.paused = false; U.stopVoice();
    const h = location.hash.replace("#", "");
    if (h === "film") Film.start();
    else if (h === "game") Game.start();
    else U.picker();
    window.scrollTo({ top: 0 });
  }
  U.boot = async function () {
    U.$("#modeBanner").innerHTML = `<span class="pill">● Checking for LLM server…</span>`;
    route();
    await Brain.init();
    U.banner();
    window.addEventListener("hashchange", route);
  };
  return U;
})();

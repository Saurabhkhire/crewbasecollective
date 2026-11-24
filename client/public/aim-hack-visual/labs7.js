/* Sponsor Labs, part 7: LingCode (idea → real iPhone, Android and web app with sign-in, data,
   payments and store release) and HarnessRouter (complete agent harnesses behind one API,
   smart routing, one sandbox per task, clear terminal states, full trace).
   Registers into window.__LABS__.LABS created by labs.js.
   Everything here is SIMULATED: nothing is built, submitted to a store, or sent to HarnessRouter.
   Stages, harnesses, times and costs live in PLAY.lingcode / PLAY.harnessrouter (play-data.js). */
(function () {
  const L = window.__LABS__;
  if (!L) return;
  const { LABS, $, $$, esc, rand, wait, charById, rr, textBox, drawCover, drawPup } = L;
  const P = window.PLAY;

  /* =========================================================
     LingCode: describe the product, watch it build stage by stage on a phone, then launch
     ========================================================= */
  const LC = P && P.lingcode;
  if (LC) {
    const C = "#5ce1e6";
    const IDEAS = [
      "A companion app for our agent film: watch the short, vote on the next ending, buy the behind-the-scenes pack",
      "Our zombie co-op as a phone game with player accounts, a leaderboard and a $0.99 skin pack",
      "A practice app for our interview panel: learners sign in, book sessions and buy a practice pack",
      "A booking app for a yoga studio: students book classes and buy a class pack"
    ];
    const PLATS = [["ios", "🍎 iPhone"], ["android", "🤖 Android"], ["web", "🌐 Web"]];
    function offline(idea) {
      const name = (idea.match(/(film|game|co-op|practice|yoga|studio|interview)/i) || ["app"])[0];
      const nm = { film: "Endings", game: "Night Shift", "co-op": "Night Shift", practice: "PanelPrep", interview: "PanelPrep", yoga: "StudioFlow", studio: "StudioFlow" }[name.toLowerCase()] || "My App";
      return {
        name: nm,
        screens: ["Sign in", "Home", nm === "Night Shift" ? "Leaderboard" : "Browse", "Checkout", "Profile"],
        data: ["users", nm === "Night Shift" ? "scores" : "items", "purchases"],
        product: nm === "Night Shift" ? "Skin pack · $0.99" : nm === "Endings" ? "Behind-the-scenes pack · $2.99" : "Practice pack · $9",
        review: "Built from your paragraph. Sign-in, data and payments are wired; it is ready for store review."
      };
    }
    LABS.push({
      id: "lingcode", tool: "Ship as a real app", playLink: "game",
      title: "Turn your hackathon project into a real app in the store",
      pitch: "Describe your product in a paragraph. LingCode builds it for iPhone, Android and the web, sets up sign-in, data and payments, ships it to the stores and tells you how it is doing after launch.",
      how: [
        "<b>Describe your product</b> in plain English, or pick an example. Choose the platforms.",
        "Press <b>📱 Build it</b>: the agent plans the screens, data and payments, and the app appears on the phone beside the chat.",
        "Ask for a <b>change</b> in plain English: the agent edits and rebuilds, and a <b>snapshot</b> is saved first so a bad change is one click to undo.",
        "Press <b>🚀 Ship</b>: signing and store submission run, then the app goes live.",
        "After launch, crash reports, store reviews and a daily summary come in. Everything here is simulated."
      ],
      demoChars: ["ashford"], demoScenes: { bg: { base: "lab", time: "day" } },
      demo: [
        { cap: "Describe your product in a paragraph", dur: 3.2, draw(ctx, p, A, W, H) { drawCover(ctx, A.s.bg, W, H); ctx.fillStyle = "rgba(5,8,20,.45)"; ctx.fillRect(0, 0, W, H); drawPup(ctx, A.p.ashford, 150, 340, 220); const t = "An app for our film: watch it, vote on the ending"; textBox(ctx, t.slice(0, Math.ceil(t.length * Math.min(1, p * 1.6))), 270, 110, 330, {}); } },
        { cap: "LingCode builds it, running beside the chat", dur: 3.6, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#10172f"; rr(ctx, 380, 40, 170, 300, 24); ctx.fill(); ctx.strokeStyle = C; ctx.lineWidth = 2; ctx.stroke(); ["Sign in", "Watch the short", "Vote: ending A / B", "Buy pack · $2.99"].forEach((l, i) => { if (p * 5 > i + 0.5) { ctx.fillStyle = i === 3 ? C : "#1b2550"; rr(ctx, 396, 80 + i * 56, 138, 40, 9); ctx.fill(); ctx.fillStyle = i === 3 ? "#0b1022" : "#eaf0ff"; ctx.font = "600 13px 'Space Grotesk', sans-serif"; ctx.fillText(l, 406, 105 + i * 56); } }); ["🛠️ screens", "🔐 sign-in + data", "💳 payments"].forEach((l, i) => { if (p * 3.5 > i) { ctx.fillStyle = "#eaf0ff"; ctx.font = "600 15px 'Space Grotesk', sans-serif"; ctx.fillText("✓ " + l, 60, 120 + i * 44); } }); } },
        { cap: "Signed, submitted, live in the stores", dur: 3.2, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H); ["📦 Signing", "📤 Store submission", "✅ Approved", "🚀 Live on iPhone + Android"].forEach((l, i) => { if (p * 4.4 > i) { ctx.fillStyle = i === 3 ? C : "#eaf0ff"; ctx.font = (i === 3 ? "700 " : "600 ") + "18px 'Space Grotesk', sans-serif"; ctx.fillText(l, 120, 100 + i * 52); } }); } },
        { cap: "After launch: crashes, reviews, a daily summary", dur: 3.4, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H); LC.after.slice(0, 3).forEach((l, i) => { if (p * 3.5 > i) textBox(ctx, l, 90 + i * 30, 70 + i * 90, 440, { bg: i === 1 ? "rgba(92,225,230,.95)" : undefined, color: i === 1 ? "#06262a" : undefined }); }); } }
      ],
      build: buildLingcode
    });

    function buildLingcode(main, coord) {
      coord = coord || { pulse() {} };
      const S = { token: 0, app: null, stage: -1, plats: new Set(["ios", "android"]), snaps: 0, live: false, afterT: null, installs: 0, revenue: 0 };
      main.innerHTML = `
        <div class="gl-top">
          <div class="gl-agent" id="lcAgent"><div class="gl-pup" id="lcPup"></div><div class="gl-bub" id="lcBub">Tell me what you want to build. I'll make it a real app, not just a demo.</div></div>
          <div class="gl-goal">
            <label class="small muted" for="lcIdea">Your product, in plain English</label>
            <div class="lab-bar"><input id="lcIdea" maxlength="220" value="${esc(IDEAS[0])}"><button class="btn btn-sm" id="lcRun">📱 Build it</button></div>
            <div class="ex-chips" id="lcEx">${IDEAS.map(g => `<button>${esc(g)}</button>`).join("")}</div>
            <div class="tl-opts"><span class="chip-row lc-plats" id="lcPlat">${PLATS.map(([k, l]) => `<button data-p="${k}" class="${S.plats.has(k) ? "on" : ""}">${l}</button>`).join("")}</span></div>
          </div>
        </div>
        <div class="lc-grid">
          <div class="lab-panel"><div class="lp-h">BUILD PATH <i class="gl-sim">${esc(LC.note)}</i></div><ol class="lc-stages" id="lcStages">${LC.stages.map(s => `<li data-s="${s.id}"><span>${s.icon}</span><b>${esc(s.name)}</b><small></small></li>`).join("")}</ol>
            <div class="lab-bar"><input id="lcChange" maxlength="120" placeholder="Ask for a change, e.g. add a dark mode" disabled><button class="btn ghost btn-sm" id="lcEdit" disabled>✏️ Change</button><button class="btn ghost btn-sm" id="lcUndo" disabled>↩ Undo</button><button class="btn btn-sm" id="lcShip" disabled>🚀 Ship</button></div></div>
          <div class="lc-phone-wrap"><div class="lc-phone"><div class="lc-notch"></div><div class="lc-scr" id="lcScr"><p class="muted small">Your app appears here.</p></div></div><div class="lc-plat-tags" id="lcTags"></div></div>
        </div>
        <div class="lab-panel"><div class="lp-h">AFTER LAUNCH · CRASHES, REVIEWS, DAILY SUMMARY</div><div class="lc-kpis" id="lcKpis"></div><ol class="tl-news" id="lcNews"><li class="muted small">Ship the app to see this.</li></ol></div>`;
      Scenes.mount($("#lcAgent", main), { base: "lab", time: "day" });
      const pup = $("#lcPup", main);
      Puppet.mount(pup, charById("ashford"));
      const say = t => { $("#lcBub", main).textContent = t; Puppet.talk(pup, Math.min(4000, 300 + t.length * 40)); };
      const stageLi = id => $(`#lcStages [data-s="${id}"]`, main);
      const setStage = (id, note, state) => { const li = stageLi(id); if (!li) return; li.className = state || "on"; if (note != null) li.querySelector("small").textContent = note; };
      const tags = () => { $("#lcTags", main).innerHTML = PLATS.filter(([k]) => S.plats.has(k)).map(([, l]) => `<span>${l}</span>`).join(""); };
      tags();
      function drawPhone(extra) {
        const a = S.app; if (!a) return;
        $("#lcScr", main).innerHTML = `<div class="lc-app${S.dark ? " dark" : ""}"><b>${esc(a.name)}</b>${a.screens.map((x, i) => `<div class="lc-row${i === 3 ? " pay" : ""}" style="animation-delay:${i * 0.12}s">${i === 3 ? "💳 " + esc(a.product) : esc(x)}</div>`).join("")}${extra || ""}</div>`;
      }
      function kpis() { $("#lcKpis", main).innerHTML = [["installs", S.installs], ["revenue", "$" + S.revenue], ["crashes today", 0], ["snapshots", S.snaps]].map(([k, v]) => `<div><b>${v}</b><small>${k}</small></div>`).join(""); }
      kpis();
      const btns = on => ["#lcChange", "#lcEdit", "#lcShip"].forEach(id => ($(id, main).disabled = !on));

      async function run() {
        const idea = $("#lcIdea", main).value.trim() || IDEAS[0], token = ++S.token;
        stopAfter(); S.live = false; S.snaps = 0; S.dark = false; S.installs = 0; S.revenue = 0; kpis(); btns(false); $("#lcUndo", main).disabled = true;
        $$("#lcStages li", main).forEach(li => { li.className = ""; li.querySelector("small").textContent = ""; });
        $("#lcRun", main).disabled = true;
        $("#lcNews", main).innerHTML = `<li class="muted small">Ship the app to see this.</li>`;
        setStage("idea", "read your paragraph"); say("Got it. Planning the screens, data and payments…"); Puppet.emotion(pup, "thinking");
        coord.pulse("team", "idea → app plan", "in");
        const outP = Brain.ask(`You are LingCode, an agent that turns a product description into a real mobile app. Plan a SIMULATED app for a demo.
Reply with JSON only: {"name":"app name, max 3 words","screens":["5 short screen names, the 4th is checkout"],"data":["3 data tables"],"product":"one thing users buy, with a price","review":"one sentence, max 22 words, what you built"}`, `Product: ${idea}`, 0.7, () => offline(idea));
        await wait(900); if (token !== S.token) return;
        const out = await outP; if (token !== S.token) return;
        const off = offline(idea);
        S.app = { name: Brain.clip(out.name, 24) || off.name, screens: (Array.isArray(out.screens) && out.screens.length >= 4 ? out.screens : off.screens).slice(0, 5).map(x => Brain.clip(x, 22)), data: (Array.isArray(out.data) && out.data.length ? out.data : off.data).slice(0, 3).map(x => Brain.clip(x, 18)), product: Brain.clip(out.product, 40) || off.product, review: Brain.clip(out.review, 160) || off.review };
        setStage("idea", "read your paragraph", "done");
        setStage("build", `${S.app.screens.length} screens`); drawPhone(); await wait(1100); if (token !== S.token) return; setStage("build", null, "done");
        setStage("auth", `sign-in · tables: ${S.app.data.join(", ")}`); await wait(1000); if (token !== S.token) return; setStage("auth", null, "done");
        setStage("pay", S.app.product); await wait(1000); if (token !== S.token) return; setStage("pay", null, "done");
        S.snaps++; kpis();
        say(S.app.review); Puppet.emotion(pup, "happy"); Puppet.gesture(pup, "point", 1200);
        coord.pulse("harnessrouter", "build tasks routed", "out");
        btns(true); $("#lcRun", main).disabled = false;
      }
      async function change() {
        const req = $("#lcChange", main).value.trim(); if (!req || !S.app) return;
        const token = S.token;
        S.snaps++; kpis(); $("#lcUndo", main).disabled = false;
        say(`Snapshot saved. Now: “${Brain.clip(req, 60)}”. Editing and rebuilding…`);
        $("#lcEdit", main).disabled = true;
        await wait(1200); if (token !== S.token) return;
        S.prev = { app: JSON.parse(JSON.stringify(S.app)), dark: S.dark };
        if (/dark/i.test(req)) S.dark = true; else S.app.screens[2] = Brain.clip(req.replace(/^(add|make|put)\s+(a|an|the)?\s*/i, ""), 22) || S.app.screens[2];
        drawPhone(); $("#lcChange", main).value = ""; $("#lcEdit", main).disabled = false;
        say("Rebuilt. If you don't like it, one click on Undo brings the snapshot back.");
        if (S.live) news("New version ready to ship: " + Brain.clip(req, 40));
      }
      function undo() {
        if (!S.prev) return;
        S.app = S.prev.app; S.dark = S.prev.dark; S.prev = null; drawPhone();
        $("#lcUndo", main).disabled = true; say("Rolled back to the snapshot. Nothing lost.");
      }
      function news(t) {
        const ol = $("#lcNews", main); if (ol.querySelector(".muted")) ol.innerHTML = "";
        const li = document.createElement("li");
        li.innerHTML = `<b>${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</b> ${esc(t)}`;
        ol.prepend(li); while (ol.children.length > 5) ol.lastChild.remove();
      }
      async function ship() {
        if (!S.app || S.live) return;
        const token = S.token; $("#lcShip", main).disabled = true;
        const pl = PLATS.filter(([k]) => S.plats.has(k)).map(([, l]) => l.split(" ").slice(1).join(" "));
        setStage("store", "signing · submitting"); say("Signing the build and submitting it to the stores…");
        await wait(1400); if (token !== S.token) return;
        setStage("store", "approved", "done"); setStage("live", pl.join(" · "), "done");
        S.live = true;
        drawPhone(`<span class="lc-badge">Live · ${esc(pl.join(" · "))}</span>`);
        say(`${S.app.name} is live. I'll send crash reports, reviews and a daily summary.`); Puppet.gesture(pup, "nod", 1000);
        coord.pulse("teamily", "🚀 launch posted", "out");
        coord.pulse("bruin", "installs · revenue", "out");
        const tick = () => {
          S.installs += 20 + Math.floor(Math.random() * 60); S.revenue += 3 + Math.floor(Math.random() * 20); kpis();
          news(rand(LC.after));
        };
        tick(); S.afterT = setInterval(tick, 5000);
      }
      function stopAfter() { clearInterval(S.afterT); S.afterT = null; }
      $("#lcRun", main).onclick = run;
      $("#lcIdea", main).onkeydown = e => { if (e.key === "Enter") run(); };
      $("#lcEx", main).onclick = e => { const b = e.target.closest("button"); if (b) $("#lcIdea", main).value = b.textContent; };
      $("#lcPlat", main).onclick = e => { const b = e.target.closest("[data-p]"); if (!b) return; if (S.plats.has(b.dataset.p) && S.plats.size > 1) S.plats.delete(b.dataset.p); else S.plats.add(b.dataset.p); $$("#lcPlat button", main).forEach(x => x.classList.toggle("on", S.plats.has(x.dataset.p))); tags(); };
      $("#lcEdit", main).onclick = change;
      $("#lcChange", main).onkeydown = e => { if (e.key === "Enter") change(); };
      $("#lcUndo", main).onclick = undo;
      $("#lcShip", main).onclick = ship;
      return { destroy() { S.token++; stopAfter(); } };
    }
  }

  /* =========================================================
     HarnessRouter: send a task, choose quality / cost / latency, see the routed harness,
     the sandbox, the trace and the terminal state; compare harnesses in an arena
     ========================================================= */
  const HR = P && P.harnessrouter;
  if (HR) {
    const C = "#f6a04d";
    const TASKS = ["Patch the medkit spawn rate and rebuild", "Write Rook's next move in the heist", "Score this interview answer with evidence", "Build a landing page for our project", "Turn this thread into a 5-slide deck", "Plan next week's practice sessions"];
    const PREFS = [["quality", "🎯 Quality"], ["cost", "🪙 Cost"], ["latency", "⚡ Latency"]];
    const maxMs = Math.max(...HR.harnesses.map(h => h.ms)), maxCost = Math.max(...HR.harnesses.map(h => h.cost));
    const W8 = { quality: [0.75, 0.15, 0.1], cost: [0.25, 0.6, 0.15], latency: [0.25, 0.15, 0.6] };
    const score = (h, pref) => { const [q, c, l] = W8[pref]; return q * h.q + c * (1 - h.cost / maxCost) + l * (1 - h.ms / maxMs); };
    const UNIT = 0.004;   /* example: one "1×" run of a task, in dollars */
    const SPANS = ["sandbox.provision", "harness.start", "model.step", "tool.call", "model.step", "files.write", "result.return"];

    LABS.push({
      id: "harnessrouter", tool: "Agent harness runtime", playLink: "game",
      title: "Run any agent harness behind one API, and route each task to the one that wins",
      pitch: "Your agent product sends a task. HarnessRouter starts a complete agent harness (Codex, Claude Code, Hermes, Pi…) in its own sandbox, streams progress back and returns the result with a full trace. Smart routing picks the harness for quality, cost or latency, and every run ends in a clear state.",
      how: [
        "<b>Write a task</b> for your agent, or pick an example. Choose what matters most: quality, cost or latency.",
        "Press <b>🔀 Route</b>: every harness is scored for this task and the winner runs it in its <b>own isolated sandbox</b>.",
        "Watch the <b>trace</b>: sandbox, harness start, model steps, tool calls, files, result.",
        "Tick <b>Simulate a timeout</b>: the run ends as <b>incomplete</b>, with the reason and the partial work kept. No silent retry; your app decides.",
        "Press <b>🏟 Arena</b> to run the same task on every harness and compare time, cost and quality. Everything here is simulated with example numbers."
      ],
      demoChars: ["bolt"], demoScenes: { bg: { base: "office", time: "night" } },
      demo: [
        { cap: "Your agent product sends one task", dur: 3.0, draw(ctx, p, A, W, H) { drawCover(ctx, A.s.bg, W, H); ctx.fillStyle = "rgba(5,8,20,.45)"; ctx.fillRect(0, 0, W, H); drawPup(ctx, A.p.bolt, 150, 340, 220); const t = "Patch the medkit spawn rate"; textBox(ctx, t.slice(0, Math.ceil(t.length * Math.min(1, p * 1.6))), 270, 110, 320, {}); } },
        { cap: "Smart routing picks the harness that wins", dur: 3.6, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = C; rr(ctx, 40, 150, 130, 50, 10); ctx.fill(); ctx.fillStyle = "#1b1530"; ctx.font = "800 15px 'Space Grotesk', sans-serif"; ctx.fillText("ONE API", 70, 181); HR.harnesses.forEach((h, i) => { const y = 50 + i * 72, on = p > 0.55 && h.id === "codex"; ctx.strokeStyle = on ? h.color : "rgba(246,160,77,.25)"; ctx.lineWidth = on ? 3 : 1; ctx.beginPath(); ctx.moveTo(170, 175); ctx.bezierCurveTo(260, 175, 260, y + 22, 340, y + 22); ctx.stroke(); ctx.fillStyle = on ? "rgba(92,141,255,.25)" : "rgba(16,23,47,.92)"; rr(ctx, 340, y, 240, 44, 10); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "700 14px 'Space Grotesk', sans-serif"; ctx.fillText(`${h.icon} ${h.name}${on ? "  ✓" : ""}`, 356, y + 27); }); } },
        { cap: "It runs in its own sandbox, with a full trace", dur: 3.6, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H); SPANS.forEach((n, i) => { if (p * 8 > i) { ctx.fillStyle = "#e6ecff"; ctx.font = "13px 'JetBrains Mono', monospace"; ctx.fillText(n, 40, 60 + i * 38); ctx.fillStyle = C; rr(ctx, 230 + i * 40, 46 + i * 38, 60 + (i % 3) * 30, 18, 4); ctx.fill(); } }); } },
        { cap: "Every run ends in a clear state", dur: 3.2, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H); textBox(ctx, "✅ completed · result + files + trace", 80, 100, 460, { bg: "rgba(182,255,92,.95)", color: "#14240a" }); if (p > 0.45) textBox(ctx, "⏱ incomplete · timeout · partial work kept · your app decides", 80, 200, 480, { bg: "rgba(246,160,77,.95)", color: "#2a1606" }); } }
      ],
      build: buildHarness
    });

    function buildHarness(main, coord) {
      coord = coord || { pulse() {} };
      const S = { token: 0, pref: "quality", running: false, runs: 0, spans: [] };
      main.innerHTML = `
        <div class="gl-top">
          <div class="gl-agent" id="hrAgent"><div class="gl-pup" id="hrPup"></div><div class="gl-bub" id="hrBub">Give me a task. I'll send it to the agent harness that does it best, in its own sandbox.</div></div>
          <div class="gl-goal">
            <label class="small muted" for="hrTask">Task from your agent product</label>
            <div class="lab-bar"><input id="hrTask" maxlength="160" value="${esc(TASKS[0])}"><button class="btn btn-sm" id="hrRun">🔀 Route</button><button class="btn ghost btn-sm" id="hrArena">🏟 Arena</button></div>
            <div class="ex-chips" id="hrEx">${TASKS.map(g => `<button>${esc(g)}</button>`).join("")}</div>
            <div class="tl-opts"><span class="chip-row hr-pref" id="hrPref">${PREFS.map(([k, l]) => `<button data-p="${k}" class="${k === S.pref ? "on" : ""}">${l}</button>`).join("")}</span>
              <label class="gl-auto"><input type="checkbox" id="hrTimeout"> Simulate a timeout</label></div>
          </div>
        </div>
        <div class="tl-grid">
          <div class="lab-panel"><div class="lp-h">SMART ROUTING <span class="muted">· harness × model, scored for this task</span> <i class="gl-sim">${esc(HR.note)}</i></div><div id="hrRouter"></div></div>
          <div class="lab-panel"><div class="lp-h">SANDBOX · ONE PER TASK</div><div id="hrBox"><p class="muted small">Route a task to see it run.</p></div></div>
        </div>
        <div class="tl-grid">
          <div class="lab-panel"><div class="lp-h">TRACE</div><div id="hrTrace"><p class="muted small">No trace yet.</p></div></div>
          <div class="lab-panel"><div class="lp-h">ONE KEY, SWAP BY CONFIG</div><pre class="hr-code">${esc(HR.example)}</pre></div>
        </div>
        <div class="lab-panel" id="hrArenaP" hidden><div class="lp-h">HARNESS ARENA · SAME TASK ON EVERY HARNESS <i class="gl-sim">example numbers, not a benchmark</i></div><div id="hrArenaOut"></div></div>`;
      Scenes.mount($("#hrAgent", main), { base: "office", time: "night" });
      const pup = $("#hrPup", main);
      Puppet.mount(pup, charById("bolt"));
      const say = t => { $("#hrBub", main).textContent = t; Puppet.talk(pup, Math.min(4000, 300 + t.length * 40)); };
      const ranked = () => HR.harnesses.slice().sort((a, b) => score(b, S.pref) - score(a, S.pref));
      function drawRouter(pick) {
        $("#hrRouter", main).innerHTML = ranked().map(h => `<div class="hr-h${h.id === pick ? " on" : ""}" style="--c:${h.color}"><span>${h.icon}</span><b>${esc(h.name)}${h.id === pick ? " <i>✓ routed</i>" : ""}</b><small>${esc(h.good)}</small><em>score ${score(h, S.pref).toFixed(2)} · ~${(h.ms / 1000).toFixed(1)} s · ${h.cost}× cost</em></div>`).join("");
      }
      function drawTrace() {
        if (!S.spans.length) { $("#hrTrace", main).innerHTML = `<p class="muted small">No trace yet.</p>`; return; }
        const total = Math.max(1, S.spans.reduce((a, s) => Math.max(a, s.start + s.ms), 0));
        $("#hrTrace", main).innerHTML = `<div class="tl-wf">${S.spans.map(s => `<div class="${s.fail ? "fail" : ""}"><span>${esc(s.name)}</span><i><b style="left:${s.start / total * 100}%;width:${Math.max(1.5, s.ms / total * 100)}%"></b></i><em>${s.ms} ms${s.fail ? " · timeout" : ""}</em></div>`).join("")}</div>`;
      }
      drawRouter();

      async function run() {
        if (S.running) return;
        const task = $("#hrTask", main).value.trim() || TASKS[0], token = ++S.token, timeout = $("#hrTimeout", main).checked;
        S.running = true; S.spans = []; $("#hrRun", main).disabled = true;
        const pick = ranked()[0];
        drawRouter(); say("Scoring every harness for this task…"); Puppet.emotion(pup, "thinking");
        coord.pulse("team", "task: " + task.slice(0, 18), "in");
        await wait(800); if (token !== S.token) return;
        drawRouter(pick.id);
        $("#hrBox", main).innerHTML = `<div class="hr-sb" style="--c:${pick.color}"><div class="hr-sb-h"><b>${pick.icon} ${esc(pick.name)}</b><small>sandbox #${1000 + S.runs + 1} · isolated</small></div><ol id="hrLog"></ol><div class="hr-state" id="hrState">running…</div></div>`;
        const log = t => { const li = document.createElement("li"); li.textContent = t; $("#hrLog", main).appendChild(li); };
        let t = 0;
        const steps = timeout ? SPANS.slice(0, 5) : SPANS;
        for (let i = 0; i < steps.length; i++) {
          const ms = Math.round((pick.ms / SPANS.length) * (0.6 + Math.random() * 0.8)) + (i === 0 ? 120 : 0);
          const fail = timeout && i === steps.length - 1;
          S.spans.push({ name: steps[i], start: t, ms: fail ? ms * 4 : ms, fail }); t += fail ? ms * 4 : ms;
          log(`${fail ? "⏱" : "▸"} ${steps[i]}${fail ? " · no answer, time limit reached" : ""}`);
          drawTrace();
          await wait(fail ? 1100 : 380); if (token !== S.token) return;
        }
        S.runs++;
        const st = $("#hrState", main);
        if (timeout) {
          st.className = "hr-state inc"; st.innerHTML = `<b>incomplete</b> · reason: timeout · partial work kept · full trace · no silent retry`;
          say("It timed out. You get a clear 'incomplete' with the partial work and the trace. Your app decides what happens next.");
          Puppet.emotion(pup, "thinking");
        } else {
          st.className = "hr-state ok"; st.innerHTML = `<b>completed</b> · ${(t / 1000).toFixed(1)} s · ${pick.cost}× cost · result + files + trace`;
          say(`Done on ${pick.name}. Same API whichever harness ran it.`); Puppet.emotion(pup, "happy"); Puppet.gesture(pup, "nod", 900);
        }
        coord.pulse("team", timeout ? "incomplete · traced" : "result · traced", "out");
        coord.pulse("bruin", `trace · ${S.spans.length} spans`, "out");
        S.running = false; $("#hrRun", main).disabled = false;
      }
      async function arena() {
        const task = $("#hrTask", main).value.trim() || TASKS[0], token = ++S.token;
        S.running = false; $("#hrRun", main).disabled = false;
        $("#hrArenaP", main).hidden = false;
        const out = $("#hrArenaOut", main);
        out.innerHTML = `<p class="small muted">Running “${esc(task)}” on ${HR.harnesses.length} harnesses at once, each in its own sandbox…</p><div class="hr-arena">${HR.harnesses.map(h => `<div data-h="${h.id}" style="--c:${h.color}"><b>${h.icon} ${esc(h.name)}</b><i><s></s></i><small>running…</small></div>`).join("")}</div>`;
        say("Same task, every harness. Let's see which one wins.");
        const res = HR.harnesses.map(h => ({ h, ms: Math.round(h.ms * (0.8 + Math.random() * 0.4)), q: Math.min(0.99, h.q + (Math.random() - 0.5) * 0.06) }));
        const slow = Math.max(...res.map(r => r.ms));
        res.forEach(r => { const d = $(`[data-h="${r.h.id}"]`, out); d.querySelector("s").style.transition = `width ${r.ms / slow * 2.2}s linear`; requestAnimationFrame(() => (d.querySelector("s").style.width = "100%")); });
        let elapsed = 0;
        for (const r of res.slice().sort((a, b) => a.ms - b.ms)) {
          const at = r.ms / slow * 2200;
          await wait(at - elapsed); elapsed = at; if (token !== S.token) return;
          $(`[data-h="${r.h.id}"] small`, out).textContent = `${(r.ms / 1000).toFixed(1)} s · $${(r.h.cost * UNIT).toFixed(3)} · quality ${r.q.toFixed(2)}`;
        }
        const best = res.slice().sort((a, b) => score({ ...b.h, q: b.q, ms: b.ms }, S.pref) - score({ ...a.h, q: a.q, ms: a.ms }, S.pref))[0];
        $(`[data-h="${best.h.id}"]`, out).classList.add("win");
        out.insertAdjacentHTML("beforeend", `<p class="small">🏆 For <b>${esc(PREFS.find(p => p[0] === S.pref)[1])}</b>, keep <b>${esc(best.h.name)}</b>. Switching is one config line: <code>"base": "${best.h.id}"</code></p>`);
        say(`${best.h.name} wins on ${S.pref} for this task. Keep it, and route the next task again.`);
        coord.pulse("bruin", "arena: time · cost · quality", "out");
      }
      $("#hrRun", main).onclick = run;
      $("#hrArena", main).onclick = arena;
      $("#hrTask", main).onkeydown = e => { if (e.key === "Enter") run(); };
      $("#hrEx", main).onclick = e => { const b = e.target.closest("button"); if (b) $("#hrTask", main).value = b.textContent; };
      $("#hrPref", main).onclick = e => { const b = e.target.closest("[data-p]"); if (!b) return; S.pref = b.dataset.p; $$("#hrPref button", main).forEach(x => x.classList.toggle("on", x === b)); drawRouter(); };
      return { destroy() { S.token++; } };
    }
  }
})();

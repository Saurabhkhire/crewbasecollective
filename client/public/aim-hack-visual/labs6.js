/* Sponsor Labs, part 6: Telem AI (web infrastructure for agents: search routing, clean page
   fetching, monitoring for new information, and a trace of every step).
   Registers into window.__LABS__.LABS created by labs.js.
   Everything here is SIMULATED: no request goes to Telem AI or any search engine. Engines are
   generic examples, results are samples (or written by the labs' AI server when it is on).
   Engines, prices and track searches live in PLAY.telem (play-data.js). */
(function () {
  const L = window.__LABS__;
  if (!L) return;
  const { LABS, $, $$, esc, rand, clamp, wait, ease, charById, rr, textBox, drawCover, drawPup } = L;
  const P = window.PLAY, T = P && P.telem;
  if (!T) return;
  const C = "#e86bff";
  const GOALS = ["1920s jazz club slang for a speakeasy scene", "Latest product launch at Lumen Labs", "Best strategy to survive a zombie wave", "How long does air last in an escape pod?", "Rainy-night sound design for a noir film", "Common product manager interview questions"];
  const PREFS = [["balanced", "⚖️ Balanced"], ["speed", "⚡ Speed"], ["quality", "🎯 Quality"], ["cost", "🪙 Cost"]];
  const WEIGHTS = { balanced: [0.5, 0.25, 0.25], speed: [0.25, 0.6, 0.15], quality: [0.8, 0.1, 0.1], cost: [0.25, 0.15, 0.6] };
  const maxMs = Math.max(...T.engines.map(e => e.ms)), maxCost = Math.max(...T.engines.map(e => e.cost));
  const score = (e, pref) => { const [wq, wl, wc] = WEIGHTS[pref]; return wq * e.q + wl * (1 - e.ms / maxMs) + wc * (1 - e.cost / maxCost); };
  const NEWS = ["A new article on this topic was published 2 min ago", "A forum thread picked up 40 new replies", "The official page changed its pricing section", "A video on this topic is trending", "A news site updated its story with new numbers"];

  /* ---------- offline results ---------- */
  const SITES = ["history-notes.org", "the-daily-signal.com", "guides.example.dev", "forum.example.net", "wiki.example.org"];
  function offline(goal) {
    const g = goal.replace(/\?$/, "");
    return {
      results: [
        { title: `${g}: a practical guide`, site: SITES[0], snippet: `A clear overview of ${g.toLowerCase()}, with examples and the three points most people miss.` },
        { title: `What changed this year in ${g.toLowerCase().split(" ").slice(0, 3).join(" ")}`, site: SITES[1], snippet: "A recent update with dates and quotes from people involved." },
        { title: `Ask the community: ${g.toLowerCase()}`, site: SITES[3], snippet: "Forum answers ranked by votes; the top answer has a step-by-step list." }
      ],
      clean: [`${g}: key points`, "The most useful fact comes first and is easy to quote.", "Two examples you can drop straight into your project.", "Source and date are kept, so your agent can cite them."],
      answer: `Here's what I found: the top guide covers it best. I'll use its key point and cite it as [1].`
    };
  }
  const NOISE = ['<div class="cookie-banner">We use cookies…</div>', '<script src="tracker.js"></script>', '<nav>Home · Shop · Login · Menu ▾</nav>', '<div class="ad">🔥 Buy now 50% off</div>', '<aside>Related: 12 more posts</aside>', '<footer>© all rights · newsletter</footer>'];

  /* ---------- demo ---------- */
  function engineRows(ctx, pick, down, p) {
    T.engines.forEach((e, i) => {
      const y = 70 + i * 56, on = e.id === pick, dn = e.id === down;
      ctx.fillStyle = on ? "rgba(232,107,255,.22)" : "rgba(16,23,47,.92)"; rr(ctx, 300, y, 300, 46, 10); ctx.fill();
      ctx.strokeStyle = dn ? "#ff6b6b" : on ? C : "rgba(232,107,255,.25)"; ctx.lineWidth = on || dn ? 2 : 1; ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "700 13px 'Space Grotesk', sans-serif"; ctx.fillText(`${e.icon} ${e.name}${dn ? " · down" : ""}`, 314, y + 20);
      ctx.fillStyle = dn ? "#ff6b6b" : C; rr(ctx, 314, y + 28, 200 * e.q * Math.min(1, p * 2), 7, 3); ctx.fill();
    });
  }
  LABS.push({
    id: "telem", tool: "Live web search", playLink: "film",
    title: "Let your agent search the live web, and see every step",
    pitch: "Your agent asks a question. Telem AI routes the search to the best engine for cost, speed and quality, fails over if one is down, fetches clean readable pages instead of raw HTML, watches for new information, and traces every step.",
    how: [
      "<b>Give the agent a question</b>, or pick an example. Choose what to optimise for: balance, speed, quality or cost.",
      "The <b>search router</b> scores every engine and picks the best one. Tick <b>Simulate an outage</b> to watch it fail over.",
      "Results come back. Press <b>📄 Fetch clean</b> on one: cookie banners, ads and scripts are stripped, and your model gets readable text.",
      "Press <b>👁 Watch</b> to monitor the topic: new information appears as it shows up.",
      "The <b>trace</b> shows every step with its time and a quality score, so you can see why your agent said what it said. Everything here is simulated."
    ],
    demoChars: ["marlowe"], demoScenes: { bg: { base: "library", time: "night" } },
    demo: [
      { cap: "Your agent needs a fact from the live web", dur: 3.2, draw(ctx, p, A, W, H) { drawCover(ctx, A.s.bg, W, H); ctx.fillStyle = "rgba(5,8,20,.45)"; ctx.fillRect(0, 0, W, H); drawPup(ctx, A.p.marlowe, 150, 340, 220); const t = "🔎 1920s jazz club slang"; textBox(ctx, t.slice(0, Math.ceil(t.length * Math.min(1, p * 1.6))), 270, 110, 320, {}); } },
      { cap: "Telem routes it to the best engine", dur: 3.4, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H); drawPup(ctx, A.p.marlowe, 140, 340, 200); engineRows(ctx, p > 0.55 ? "deep" : "", p > 0.3 ? "fast" : "", p); if (p > 0.3) textBox(ctx, "Fast engine is down → failover", 300, 300, 300, { bg: "rgba(255,107,107,.95)" }); } },
      { cap: "It fetches a clean, readable page", dur: 3.4, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H); ctx.font = "12px 'JetBrains Mono', monospace"; NOISE.forEach((n, i) => { ctx.fillStyle = `rgba(255,140,140,${Math.max(0, 1 - p * 2)})`; ctx.fillText(n, 40, 80 + i * 26); }); if (p > 0.45) ["# 1920s slang", "• “The bee's knees”: excellent", "• “Juice joint”: a speakeasy", "Source: history-notes.org"].forEach((l, i) => { ctx.fillStyle = i ? "#e6ecff" : C; ctx.font = (i ? "" : "700 ") + "16px 'Space Grotesk', sans-serif"; ctx.fillText(l, 360, 110 + i * 34); }); } },
      { cap: "Every step is traced", dur: 3.8, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H); [["agent.query", 0, 20], ["router.score", 20, 30], ["search · fast (failed)", 50, 60], ["search · deep", 110, 180], ["fetch.clean", 290, 120], ["agent.answer", 410, 60]].forEach(([n, s, d], i) => { if (p * 7 > i) { ctx.fillStyle = "#e6ecff"; ctx.font = "13px 'JetBrains Mono', monospace"; ctx.fillText(n, 40, 70 + i * 40); ctx.fillStyle = /failed/.test(n) ? "#ff6b6b" : C; rr(ctx, 250 + s * 0.7, 56 + i * 40, Math.max(8, d * 0.7), 18, 4); ctx.fill(); } }); if (p > 0.8) textBox(ctx, "Judged quality 0.92", 440, 320, 220, { bg: "rgba(232,107,255,.95)", color: "#1a0420" }); } }
    ],
    build: buildTelem
  });

  function buildTelem(main, coord) {
    coord = coord || { pulse() {} };
    const S = { pref: "balanced", token: 0, running: false, spans: [], t0: 0, watchT: null, seen: 0, out: null, goal: "" };
    main.innerHTML = `
      <div class="gl-top">
        <div class="gl-agent" id="tlAgent"><div class="gl-pup" id="tlPup"></div><div class="gl-bub" id="tlBub">Ask me anything that needs the live web. You'll see which engine I use and every step I take.</div></div>
        <div class="gl-goal">
          <label class="small muted" for="tlGoal">Agent question</label>
          <div class="lab-bar"><input id="tlGoal" maxlength="160" value="${esc(GOALS[0])}"><button class="btn btn-sm" id="tlRun">🔎 Search</button></div>
          <div class="ex-chips" id="tlEx">${GOALS.map(g => `<button>${esc(g)}</button>`).join("")}</div>
          <div class="tl-opts"><span class="chip-row" id="tlPref">${PREFS.map(([k, l]) => `<button data-p="${k}" class="${k === S.pref ? "on" : ""}">${l}</button>`).join("")}</span>
            <label class="gl-auto"><input type="checkbox" id="tlDown"> Simulate an engine outage</label></div>
        </div>
      </div>
      <div class="tl-grid">
        <div class="lab-panel"><div class="lp-h">SEARCH ROUTER <span class="muted">· one API, scored by quality, speed and cost</span></div><div id="tlRouter"></div></div>
        <div class="lab-panel"><div class="lp-h">RESULTS <i class="gl-sim">${esc(T.note)}</i></div><div id="tlRes"><p class="muted small">Search to see results here.</p></div></div>
      </div>
      <div class="tl-grid">
        <div class="lab-panel"><div class="lp-h">CLEAN FETCH <span class="muted">· readable content, not raw HTML</span></div><div id="tlFetch"><p class="muted small">Press 📄 Fetch clean on a result.</p></div></div>
        <div class="lab-panel"><div class="lp-h">MONITOR <span class="muted">· new information on this topic</span></div>
          <div class="tl-watch"><button class="btn ghost btn-sm" id="tlWatch" disabled>👁 Watch this topic</button><small class="muted" id="tlWatchSt">Search first, then watch the topic.</small></div><ol class="tl-news" id="tlNews"></ol></div>
      </div>
      <div class="lab-panel"><div class="lp-h">TRACE · EVERY STEP YOUR AGENT TOOK</div><div id="tlTrace"><p class="muted small">No trace yet.</p></div></div>`;
    Scenes.mount($("#tlAgent", main), { base: "library", time: "night" });
    const pup = $("#tlPup", main);
    Puppet.mount(pup, charById("marlowe"));
    const say = t => { $("#tlBub", main).textContent = t; Puppet.talk(pup, Math.min(4000, 300 + t.length * 40)); };

    function drawRouter(pick, down, scored) {
      $("#tlRouter", main).innerHTML = T.engines.map(e => {
        const sc = scored ? score(e, S.pref) : 0, dn = e.id === down, on = e.id === pick;
        return `<div class="tl-eng ${on ? "on" : ""} ${dn ? "down" : ""}"><span class="tl-ic">${e.icon}</span><b>${esc(e.name)}${dn ? " <i>down → failover</i>" : on ? " <i>✓ picked</i>" : ""}</b>
          <div class="tl-m"><small>quality</small><i style="--w:${e.q * 100}%"></i><small>speed</small><i style="--w:${(1 - e.ms / maxMs) * 85 + 15}%"></i><small>cost</small><i style="--w:${(1 - e.cost / maxCost) * 85 + 15}%"></i></div>
          <em>${e.ms} ms · ${T.price(e.cost)}${scored ? ` · score ${sc.toFixed(2)}` : ""}</em></div>`;
      }).join("");
    }
    function span(name, ms, o) { o = o || {}; const s = { name, start: S.t, ms, fail: !!o.fail, q: o.q }; S.t += ms; S.spans.push(s); drawTrace(); return s; }
    function drawTrace() {
      if (!S.spans.length) { $("#tlTrace", main).innerHTML = `<p class="muted small">No trace yet.</p>`; return; }
      const total = Math.max(1, S.t), qs = S.spans.filter(s => s.q != null);
      $("#tlTrace", main).innerHTML = `<div class="tl-wf">${S.spans.map(s => `<div class="${s.fail ? "fail" : ""}"><span>${esc(s.name)}</span><i><b style="left:${s.start / total * 100}%;width:${Math.max(1.5, s.ms / total * 100)}%"></b></i><em>${s.ms} ms${s.fail ? " · failed" : ""}${s.q != null ? ` · q ${s.q.toFixed(2)}` : ""}</em></div>`).join("")}</div>
        <div class="tl-sum"><span>Total <b>${S.t} ms</b></span><span>Steps <b>${S.spans.length}</b></span>${qs.length ? `<span>Judged quality <b>${(qs.reduce((a, s) => a + s.q, 0) / qs.length).toFixed(2)}</b></span>` : ""}<span>Platform fee <b>$0</b></span></div>`;
    }
    function drawResults(rs) {
      $("#tlRes", main).innerHTML = `<ol class="tl-rs">${rs.map((r, i) => `<li><b>[${i + 1}] ${esc(r.title)}</b><small>${esc(r.site)}</small><p>${esc(r.snippet)}</p><button class="btn ghost btn-sm" data-f="${i}">📄 Fetch clean</button></li>`).join("")}</ol>`;
    }
    drawRouter(); drawTrace();

    async function fetchClean(i) {
      const r = S.out.results[i]; if (!r) return;
      const box = $("#tlFetch", main), token = S.token;
      box.innerHTML = `<div class="tl-raw">${NOISE.map(n => `<code>${esc(n)}</code>`).join("")}<code>&lt;h1&gt;${esc(r.title)}&lt;/h1&gt;&lt;p&gt;${esc(r.snippet)}&lt;/p&gt;</code></div>`;
      coord.pulse("team", "fetch: " + r.site, "in");
      await wait(700); if (token !== S.token) return;
      $$(".tl-raw code", box).forEach((c, k) => setTimeout(() => c.classList.add("gone"), k * 120));
      await wait(NOISE.length * 120 + 500); if (token !== S.token) return;
      const lines = S.out.clean && S.out.clean.length ? S.out.clean : offline(S.goal).clean;
      box.innerHTML = `<div class="tl-clean"><b># ${esc(r.title)}</b>${lines.slice(1, 4).map(l => `<p>• ${esc(l)}</p>`).join("")}<small>Source: ${esc(r.site)} · extracted from rendered page · ${NOISE.length} junk blocks removed</small></div>`;
      span(`fetch.render · ${r.site}`, 240 + Math.round(Math.random() * 200));
      span("fetch.extract → clean text", 60 + Math.round(Math.random() * 40), { q: 0.9 + Math.random() * 0.08 });
      say(`Read ${r.site}: ${Brain.clip(lines[1] || r.snippet, 120)} I'll cite it as [${i + 1}].`);
      Puppet.gesture(pup, "nod", 900);
      coord.pulse("runware", "clean text → model", "out");
    }

    async function run() {
      if (S.running) return;
      const goal = $("#tlGoal", main).value.trim() || GOALS[0], token = ++S.token;
      S.running = true; S.goal = goal; S.spans = []; S.t = 0; $("#tlRun", main).disabled = true;
      stopWatch(); $("#tlNews", main).innerHTML = ""; $("#tlFetch", main).innerHTML = `<p class="muted small">Press 📄 Fetch clean on a result.</p>`;
      $("#tlRes", main).innerHTML = `<p class="muted small">Searching…</p>`;
      say("Routing the search…"); Puppet.emotion(pup, "thinking");
      coord.pulse("team", "search: " + goal.slice(0, 20), "in");
      span("agent.query", 12);
      drawRouter(null, null, true);
      span("router.score engines", 18);
      await wait(800); if (token !== S.token) return;
      const ranked = T.engines.slice().sort((a, b) => score(b, S.pref) - score(a, S.pref));
      let pick = ranked[0], down = null;
      if ($("#tlDown", main).checked) {
        down = pick.id; drawRouter(null, down, true);
        span(`search · ${pick.name}`, Math.round(pick.ms * 0.6), { fail: true });
        say(`${pick.name} isn't answering. Failing over…`);
        await wait(900); if (token !== S.token) return;
        pick = ranked[1];
      }
      drawRouter(pick.id, down, true);
      const outP = Brain.ask(`You are a web search agent. For the user's question, write 3 plausible web results and a cleaned page extract. These are SIMULATED sample results for a demo: generic site names ending in .example.org/.example.com, never claim they are real.
Reply with JSON only: {"results":[{"title":"max 9 words","site":"domain","snippet":"max 22 words"}],"clean":["page title","fact 1, max 18 words","fact 2","fact 3"],"answer":"one sentence answer that cites [1], max 28 words"}`, `Question: ${goal}`, 0.7, () => offline(goal));
      await wait(Math.min(1400, pick.ms + 300));
      const out = await outP;
      if (token !== S.token) return;
      const off = offline(goal);
      S.out = { results: (Array.isArray(out.results) && out.results.length ? out.results : off.results).slice(0, 3).map(r => ({ title: Brain.clip(r.title, 80), site: Brain.clip(r.site, 40), snippet: Brain.clip(r.snippet, 180) })), clean: Array.isArray(out.clean) ? out.clean.map(x => Brain.clip(x, 140)) : off.clean, answer: Brain.clip(out.answer, 220) || off.answer };
      span(`search · ${pick.name}`, pick.ms, { q: pick.q });
      drawResults(S.out.results);
      span("agent.answer", 40);
      say(S.out.answer); Puppet.emotion(pup, "happy"); Puppet.gesture(pup, "point", 1400);
      coord.pulse("team", `${S.out.results.length} results · traced`, "out");
      coord.pulse("bruin", `trace · ${S.spans.length} steps`, "out");
      $("#tlWatch", main).disabled = false; $("#tlWatchSt", main).textContent = `Ready to watch “${goal.slice(0, 40)}”.`;
      S.running = false; $("#tlRun", main).disabled = false;
    }
    function stopWatch() { clearInterval(S.watchT); S.watchT = null; const b = $("#tlWatch", main); if (b) b.textContent = "👁 Watch this topic"; }
    function toggleWatch() {
      if (S.watchT) { stopWatch(); $("#tlWatchSt", main).textContent = "Stopped watching."; return; }
      $("#tlWatch", main).textContent = "■ Stop watching";
      $("#tlWatchSt", main).innerHTML = `<span class="tl-live">●</span> Watching “${esc(S.goal.slice(0, 40))}”, checking every few seconds…`;
      const tick = () => {
        S.seen++;
        const li = document.createElement("li");
        li.innerHTML = `<b>${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</b> ${esc(rand(NEWS))} <i>“${esc(S.goal.slice(0, 32))}”</i>`;
        $("#tlNews", main).prepend(li);
        while ($("#tlNews", main).children.length > 5) $("#tlNews", main).lastChild.remove();
        span("monitor.check → new item", 90 + Math.round(Math.random() * 80));
        coord.pulse("teamily", "🔔 new info posted", "out");
      };
      setTimeout(tick, 1200);
      S.watchT = setInterval(tick, 6500);
    }

    $("#tlRun", main).onclick = run;
    $("#tlGoal", main).onkeydown = e => { if (e.key === "Enter") run(); };
    $("#tlEx", main).onclick = e => { const b = e.target.closest("button"); if (b) $("#tlGoal", main).value = b.textContent; };
    $("#tlPref", main).onclick = e => { const b = e.target.closest("[data-p]"); if (!b) return; S.pref = b.dataset.p; $$("#tlPref button", main).forEach(x => x.classList.toggle("on", x === b)); drawRouter(null, null, true); };
    $("#tlRes", main).onclick = e => { const b = e.target.closest("[data-f]"); if (b) fetchClean(+b.dataset.f); };
    $("#tlWatch", main).onclick = toggleWatch;
    return { destroy() { S.token++; stopWatch(); } };
  }
})();

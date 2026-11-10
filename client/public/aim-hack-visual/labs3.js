/* Sponsor Labs, part 3: Glasser (real-world data APIs for agents).
   Registers into window.__LABS__.LABS created by labs.js.
   Everything here is SIMULATED: no request goes to Glasser; prices are examples from glasser.ai,
   data rows are generated samples. Catalogue + helpers live in PLAY.glasser (play-data.js). */
(function () {
  const L = window.__LABS__;
  if (!L) return;
  const { LABS, $, $$, esc, rand, clamp, wait, ease, charById, sp, rr, textBox, drawCover, drawPup } = L;
  const P = window.PLAY, G = P && P.glasser;
  if (!G) return;

  const KINDS = [["all", "All"], ["people", "🧑‍💼 People"], ["company", "🏢 Company"], ["seo", "📊 SEO"], ["web", "🌐 Web"], ["ecommerce", "📦 E-commerce"], ["places", "📍 Places"], ["social", "💬 Social"], ["finance", "💹 Finance"]];
  const GOALS = ["Find 5 AI startups in SF hiring engineers", "Price-check 3 camping lanterns on Amazon", "Top keywords for “AI hackathon”", "Research Lumen Labs before my interview", "Find coffee shops near the AWS Loft", "What tech stack does a Series B startup use?"];
  const money = n => "$" + (n >= 1 ? n.toFixed(2) : n.toFixed(4).replace(/0+$/, "").replace(/\.$/, ".00"));
  const subMonthly = s => { const m = String(s || "").match(/\$(\d+(?:\.\d+)?)/); return m ? +m[1] : 0; };

  /* ---------- offline planner: pick endpoints + sample rows by keyword ---------- */
  const ROWS = {
    company: [{ Company: "Northwind AI", Location: "San Francisco", Staff: "84", "Eng roles": "6" }, { Company: "Lumen Labs", Location: "San Francisco", Staff: "41", "Eng roles": "3" }, { Company: "Parcel Robotics", Location: "Oakland", Staff: "120", "Eng roles": "9" }, { Company: "Quill Health", Location: "San Francisco", Staff: "57", "Eng roles": "4" }, { Company: "Atlas Agents", Location: "Palo Alto", Staff: "33", "Eng roles": "5" }],
    people: [{ Title: "Senior ML Engineer", Location: "Seattle", Experience: "9 yrs" }, { Title: "Staff Engineer", Location: "San Francisco", Experience: "12 yrs" }, { Title: "Product Designer", Location: "Remote", Experience: "6 yrs" }, { Title: "Data Scientist", Location: "Austin", Experience: "5 yrs" }],
    seo: [{ Keyword: "ai hackathon", Volume: "8.1k/mo", Difficulty: "41" }, { Keyword: "ai hackathon sf", Volume: "1.3k/mo", Difficulty: "22" }, { Keyword: "agent hackathon", Volume: "880/mo", Difficulty: "18" }, { Keyword: "multiplayer ai", Volume: "590/mo", Difficulty: "15" }],
    web: [{ Result: "AI agents in 2026: what changed", Source: "tech blog", Date: "this month" }, { Result: "Multi-agent simulations explained", Source: "research site", Date: "last month" }, { Result: "How teams ship agent demos fast", Source: "newsletter", Date: "this week" }],
    ecommerce: [{ Product: "LED lantern 1000lm", Price: "$24.99", Rating: "4.6★" }, { Product: "Solar lantern 2-pack", Price: "$31.50", Rating: "4.4★" }, { Product: "Rechargeable lantern", Price: "$19.95", Rating: "4.5★" }],
    places: [{ Place: "Blue Door Coffee", Rating: "4.6★", Walk: "2 min" }, { Place: "Steam & Bean", Rating: "4.4★", Walk: "4 min" }, { Place: "Daily Grind", Rating: "4.5★", Walk: "6 min" }],
    social: [{ Post: "Best AI hackathon tips?", Platform: "Reddit", Engagement: "312 upvotes" }, { Post: "Agents playing board games", Platform: "YouTube", Engagement: "48k views" }],
    finance: [{ Ticker: "ACME", Price: "$142.10", Change: "+1.8%" }, { Ticker: "GLOB", Price: "$88.40", Change: "-0.6%" }]
  };
  const RELATED = { company: ["builtwith", "crustdata"], people: ["hunter-email", "linkedin"], seo: ["dataforseo", "ahrefs-kw"], ecommerce: ["keepa"], places: ["exa"], web: ["reddit"], social: ["youtube"], finance: ["exa"] };
  function offlinePlan(goal) {
    const first = G.pick(goal), calls = [{ id: first.id, why: `Best match for "${goal}".`, qty: first.unit === "profile" || first.unit === "result" ? 3 : 1 }];
    const rel = (RELATED[first.kind] || []).map(id => G.catalog.find(c => c.id === id)).filter(Boolean);
    if (rel.length && Math.random() < 0.8) calls.push({ id: rel[0].id, why: "Adds detail to the first results.", qty: 1 });
    return { plan: calls, rows: ROWS[first.kind] || ROWS.web, summary: `Found ${(ROWS[first.kind] || ROWS.web).length} results using ${calls.length} call${calls.length > 1 ? "s" : ""}.` };
  }

  /* ---------- demo (looping canvas video) ---------- */
  function demoCards(ctx, W, hi, p) {
    const C = G.catalog.slice(0, 8);
    C.forEach((c, i) => {
      const x = 300 + (i % 4) * 82, y = 70 + Math.floor(i / 4) * 92, on = c.id === hi;
      ctx.fillStyle = on ? "rgba(124,200,255,.25)" : "rgba(16,23,47,.9)"; rr(ctx, x, y - (on ? 4 * p : 0), 76, 80, 10); ctx.fill();
      ctx.strokeStyle = on ? "#7cc8ff" : "rgba(124,200,255,.25)"; ctx.lineWidth = on ? 2 : 1; ctx.stroke();
      ctx.font = "20px sans-serif"; ctx.fillText(c.icon, x + 8, y + 26);
      ctx.fillStyle = "#fff"; ctx.font = "700 11px 'Space Grotesk', sans-serif"; ctx.fillText(c.provider.slice(0, 12), x + 8, y + 46);
      ctx.fillStyle = "#7cc8ff"; ctx.font = "10px 'JetBrains Mono', monospace"; ctx.fillText(G.price(c.price), x + 8, y + 66);
    });
  }
  LABS.push({
    id: "glasser", tool: "Real-world data APIs", playLink: "grow",
    title: "Give your agent real-world data, pay per call",
    pitch: "Give an agent a goal. It browses 2,000+ data endpoints, picks the right provider, shows you the price before each call, and brings back rows. One key, one balance, no subscriptions.",
    how: [
      "<b>Give the agent a goal</b>, or pick an example: find companies, price-check products, research before an interview.",
      "The agent <b>plans which endpoints to call</b> from the catalogue (Apollo, People Data Labs, Semrush, Serper, Google Maps…).",
      "<b>Price before every call:</b> approve it, or let small calls auto-approve. Every call lands in the ledger.",
      "Results come back as a table. The ledger compares what you paid with the <b>subscriptions you didn't need</b>.",
      "Connect a real agent with the <b>Skill prompt</b>, MCP or CLI from glasser.ai. Everything here is simulated sample data."
    ],
    demoChars: ["priya"], demoScenes: { bg: { base: "office", time: "night" } },
    demo: [
      { cap: "Give your agent a goal", dur: 3.2, draw(ctx, p, A, W, H) { drawCover(ctx, A.s.bg, W, H); ctx.fillStyle = "rgba(5,8,20,.45)"; ctx.fillRect(0, 0, W, H); drawPup(ctx, A.p.priya, 150, 340, 220); const t = "Find 5 AI startups in SF hiring engineers"; textBox(ctx, t.slice(0, Math.ceil(t.length * Math.min(1, p * 1.6))), 260, 110, 330, {}); } },
      { cap: "It picks the right data endpoint", dur: 3.4, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H); drawPup(ctx, A.p.priya, 150, 340, 220); demoCards(ctx, W, p > 0.4 ? "apollo-company" : "", ease(clamp(p * 2 - 0.8, 0, 1))); } },
      { cap: "You see the price before the call", dur: 3.4, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H); demoCards(ctx, W, "apollo-company", 1); ctx.fillStyle = "rgba(5,8,20,.7)"; ctx.fillRect(0, 0, W, H); textBox(ctx, "🏢 Apollo · Company search — price before call: $0.020", W / 2, 140, 440, { center: true, bg: "rgba(124,200,255,.96)", color: "#04121f" }); textBox(ctx, p > 0.55 ? "✓ Approved" : "Approve?", W / 2, 210, 160, { center: true, bg: p > 0.55 ? "rgba(182,255,92,.95)" : "rgba(244,246,255,.95)" }); } },
      { cap: "Rows come back. Pay only for what you used", dur: 3.8, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H); ["Northwind AI · 84 staff · 6 eng roles", "Lumen Labs · 41 staff · 3 eng roles", "Parcel Robotics · 120 staff · 9 eng roles"].forEach((r, i) => { if (p * 4 > i) { ctx.fillStyle = "rgba(16,23,47,.95)"; rr(ctx, 40, 60 + i * 52, 360, 42, 8); ctx.fill(); ctx.fillStyle = "#e6ecff"; ctx.font = "14px 'Space Grotesk', sans-serif"; ctx.fillText(r, 56, 86 + i * 52); } }); textBox(ctx, "Spent: $0.020", 430, 70, 180, { bg: "rgba(124,200,255,.95)", color: "#04121f" }); textBox(ctx, "Instead of $65/seat/mo", 430, 120, 180, {}); } }
    ],
    build: buildGlasser
  });

  function buildGlasser(main, coord) {
    coord = coord || { pulse() {} };
    const S = { kind: "all", token: 0, calls: [], running: false, con: "skill" };
    main.innerHTML = `
      <div class="gl-top">
        <div class="gl-agent" id="glAgent"><div class="gl-pup" id="glPup"></div><div class="gl-bub" id="glBub">Give me a goal and I'll find the data. You'll see the price before every call.</div></div>
        <div class="gl-goal">
          <label class="small muted" for="glGoal">Agent goal</label>
          <div class="lab-bar"><input id="glGoal" maxlength="160" value="${esc(GOALS[0])}"><button class="btn btn-sm" id="glRun">▶ Run agent</button></div>
          <div class="ex-chips" id="glEx">${GOALS.map(g => `<button>${esc(g)}</button>`).join("")}</div>
          <label class="gl-auto"><input type="checkbox" id="glAuto" checked> Auto-approve calls under $0.05 (bigger calls ask you first)</label>
        </div>
      </div>
      <div class="gl-confirm" id="glConfirm" hidden></div>
      <div class="lab-panel gl-catp"><div class="lp-h">DATA CATALOGUE <span class="muted">· example per-call prices · 2,000+ endpoints on glasser.ai</span></div>
        <div class="chip-row gl-kinds" id="glKinds">${KINDS.map(([k, l]) => `<button data-k="${k}" class="${k === "all" ? "on" : ""}">${l}</button>`).join("")}</div>
        <div class="gl-cat" id="glCat"></div></div>
      <div class="gl-out">
        <div class="lab-panel"><div class="lp-h">RESULTS <i class="gl-sim">${esc(G.note)}</i></div><div id="glRes"><p class="muted small">Run the agent to see rows here.</p></div></div>
        <div class="lab-panel"><div class="lp-h">LEDGER · PAY PER CALL</div><div id="glLedger"><p class="muted small">No calls yet.</p></div></div>
      </div>
      <div class="lab-panel gl-connect"><div class="lp-h">CONNECT A REAL AGENT</div>
        <div class="chip-row" id="glConTabs"><button data-c="skill" class="on">🧩 Skill</button><button data-c="mcp">🔌 MCP</button><button data-c="cli">⌨️ CLI</button></div>
        <div id="glCon"></div></div>`;
    Scenes.mount($("#glAgent", main), { base: "office", time: "night" });
    const pup = $("#glPup", main);
    Puppet.mount(pup, charById("priya"));
    const say = t => { $("#glBub", main).textContent = t; Puppet.talk(pup, Math.min(4000, 300 + t.length * 40)); };

    function drawCat(hi, ok) {
      const list = G.catalog.filter(c => S.kind === "all" || c.kind === S.kind);
      $("#glCat", main).innerHTML = list.map(c => `<div class="gl-c ${c.id === hi ? "hot" : ""} ${(ok || []).includes(c.id) ? "ok" : ""}" data-id="${c.id}">
        <span class="gl-ic">${c.icon}</span><b>${esc(c.provider)}</b><small>${esc(c.endpoint)}</small>
        <em>${G.price(c.price)} / ${esc(c.unit)}</em>${subMonthly(c.sub) ? `<s>instead of ${esc(c.sub)}</s>` : ""}</div>`).join("");
    }
    function drawLedger() {
      const el = $("#glLedger", main);
      if (!S.calls.length) { el.innerHTML = `<p class="muted small">No calls yet.</p>`; return; }
      const total = S.calls.reduce((a, c) => a + c.cost, 0);
      const subs = [...new Map(S.calls.filter(c => !c.skipped).map(c => [c.ep.provider, c.ep.sub])).entries()].filter(([, s]) => subMonthly(s));
      const subTotal = subs.reduce((a, [, s]) => a + subMonthly(s), 0);
      el.innerHTML = `<table class="gl-tab"><thead><tr><th>#</th><th>Call</th><th>Qty</th><th>Cost</th></tr></thead><tbody>
        ${S.calls.map((c, i) => `<tr class="${c.skipped ? "skip" : ""}"><td>${i + 1}</td><td>${c.ep.icon} ${esc(c.ep.provider)} · ${esc(c.ep.endpoint)}</td><td>${c.qty}</td><td>${c.skipped ? "skipped" : G.price(c.cost)}</td></tr>`).join("")}</tbody></table>
        <div class="gl-tot"><span>Total spent</span><b>${money(total)}</b></div>
        ${subs.length ? `<div class="gl-save">Subscriptions you didn't buy: ${subs.map(([p, s]) => `${esc(p)} ${esc(s)}`).join(" · ")} <b>≈ $${subTotal.toFixed(0)}/mo</b></div>` : ""}`;
    }
    function drawRows(rows) {
      const R = (Array.isArray(rows) ? rows : []).filter(r => r && typeof r === "object").slice(0, 6);
      if (!R.length) { $("#glRes", main).innerHTML = `<p class="muted small">No rows came back.</p>`; return; }
      const keys = Object.keys(R[0]).slice(0, 4);
      $("#glRes", main).innerHTML = `<table class="gl-tab"><thead><tr>${keys.map(k => `<th>${esc(String(k).slice(0, 18))}</th>`).join("")}</tr></thead><tbody>${R.map(r => `<tr>${keys.map(k => `<td>${esc(String(r[k] == null ? "" : r[k]).slice(0, 40))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    }
    function drawCon() {
      $$("#glConTabs button", main).forEach(b => b.classList.toggle("on", b.dataset.c === S.con));
      const body = {
        skill: `<p class="small">Send your agent (Claude, ChatGPT, Cursor…) this one prompt. It reads Glasser's skill file and guides you through setup. New accounts start with <b>$1 free credit</b>.</p>
          <div class="gl-code"><code>${esc(G.skill)}</code><button class="btn ghost btn-sm" data-copy>📋 Copy</button></div>`,
        mcp: `<p class="small">Prefer tools over prompts? Add Glasser as an <b>MCP server</b> in your agent so it can list endpoints, see prices and make calls as tools. The server details and your key are on glasser.ai.</p>`,
        cli: `<p class="small">Scripting a pipeline or a game server? Use Glasser from the <b>command line</b> and pipe the results into your app. Install steps are on glasser.ai.</p>`
      }[S.con];
      $("#glCon", main).innerHTML = body + `<a class="btn btn-sm" href="https://glasser.ai" target="_blank" rel="noopener" style="margin-top:8px">Open glasser.ai ↗</a>`;
    }
    drawCat(); drawCon();

    function confirmCall(ep, qty, cost, why, token) {
      const box = $("#glConfirm", main);
      const auto = $("#glAuto", main).checked && cost < 0.05;
      box.hidden = false;
      box.innerHTML = `<span class="gl-ic">${ep.icon}</span><div class="gl-cf-t"><b>${esc(ep.provider)} · ${esc(ep.endpoint)}</b><small>${esc(why)}</small></div>
        <div class="gl-price"><small>price before call</small><b>${G.price(cost)}</b><i>${qty} × ${G.price(ep.price)} / ${esc(ep.unit)}</i></div>
        ${auto ? `<span class="gl-auto-ok">✓ auto-approved</span>` : `<div class="gl-btns"><button class="btn btn-sm" data-ok>Approve</button><button class="btn ghost btn-sm" data-skip>Skip</button></div>`}`;
      if (auto) return wait(1100).then(() => token === S.token);
      return new Promise(res => {
        box.onclick = e => { if (e.target.closest("[data-ok]")) res(true); else if (e.target.closest("[data-skip]")) res(false); };
      });
    }

    async function run() {
      if (S.running) return;
      const goal = $("#glGoal", main).value.trim() || GOALS[0];
      const token = ++S.token;
      S.running = true; S.calls = []; drawLedger(); $("#glRun", main).disabled = true;
      $("#glRes", main).innerHTML = `<p class="muted small">Waiting for data…</p>`;
      say("Planning which endpoints to call…");
      Puppet.emotion(pup, "thinking");
      coord.pulse("team", "goal: " + goal.slice(0, 22), "in");
      const ids = G.catalog.map(c => `${c.id} = ${c.provider} ${c.endpoint} (${c.kind}, ${G.price(c.price)}/${c.unit})`).join("\n");
      const out = await Brain.ask(`You are a data agent using Glasser, a pay-as-you-go gateway to 2,000+ data APIs. Plan the cheapest set of calls (1-3) that answers the user's goal, choosing ONLY from this catalogue:
${ids}
Then produce the result rows those calls would return. They are SIMULATED sample data for a demo: plausible, generic, never claimed to be real.
Reply with JSON only: {"plan":[{"id":"catalogue id","why":"max 12 words","qty":1}],"rows":[{"Column":"value"}],"summary":"one sentence, max 22 words"}
Rows: 3-6 objects, 2-4 short columns, values max 30 characters.`, `Goal: ${goal}`, 0.6, () => offlinePlan(goal));
      if (token !== S.token) return;
      let plan = (Array.isArray(out.plan) ? out.plan : []).map(p => ({ ep: G.catalog.find(c => c.id === p.id), why: Brain.clip(p.why, 90), qty: Math.max(1, Math.min(10, Math.round(+p.qty) || 1)) })).filter(p => p.ep).slice(0, 3);
      if (!plan.length) plan = offlinePlan(goal).plan.map(p => ({ ep: G.catalog.find(c => c.id === p.id), why: p.why, qty: p.qty }));
      Puppet.emotion(pup, "determined");
      say(`I'll make ${plan.length} call${plan.length > 1 ? "s" : ""}: ${plan.map(p => p.ep.provider).join(" + ")}.`);
      const done = [];
      for (const p of plan) {
        if (token !== S.token) return;
        S.kind = "all"; $$("#glKinds button", main).forEach(b => b.classList.toggle("on", b.dataset.k === "all"));
        drawCat(p.ep.id, done);
        const cost = p.ep.price * p.qty;
        const ok = await confirmCall(p.ep, p.qty, cost, p.why, token);
        if (token !== S.token) return;
        S.calls.push({ ep: p.ep, qty: p.qty, cost: ok ? cost : 0, skipped: !ok });
        if (ok) { done.push(p.ep.id); Puppet.gesture(pup, "nod", 900); coord.pulse("bruin", `${p.ep.provider} · ${G.price(cost)}`, "out"); }
        drawLedger(); drawCat(null, done);
        await wait(500);
      }
      $("#glConfirm", main).hidden = true;
      if (done.length) {
        drawRows(out.rows && out.rows.length ? out.rows : offlinePlan(goal).rows);
        say(Brain.clip(out.summary, 160) || `Done: rows are in, for ${money(S.calls.reduce((a, c) => a + c.cost, 0))}.`);
        Puppet.emotion(pup, "happy"); Puppet.gesture(pup, "wave", 1600);
        coord.pulse("team", "rows → agent team", "out");
      } else { drawRows([]); say("You skipped every call, so I didn't spend anything."); Puppet.emotion(pup, "calm"); }
      S.running = false; $("#glRun", main).disabled = false;
    }

    $("#glRun", main).onclick = run;
    $("#glGoal", main).onkeydown = e => { if (e.key === "Enter") run(); };
    $("#glEx", main).onclick = e => { const b = e.target.closest("button"); if (b) $("#glGoal", main).value = b.textContent; };
    $("#glKinds", main).onclick = e => { const b = e.target.closest("[data-k]"); if (!b) return; S.kind = b.dataset.k; $$("#glKinds button", main).forEach(x => x.classList.toggle("on", x === b)); drawCat(); };
    $("#glConTabs", main).onclick = e => { const b = e.target.closest("[data-c]"); if (b) { S.con = b.dataset.c; drawCon(); } };
    $("#glCon", main).onclick = e => {
      const b = e.target.closest("[data-copy]"); if (!b) return;
      (navigator.clipboard ? navigator.clipboard.writeText(G.skill) : Promise.reject()).then(() => (b.textContent = "✓ Copied"), () => (b.textContent = "Select & copy"));
      setTimeout(() => (b.textContent = "📋 Copy"), 1800);
    };
    return { destroy() { S.token++; } };
  }
})();

/* Sponsor Labs, part 4: October (coding agents working as a team on one canvas).
   Registers into window.__LABS__.LABS created by labs.js.
   Drag coding-agent and app blocks onto a canvas, connect them, and run: work is handed along the
   wires (build → review → approve → preview). Everything here is SIMULATED: no request goes to October.
   Block catalogue lives in PLAY.october (play-data.js). */
(function () {
  const L = window.__LABS__;
  if (!L) return;
  const { LABS, $, $$, esc, rand, clamp, wait, ease, rr, textBox, drawCover, drawPup } = L;
  const P = window.PLAY, O = P && P.october;
  if (!O) return;
  const ALL = O.agents.concat(O.apps);
  const def = type => ALL.find(b => b.id === type);
  const isAgent = type => O.agents.some(a => a.id === type);
  const TASKS = ["Build a premiere page for our agent film", "Add level 2 to the zombie game", "Build a sign-up app with a phone preview", "Make a trailer page with a video", "Write the README and docs site for our project"];
  const C = "#3ddc97";

  /* ---------- October proposes a team for a task (offline rules) ---------- */
  function propose(task) {
    const t = task.toLowerCase();
    const blocks = [["claude", 0, 0], ["codex", 1, 0], ["website", 2, 0], ["browser", 2, 1]];
    const wires = [["claude", "website"], ["claude", "codex"], ["codex", "website"], ["website", "browser"]];
    if (/style|design|ui|page|site|poster|landing/.test(t)) { blocks.push(["cursor", 0, 1]); wires.push(["cursor", "website"]); }
    if (/game|level|bug|fix/.test(t)) { blocks.push(["opencode", 0, 2]); wires.push(["opencode", "website"]); }
    if (/doc|readme|research|spec/.test(t)) { blocks.push(["gemini", 0, 2]); wires.push(["gemini", "claude"]); }
    if (/app|mobile|phone|sign.?up/.test(t)) { blocks.push(["mobile", 1, 2]); wires.push(["website", "mobile"]); }
    if (/video|trailer|film|movie/.test(t)) { blocks.push(["video", 0, 3]); wires.push(["video", "website"]); }
    if (/game|memory|context|rules/.test(t)) { blocks.push(["memory", 1, 1]); wires.push(["memory", "claude"]); }
    return { blocks, wires };
  }
  function siteOffline(task) {
    const rest = task.replace(/^(build|make|add|write|create)\s+(a|an|the)?\s*/i, "").trim();
    const title = rest ? (rest[0].toUpperCase() + rest.slice(1)).slice(0, 34) : "Our Project";
    return { title, tagline: `Built by a team of coding agents in one afternoon.`, sections: ["How it works", "Meet the agents", "Try it live"], cta: "Get started" };
  }
  const verb = (a, b) => {
    if (a === "memory") return "shares context with";
    if (a === "video") return "drops the trailer into";
    if (b === "codex") return "hands off for review to";
    if (a === "codex") return isAgent(b) ? "sends review notes to" : "approves and merges into";
    if (a === "gemini" && isAgent(b)) return "writes the spec for";
    if (isAgent(a) && b === "website") return "builds";
    if (isAgent(a)) return "works on";
    if (b === "browser") return "opens in";
    if (b === "mobile") return "previews on";
    return "passes to";
  };

  /* ---------- demo (looping canvas video) ---------- */
  const DB = [["Claude Code", 120, 110, "#ff9f43"], ["Cursor", 120, 230, "#9aa6c8"], ["Codex", 320, 170, "#eaf0ff"], ["Website", 510, 120, "#c48bff"], ["Browser", 510, 240, "#7cc8ff"]];
  const DW = [[0, 3], [1, 3], [0, 2], [2, 3], [3, 4]];
  function demoBoard(ctx, W, H, upto, wireP, hot) {
    ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(120,140,255,.18)"; for (let x = 10; x < W; x += 20) for (let y = 10; y < H; y += 20) ctx.fillRect(x, y, 1.5, 1.5);
    DW.forEach(([a, b], i) => {
      if (wireP <= i / DW.length) return;
      const A = DB[a], Bb = DB[b], k = clamp((wireP - i / DW.length) * DW.length, 0, 1);
      ctx.strokeStyle = hot === i ? C : "rgba(61,220,151,.5)"; ctx.lineWidth = hot === i ? 4 : 2;
      ctx.beginPath(); ctx.moveTo(A[1] + 55, A[2]); ctx.lineTo(A[1] + 55 + (Bb[1] - 55 - A[1] - 55) * k, A[2] + (Bb[2] - A[2]) * k); ctx.stroke();
    });
    DB.slice(0, upto).forEach(([n, x, y, col]) => {
      ctx.fillStyle = "#10172f"; rr(ctx, x - 55, y - 20, 110, 40, 9); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "700 14px 'Space Grotesk', sans-serif"; ctx.textAlign = "center"; ctx.fillText(n, x, y + 5); ctx.textAlign = "left";
    });
  }
  LABS.push({
    id: "october", tool: "Coding agents on one canvas", playLink: "game",
    title: "Drag coding agents onto a canvas and ship as a team",
    pitch: "Drop Claude Code, Codex, Cursor and other coding agents onto one canvas next to a browser, a website preview or a phone screen. Connect them, start the run, and watch the work move along the wires: build, review, approve, preview.",
    how: [
      "<b>Drag blocks</b> from the left onto the canvas (or tap a block to add it). Coding agents on top, apps and tools below.",
      "<b>Connect</b>: drag from a block's ● to another block. A wire means \"hand work to\". Click a wire to remove it.",
      "Or type a task and press <b>✨ Propose a team</b>: October-style, it picks agents and wires them for you.",
      "<b>▶ Start the run</b>: each hand-off travels along a wire. Codex reviews, then approves; the website, browser and phone blocks show the result.",
      "This lab is a simulation of how October works. Download October to run your real coding agents together on one canvas."
    ],
    demoChars: ["kit"], demoScenes: {},
    demo: [
      { cap: "Drag coding agents onto the canvas", dur: 3.4, draw(ctx, p, A, W, H) { const n = Math.min(DB.length, Math.floor(p * 6)); demoBoard(ctx, W, H, n, 0, -1); if (n < DB.length) { const [, x, y] = DB[n]; ctx.font = "26px sans-serif"; ctx.fillText("👆", 20 + (x - 20) * ((p * 6) % 1), y + 10); } } },
      { cap: "Connect them: who hands work to whom", dur: 3, draw(ctx, p, A, W, H) { demoBoard(ctx, W, H, DB.length, ease(p), -1); } },
      { cap: "Agents build, review and approve along the wires", dur: 4, draw(ctx, p, A, W, H) { const i = Math.min(DW.length - 1, Math.floor(p * DW.length)); demoBoard(ctx, W, H, DB.length, 1, i); const [a, b] = DW[i], k = (p * DW.length) % 1, A2 = DB[a], B2 = DB[b]; ctx.fillStyle = C; ctx.beginPath(); ctx.arc(A2[1] + 55 + (B2[1] - 110 - A2[1]) * k, A2[2] + (B2[2] - A2[2]) * k, 7, 0, 7); ctx.fill(); textBox(ctx, i === 3 ? "Codex: approved ✓" : i === 2 ? "Codex: reviewing…" : `${DB[a][0]} → ${DB[b][0]}`, W / 2, 20, 300, { center: true, bg: "rgba(61,220,151,.95)", color: "#06231a" }); } },
      { cap: "One card back: the site is live", dur: 3.6, draw(ctx, p, A, W, H) { demoBoard(ctx, W, H, DB.length, 1, -1); ctx.fillStyle = "rgba(5,8,20,.6)"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#f4f6ff"; rr(ctx, 170, 60, 300, 200, 12); ctx.fill(); ctx.fillStyle = "#c9d0ee"; rr(ctx, 170, 60, 300, 22, 12); ctx.fill(); ctx.fillStyle = "#1b1530"; ctx.font = "800 26px 'Space Grotesk', sans-serif"; ctx.fillText("ONE SEAT LEFT", 192, 130); ctx.font = "14px 'Space Grotesk', sans-serif"; ctx.fillStyle = "#5a6385"; ctx.fillText("An agent film · premiere tonight", 192, 156); ctx.fillStyle = C; rr(ctx, 192, 178, 110, 30, 8); ctx.fill(); ctx.fillStyle = "#06231a"; ctx.font = "700 13px 'Space Grotesk', sans-serif"; ctx.fillText("▶ Watch trailer", 204, 198); textBox(ctx, "✓ shipped · 5 hand-offs · 1 review", W / 2, 286, 320, { center: true, bg: "rgba(61,220,151,.95)", color: "#06231a" }); } }
    ],
    build: buildOctober
  });

  function buildOctober(main, coord) {
    coord = coord || { pulse() {} };
    const S = { blocks: [], wires: [], n: 0, token: 0, running: false };
    main.innerHTML = `
      <div class="ocl">
        <div class="ocl-top">
          <label class="small muted" for="ocTask">Task for the team</label>
          <div class="lab-bar"><input id="ocTask" maxlength="140" value="${esc(TASKS[0])}"><button class="btn ghost btn-sm" id="ocPlan">✨ Propose a team</button><button class="btn btn-sm" id="ocRun">▶ Start the run</button></div>
          <div class="ex-chips" id="ocEx">${TASKS.map(t => `<button>${esc(t)}</button>`).join("")}</div>
        </div>
        <div class="ocl-body">
          <aside class="ocl-pal" id="ocPal">
            <small>CODING AGENTS</small>${O.agents.map(b => `<button draggable="true" data-type="${b.id}" style="--k:${b.color}" title="${esc(b.role)}">${b.icon} ${esc(b.name)}</button>`).join("")}
            <small>APPS &amp; TOOLS</small>${O.apps.map(b => `<button draggable="true" data-type="${b.id}" style="--k:${b.color}" title="${esc(b.role)}">${b.icon} ${esc(b.name)}</button>`).join("")}
            <button class="ocl-clear" id="ocClear">🧹 Clear canvas</button>
          </aside>
          <div class="ocl-cv" id="ocCv"><svg class="ocl-w" id="ocW"></svg><div class="ocl-empty" id="ocEmpty">Drag blocks here, or press <b>✨ Propose a team</b></div></div>
        </div>
        <div class="ocl-out">
          <div class="lab-panel"><div class="lp-h">RUN · HAND-OFFS &amp; REVIEWS <i class="gl-sim">${esc(O.note)}</i></div><ol class="ocl-log" id="ocLog"><li class="muted small">Start a run to see the hand-offs.</li></ol></div>
          <div class="lab-panel"><div class="lp-h">RESULT · ONE CARD BACK</div><div id="ocRes"><p class="muted small">When the run finishes, the result comes back here.</p></div></div>
        </div>
        <div class="lab-panel ocl-real"><div class="lp-h">USE IT FOR REAL</div>
          <p class="small">October runs your own agents (Claude Code, Codex, Cursor, Gemini, OpenCode…) on one shared canvas, on your computer or connected cloud machines. The local workspace is free; there is also an October MCP server and machine-readable docs at <code>/llms.txt</code>.</p>
          <a class="btn btn-sm" href="https://www.october.dev" target="_blank" rel="noopener">Open october.dev ↗</a></div>
      </div>`;
    const cv = $("#ocCv", main), wsvg = $("#ocW", main), log = $("#ocLog", main);

    /* ---------- canvas model ---------- */
    const bEl = uid => cv.querySelector(`.ocl-b[data-uid="${uid}"]`);
    function add(type, x, y) {
      const d = def(type); if (!d) return null;
      const r = cv.getBoundingClientRect();
      const b = { uid: "b" + ++S.n, type, x: clamp(x, 70, r.width - 70), y: clamp(y, 30, r.height - 30) };
      S.blocks.push(b); draw(); coord.pulse("team", `+ ${d.name} on canvas`, "in");
      return b;
    }
    function remove(uid) { S.blocks = S.blocks.filter(b => b.uid !== uid); S.wires = S.wires.filter(w => w.a !== uid && w.b !== uid); draw(); }
    function connect(a, b) { if (a === b || S.wires.some(w => (w.a === a && w.b === b))) return; S.wires.push({ a, b }); drawWires(); }
    function draw() {
      $$(".ocl-b", cv).forEach(e => e.remove());
      $("#ocEmpty", main).hidden = S.blocks.length > 0;
      S.blocks.forEach(b => {
        const d = def(b.type), e = document.createElement("div");
        e.className = "ocl-b" + (isAgent(b.type) ? " agent" : " app"); e.dataset.uid = b.uid; e.style.setProperty("--k", d.color);
        e.style.left = b.x + "px"; e.style.top = b.y + "px";
        e.innerHTML = `<div class="ocl-bh"><b>${d.icon} ${esc(d.name)}</b><button class="ocl-x" aria-label="Remove ${esc(d.name)}">×</button></div><small>${esc(d.role)}</small><div class="ocl-body2"></div><span class="ocl-port" title="Drag to another block to connect"></span>`;
        cv.appendChild(e);
      });
      drawWires();
    }
    const anchor = (uid, side) => { const e = bEl(uid); if (!e) return { x: 0, y: 0 }; return { x: e.offsetLeft + (side === "out" ? e.offsetWidth : 0), y: e.offsetTop + Math.min(22, e.offsetHeight / 2) }; };
    const pathD = (p, q) => { const mx = (p.x + q.x) / 2; return `M${p.x} ${p.y} C${mx} ${p.y} ${mx} ${q.y} ${q.x} ${q.y}`; };
    function drawWires(temp) {
      wsvg.setAttribute("viewBox", `0 0 ${cv.clientWidth} ${cv.clientHeight}`);
      wsvg.innerHTML = S.wires.map((w, i) => `<path class="ocl-wire" data-i="${i}" d="${pathD(anchor(w.a, "out"), anchor(w.b, "in"))}"/>`).join("") + (temp ? `<path class="ocl-wire temp" d="${pathD(temp.p, temp.q)}"/>` : "");
    }

    /* palette: drag & drop, or tap to add */
    const pal = $("#ocPal", main);
    pal.addEventListener("dragstart", e => { const b = e.target.closest("[data-type]"); if (b) { e.dataTransfer.setData("text/plain", b.dataset.type); e.dataTransfer.effectAllowed = "copy"; } });
    cv.addEventListener("dragover", e => { e.preventDefault(); cv.classList.add("drop"); });
    cv.addEventListener("dragleave", () => cv.classList.remove("drop"));
    cv.addEventListener("drop", e => { e.preventDefault(); cv.classList.remove("drop"); const t = e.dataTransfer.getData("text/plain"); const r = cv.getBoundingClientRect(); if (def(t)) add(t, e.clientX - r.left - 60, e.clientY - r.top - 20); });
    pal.addEventListener("click", e => {
      if (e.target.closest("#ocClear")) { S.token++; S.running = false; S.blocks = []; S.wires = []; draw(); log.innerHTML = `<li class="muted small">Canvas cleared.</li>`; $("#ocRes", main).innerHTML = `<p class="muted small">When the run finishes, the result comes back here.</p>`; $("#ocRun", main).disabled = false; return; }
      const b = e.target.closest("[data-type]"); if (!b) return;
      const n = S.blocks.length, agent = isAgent(b.dataset.type);
      add(b.dataset.type, agent ? 20 + (n % 2) * 30 : cv.clientWidth - 190, 30 + ((n * 64) % Math.max(64, cv.clientHeight - 80)));
    });

    /* move blocks, connect ports, remove */
    let drag = null;
    cv.addEventListener("pointerdown", e => {
      if (S.running) return;
      const x = e.target.closest(".ocl-x"); if (x) { remove(x.closest(".ocl-b").dataset.uid); return; }
      const r = cv.getBoundingClientRect();
      const port = e.target.closest(".ocl-port");
      if (port) { drag = { mode: "wire", from: port.closest(".ocl-b").dataset.uid }; cv.setPointerCapture(e.pointerId); e.preventDefault(); return; }
      const blk = e.target.closest(".ocl-b");
      if (blk) { const b = S.blocks.find(q => q.uid === blk.dataset.uid); drag = { mode: "move", b, dx: e.clientX - r.left - b.x, dy: e.clientY - r.top - b.y }; cv.setPointerCapture(e.pointerId); e.preventDefault(); }
    });
    cv.addEventListener("pointermove", e => {
      if (!drag) return;
      const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
      if (drag.mode === "move") { drag.b.x = clamp(mx - drag.dx, 0, r.width - 60); drag.b.y = clamp(my - drag.dy, 0, r.height - 30); const el2 = bEl(drag.b.uid); el2.style.left = drag.b.x + "px"; el2.style.top = drag.b.y + "px"; drawWires(); }
      else drawWires({ p: anchor(drag.from, "out"), q: { x: mx, y: my } });
    });
    cv.addEventListener("pointerup", e => {
      if (!drag) return;
      if (drag.mode === "wire") {
        const hit = document.elementsFromPoint(e.clientX, e.clientY).map(n => n.closest && n.closest(".ocl-b")).find(Boolean);
        if (hit && hit.dataset.uid !== drag.from) { connect(drag.from, hit.dataset.uid); const a = S.blocks.find(b => b.uid === drag.from), b = S.blocks.find(q => q.uid === hit.dataset.uid); coord.pulse("team", `${def(a.type).name} → ${def(b.type).name}`, "out"); }
        else drawWires();
      }
      drag = null;
    });
    wsvg.addEventListener("click", e => { const p = e.target.closest("[data-i]"); if (p && !S.running) { S.wires.splice(+p.dataset.i, 1); drawWires(); } });
    window.addEventListener("resize", () => drawWires());

    /* propose a team */
    function proposeTeam() {
      if (S.running) return;
      const task = $("#ocTask", main).value.trim() || TASKS[0];
      const plan = propose(task), W = cv.clientWidth, Hh = cv.clientHeight;
      S.blocks = []; S.wires = [];
      const byType = {};
      const rows = {};
      plan.blocks.forEach(([type, col, row]) => { rows[col] = Math.max(rows[col] || 0, row + 1); });
      plan.blocks.forEach(([type, col, row]) => {
        /* column 3 (apps): the website preview sits on top and grows when the page renders, so the others stack from the bottom */
        const y = col === 2 && type !== "website" ? Hh - 124 - (rows[col] - 1 - row) * 78 : 24 + row * Math.min(96, (Hh - 70) / Math.max(1, rows[col] - 1));
        const b = { uid: "b" + ++S.n, type, x: [12, Math.max(170, (W - 160) / 2), W - 194][col], y };
        S.blocks.push(b); byType[type] = b.uid;
      });
      plan.wires.forEach(([a, b]) => byType[a] && byType[b] && S.wires.push({ a: byType[a], b: byType[b] }));
      draw();
      log.innerHTML = `<li><b style="color:${C}">✨ Proposed team</b> for “${esc(task)}”: ${plan.blocks.filter(b => isAgent(b[0])).map(b => esc(def(b[0]).name)).join(", ")}, wired to ${plan.blocks.filter(b => !isAgent(b[0])).map(b => esc(def(b[0]).name)).join(", ")}. Review it, change anything, then start the run.</li>`;
      coord.pulse("team", `team of ${plan.blocks.filter(b => isAgent(b[0])).length} agents proposed`, "out");
    }

    /* run: hand work along the wires in order */
    function order() {
      const inc = id => S.wires.filter(w => w.b === id).length;
      const done = new Set(), out = [];
      let frontier = S.blocks.filter(b => !inc(b.uid)).map(b => b.uid);
      if (!frontier.length && S.blocks.length) frontier = [S.blocks[0].uid];
      while (frontier.length) {
        const next = [];
        for (const id of frontier) for (const w of S.wires.filter(w => w.a === id)) if (!done.has(w)) { done.add(w); out.push(w); next.push(w.b); }
        frontier = [...new Set(next)];
      }
      S.wires.forEach(w => !done.has(w) && out.push(w));
      return out;
    }
    async function packet(w) {
      const p = anchor(w.a, "out"), q = anchor(w.b, "in");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path"); path.setAttribute("d", pathD(p, q));
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle"); dot.setAttribute("r", 7); dot.setAttribute("class", "ocl-pk");
      wsvg.appendChild(dot);
      const Lp = (wsvg.appendChild(path), path.getTotalLength()); path.setAttribute("class", "ocl-wire hot");
      const t0 = performance.now();
      await new Promise(res => { (function step(now) { const k = Math.min(1, (now - t0) / 900), pt = path.getPointAtLength(Lp * ease(k)); dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y); if (k < 1) requestAnimationFrame(step); else res(); })(t0); setTimeout(res, 1500); });
      dot.remove(); path.remove();
    }
    const logLi = html => { const li = document.createElement("li"); li.innerHTML = html; log.prepend(li); };
    async function run() {
      if (S.running) return;
      const agents = S.blocks.filter(b => isAgent(b.type));
      if (!agents.length || !S.wires.length) { log.innerHTML = `<li class="warn-s">Add at least one coding agent and connect it to something (drag from its ●), or press ✨ Propose a team.</li>`; return; }
      const task = $("#ocTask", main).value.trim() || TASKS[0], token = ++S.token;
      S.running = true; $("#ocRun", main).disabled = true; log.innerHTML = "";
      $$(".ocl-b .ocl-body2", cv).forEach(e => (e.innerHTML = "")); $$(".ocl-b", cv).forEach(e => e.classList.remove("done", "out"));
      logLi(`<b style="color:${C}">▶ Run started</b> · ${esc(task)}`);
      coord.pulse("team", "run: " + task.slice(0, 22), "in");
      const sitePromise = Brain.ask(`You are a coding-agent team that just built a small web page for a hackathon task. Reply with JSON only: {"title":"max 5 words","tagline":"max 12 words","sections":["3 items, max 4 words each"],"cta":"button text, max 3 words"}`, `Task: ${task}`, 0.7, () => siteOffline(task));
      let hands = 0, reviews = 0;
      for (const w of order()) {
        if (token !== S.token) return;
        const A = S.blocks.find(b => b.uid === w.a), B = S.blocks.find(b => b.uid === w.b); if (!A || !B) continue;
        const ea = bEl(A.uid), eb = bEl(B.uid);
        ea && ea.classList.add("on");
        await packet(w);
        if (token !== S.token) return;
        ea && ea.classList.remove("on"); ea && ea.classList.add("done");
        hands++;
        const da = def(A.type), db = def(B.type);
        logLi(`<span style="color:${da.color}">${da.icon} <b>${esc(da.name)}</b></span> ${verb(A.type, B.type)} <span style="color:${db.color}">${db.icon} <b>${esc(db.name)}</b></span>`);
        if (B.type === "codex" && isAgent(A.type)) {
          reviews++;
          const n = 1 + Math.floor(Math.random() * 3);
          eb && (eb.querySelector(".ocl-body2").innerHTML = `<i>💬 ${n} review comment${n > 1 ? "s" : ""}</i>`);
          await wait(700); if (token !== S.token) return;
          logLi(`<span style="color:${db.color}">⚪ <b>Codex</b></span> reviews: ${n} comment${n > 1 ? "s" : ""} → <b>${esc(da.name)}</b> fixes them`);
          eb && (eb.querySelector(".ocl-body2").innerHTML = `<i>✓ approved</i>`);
        }
        if (B.type === "video") eb && (eb.querySelector(".ocl-body2").innerHTML = `<i>🎞️ trailer 0:30 cut</i>`);
        if (A.type === "memory") eb && (eb.querySelector(".ocl-body2").innerHTML = `<i>🧠 context loaded</i>`);
        coord.pulse(B.type === "video" ? "adal" : "team", `${da.name} → ${db.name}`, "out");
        await wait(350);
      }
      if (token !== S.token) return;
      const site = await sitePromise;
      if (token !== S.token) return;
      const title = Brain.clip(site.title, 40) || "Our Project", tag = Brain.clip(site.tagline, 90) || "", secs = (Array.isArray(site.sections) ? site.sections : []).slice(0, 3).map(x => Brain.clip(x, 28)), cta = Brain.clip(site.cta, 20) || "Get started";
      const page = `<div class="ocl-site"><i></i><b>${esc(title)}</b><small>${esc(tag)}</small><div>${secs.map(x => `<span>${esc(x)}</span>`).join("")}</div><em>${esc(cta)}</em></div>`;
      S.blocks.forEach(b => {
        const e = bEl(b.uid); if (!e) return;
        const body = e.querySelector(".ocl-body2");
        if (b.type === "website") { e.classList.add("out"); body.innerHTML = page; }
        if (b.type === "mobile") { body.innerHTML = `<div class="ocl-phone">${page}</div>`; }
        if (b.type === "browser") body.innerHTML = `<i>✓ 200 OK · 0 console errors · links checked</i>`;
      });
      const used = S.blocks.filter(b => isAgent(b.type)).map(b => def(b.type).name);
      $("#ocRes", main).innerHTML = `<div class="ocl-card"><span class="ocl-ok">✓ SHIPPED</span><b>${esc(title)}</b><small>${esc(tag)}</small>
        <ul><li><b>${hands}</b> hand-offs along ${S.wires.length} wires</li><li><b>${reviews}</b> review${reviews === 1 ? "" : "s"} before merge</li><li>Team: ${used.map(esc).join(", ")}</li></ul>
        <p class="muted small">${site._src === "llm" ? "Page text written by the live AI agent." : "Offline demo: page text generated locally."} The run itself is simulated.</p></div>`;
      logLi(`<b style="color:${C}">✓ Done</b> · ${hands} hand-offs, ${reviews} review${reviews === 1 ? "" : "s"} · result returned as one card`);
      coord.pulse("bruin", `run log: ${hands} hand-offs`, "out");
      S.running = false; $("#ocRun", main).disabled = false;
    }

    $("#ocPlan", main).onclick = proposeTeam;
    $("#ocRun", main).onclick = run;
    $("#ocTask", main).onkeydown = e => { if (e.key === "Enter") proposeTeam(); };
    $("#ocEx", main).onclick = e => { const b = e.target.closest("button"); if (b) { $("#ocTask", main).value = b.textContent; proposeTeam(); } };
    requestAnimationFrame(proposeTeam);
    return { destroy() { S.token++; } };
  }
})();

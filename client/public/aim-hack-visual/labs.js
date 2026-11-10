/* =========================================================
   Sponsor Labs (sponsors.html#labs): a hands-on demo of each sponsor's tool.
     BAND   → agent channels (draw links, agents talk only along them)
     AdaL   → image & video generation (storyboard → frames → canvas video)
     Bruin  → ask questions about agent decision data
     Finch  → equip skills and see output change
     Casuro → mini voice interview with evidence-based scoring
   Every lab = interactive area + "How it works" + a looping demo "video".
   Needs: data.js, play-data.js, puppet.js, scenes.js, brain.js (+ core.css, labs.css)
   ========================================================= */
(function () {
  const H = window.HACK, P = window.PLAY;
  const host = document.getElementById("labHost"), nav = document.getElementById("labNav");
  if (!host || !H || !P || !window.Puppet || !window.Scenes || !window.Brain) return;

  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rand = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const charById = id => P.characters.find(c => c.id === id);
  const first = c => String(c.name).replace(/^(Dr\.|Prof\.|Captain|General|Lady|Old)\s+/, "").split(" ")[0];
  const sp = id => H.sponsors.find(s => s.id === id) || (H.allSponsors || []).find(s => s.id === id);
  const visibleLabs = () => LABS.filter(l => !H.sponsorVisible || H.sponsorVisible(l.id));
  const TRACK_NAMES = { film: "Track 01 · Film", game: "Track 02 · Games", grow: "Track 03 · Grow" };

  function speak(text, i, onend) {
    if (!("speechSynthesis" in window) || !text) { onend && onend(); return; }
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const vs = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
      if (vs.length) u.voice = vs[(i || 0) % vs.length];
      u.rate = 1.03;
      if (onend) { u.onend = onend; u.onerror = onend; }
      speechSynthesis.speak(u);
    } catch { onend && onend(); }
  }
  const hush = () => { try { speechSynthesis.cancel(); } catch {} };

  /* ---------- canvas helpers ---------- */
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function wrapLines(ctx, text, maxW) {
    const words = String(text).split(/\s+/), lines = [];
    let line = "";
    for (const w of words) { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
    return lines;
  }
  function textBox(ctx, text, x, y, maxW, o) {
    o = o || {};
    ctx.font = o.font || "600 15px 'Space Grotesk', sans-serif";
    const lines = wrapLines(ctx, text, maxW - 24), lh = o.lh || 20;
    const w = Math.min(maxW, Math.max(...lines.map(l => ctx.measureText(l).width)) + 24), h = lines.length * lh + 16;
    const bx = o.center ? x - w / 2 : x, by = o.above ? y - h : y;
    ctx.fillStyle = o.bg || "rgba(244,246,255,.96)"; rr(ctx, bx, by, w, h, o.r || 12); ctx.fill();
    if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = 2; ctx.stroke(); }
    if (o.tail) { ctx.beginPath(); ctx.moveTo(x - 7, by + h); ctx.lineTo(x + 7, by + h); ctx.lineTo(x, by + h + 9); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = o.color || "#141a33";
    lines.forEach((l, i) => ctx.fillText(l, bx + 12, by + 8 + (i + 0.78) * lh));
    return { x: bx, y: by, w, h };
  }
  function drawCover(ctx, img, W, H, scale, ox, oy) {
    if (!img) { ctx.fillStyle = "#0b0f1f"; ctx.fillRect(0, 0, W, H); return; }
    const s = Math.max(W / img.width, H / img.height) * (scale || 1);
    const w = img.width * s, h = img.height * s;
    ctx.drawImage(img, (W - w) / 2 + (ox || 0) * W, (H - h) / 2 + (oy || 0) * H, w, h);
  }
  function drawPup(ctx, img, cx, bottom, h, alpha) {
    if (!img) return;
    const w = h * img.width / img.height;
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.drawImage(img, cx - w / 2, bottom - h, w, h); ctx.restore();
  }
  function caption(ctx, W, H, text) {
    const g = ctx.createLinearGradient(0, H - 70, 0, H); g.addColorStop(0, "rgba(5,7,15,0)"); g.addColorStop(1, "rgba(5,7,15,.85)");
    ctx.fillStyle = g; ctx.fillRect(0, H - 70, W, 70);
    ctx.font = "700 17px 'Space Grotesk', sans-serif"; ctx.fillStyle = "#fff"; ctx.textAlign = "center";
    wrapLines(ctx, text, W - 60).slice(0, 2).forEach((l, i, a) => ctx.fillText(l, W / 2, H - 16 - (a.length - 1 - i) * 21));
    ctx.textAlign = "left";
  }

  /* ---------- looping demo "video" on a canvas ----------
     frames: [{ cap, dur (s), draw(ctx, p 0..1, A, W, H) }] */
  function DemoPlayer(root, frames, A) {
    const cv = $("canvas", root), ctx = cv.getContext("2d"), W = cv.width, Hh = cv.height;
    const btn = $(".demo-play", root), bar = $(".demo-bar i", root), cap = $(".demo-cap", root);
    const total = frames.reduce((s, f) => s + f.dur, 0);
    let t = 0, playing = true, last = performance.now(), raf, visible = true, dead = false;
    const io = "IntersectionObserver" in window ? new IntersectionObserver(es => { visible = es[0].isIntersecting; }) : null;
    io && io.observe(cv);
    function frameAt(tt) { let acc = 0; for (const f of frames) { if (tt < acc + f.dur) return [f, (tt - acc) / f.dur]; acc += f.dur; } return [frames[frames.length - 1], 1]; }
    function tick(now) {
      if (dead) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (playing && visible) t = (t + dt) % total;
      const [f, p] = frameAt(t);
      ctx.save(); ctx.clearRect(0, 0, W, Hh);
      try { f.draw(ctx, p, A, W, Hh); } catch (e) { /* keep looping */ }
      ctx.restore();
      caption(ctx, W, Hh, f.cap);
      const fi = frames.indexOf(f);
      ctx.font = "600 11px 'JetBrains Mono', monospace"; ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fillText(`STEP ${fi + 1}/${frames.length}`, 14, 22);
      bar.style.width = (t / total * 100) + "%";
      if (cap.dataset.i !== String(fi)) { cap.dataset.i = fi; cap.textContent = f.cap; }
      raf = requestAnimationFrame(tick);
    }
    btn.onclick = () => { playing = !playing; btn.textContent = playing ? "❚❚" : "▶"; btn.setAttribute("aria-label", playing ? "Pause demo" : "Play demo"); };
    $(".demo-bar", root).onclick = e => { const r = e.currentTarget.getBoundingClientRect(); t = clamp((e.clientX - r.left) / r.width, 0, 0.999) * total; };
    raf = requestAnimationFrame(tick);
    return { destroy() { dead = true; cancelAnimationFrame(raf); io && io.disconnect(); } };
  }

  async function loadAssets(chars, scenes) {
    const A = { p: {}, s: {} };
    await Promise.all([
      ...chars.map(async id => { A.p[id] = await Puppet.toImage(charById(id), 220); }),
      ...Object.entries(scenes).map(async ([k, s]) => { A.s[k] = await Scenes.toImage(s, 640, 360); })
    ]);
    return A;
  }

  /* =========================================================
     LAB REGISTRY
     ========================================================= */
  const LABS = [];
  let current = null;

  function shell(lab) {
    const s = sp(lab.id);
    const uses = Object.entries(P.tools || {}).flatMap(([tr, list]) => list.filter(t => t.id === lab.id).map(t => `<li><b>${TRACK_NAMES[tr]}:</b> ${esc(t.label)}. ${esc(t.does)}</li>`));
    return `<article class="lab" id="lab-${lab.id}" style="--c:${s.color}">
      <header class="lab-head">
        <span class="lab-ico">${s.icon}</span>
        <div><span class="kicker">${esc(s.name)} · ${esc(lab.tool)}</span><h3>${esc(lab.title)}</h3><p>${esc(lab.pitch)}</p></div>
        <a class="btn ghost btn-sm" href="${s.url}" target="_blank" rel="noopener">Visit ${esc(s.name)} ↗</a>
      </header>
      <div class="lab-grid">
        <div class="lab-main" id="labMain"></div>
        <aside class="lab-side">
          <div class="demo" aria-label="Demo video">
            <div class="demo-top"><span class="rec">● DEMO</span><span class="demo-cap" aria-live="polite"></span></div>
            <canvas width="640" height="360"></canvas>
            <div class="demo-ctl"><button class="demo-play" aria-label="Pause demo">❚❚</button><div class="demo-bar"><i></i></div></div>
          </div>
          <div class="lab-coord" id="labCoord"></div>
          <div class="lab-how"><h4>How it works</h4><ol>${lab.how.map(h => `<li>${h}</li>`).join("")}</ol></div>
          ${uses.length ? `<div class="lab-inplay"><h4>In the playground</h4><ul>${uses.join("")}</ul><a href="/aim-hack-visual/play.html#${lab.playLink || "film"}">Open the playground →</a></div>` : ""}
        </aside>
      </div>
    </article>`;
  }

  async function open(id, scroll) {
    const vis = visibleLabs();
    if (!vis.length) {
      host.innerHTML = `<div class="card lab-empty"><span>🙈</span><h3>All sponsor tools are hidden</h3><p class="muted">You switched every sponsor tool off. Turn some back on to play with the labs.</p><button class="btn" data-open-tools>⚙️ Choose sponsor tools</button></div>`;
      return;
    }
    const lab = vis.find(l => l.id === id) || vis[0];
    if (current) { try { current.destroy && current.destroy(); } catch {} try { current.demo && current.demo.destroy(); } catch {} try { current.coord && current.coord.destroy(); } catch {} }
    hush();
    $$("button", nav).forEach(b => b.classList.toggle("on", b.dataset.lab === lab.id));
    host.innerHTML = shell(lab);
    const coord = window.Coord ? Coord.strip($("#labCoord"), lab.id) : { pulse() {}, destroy() {} };
    const inst = lab.build($("#labMain"), coord) || {};
    inst.coord = coord;
    current = inst;
    const A = await loadAssets(lab.demoChars || [], lab.demoScenes || {});
    if (current !== inst) return;
    inst.demo = DemoPlayer($(".demo", host), lab.demo, A);
    if (scroll) host.scrollIntoView({ behavior: "smooth", block: "start" });
    if (history.replaceState) history.replaceState(null, "", "#lab-" + lab.id);
  }

  /* =========================================================
     1 · BAND — Agent channels
     ========================================================= */
  LABS.push({
    id: "band", tool: "Agent channels", playLink: "film",
    title: "Wire agents together and watch them talk",
    pitch: "Add agents, draw a line between two of them to open a channel, give the team a goal, and press Run. Agents can only message the agents they're linked to, and they hand tasks to each other.",
    how: [
      "<b>Add agents</b> from the picker (or 🎲 for a random one). Drag them anywhere. ✕ removes one.",
      "<b>Draw a channel:</b> drag from an agent's 🔗 handle onto another agent (or switch to Connect mode and tap two agents).",
      "<b>Delete a channel:</b> click the line.",
      "<b>Run a simulation:</b> set a goal and press ▶ Run simulation. Agents message each other as glowing packets along your lines only.",
      "<b>Send by hand:</b> pick a sender and a linked receiver, type a message and press Send. Tick <i>AI reply</i> to let the receiver answer.",
      "The feed shows each <b>#channel</b>, and the hand-off list shows who delegated what to whom."
    ],
    demoChars: ["vega", "jax", "priya"], demoScenes: { bg: { base: "office", time: "night" } },
    demo: [
      { cap: "Add agents to the board", dur: 3, draw(ctx, p, A, W, H) { band0(ctx, A, W, H); ["vega", "jax"].forEach((id, i) => drawPup(ctx, A.p[id], [190, 450][i], 300, 150 * ease(clamp(p * 2 - i * 0.5, 0, 1)), clamp(p * 2 - i * 0.5, 0, 1))); } },
      { cap: "Drag from one agent to another to open a channel", dur: 3.2, draw(ctx, p, A, W, H) { band0(ctx, A, W, H); bandLine(ctx, 190, 220, 190 + 260 * ease(p), 220); bandPups(ctx, A); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(190 + 260 * ease(p), 222, 7, 0, 7); ctx.fill(); } },
      { cap: "Press Run: messages travel only along your lines", dur: 4.4, draw(ctx, p, A, W, H) { band0(ctx, A, W, H); bandLine(ctx, 190, 220, 450, 220); bandPups(ctx, A); const back = p > 0.5, q = back ? (p - 0.5) * 2 : p * 2; bandPacket(ctx, back ? 450 - 260 * ease(q) : 190 + 260 * ease(q), 220); textBox(ctx, back ? "On it. Logs in 2 minutes." : "Jax, can you check the reactor logs?", back ? 450 : 190, 130, 230, { center: true, above: true, tail: true }); } },
      { cap: "Every hand-off is logged: who delegated what to whom", dur: 3.6, draw(ctx, p, A, W, H) { band0(ctx, A, W, H); bandLine(ctx, 190, 220, 450, 220); bandPups(ctx, A, 0.55); const x = W - 300 * ease(Math.min(1, p * 2)); ctx.fillStyle = "rgba(10,14,30,.92)"; rr(ctx, x, 40, 280, 220, 14); ctx.fill(); ctx.strokeStyle = "#5c8dff"; ctx.lineWidth = 2; ctx.stroke(); ctx.font = "600 12px 'JetBrains Mono', monospace"; ctx.fillStyle = "#5c8dff"; ctx.fillText("#vega-jax", x + 16, 66); [["Vega → Jax", "📋 check the reactor logs"], ["Jax → Vega", "📋 approve the hotfix"]].forEach((r, i) => { ctx.fillStyle = "#fff"; ctx.font = "700 14px 'Space Grotesk', sans-serif"; ctx.fillText(r[0], x + 16, 100 + i * 64); ctx.fillStyle = "#c9d0ee"; ctx.font = "13px 'Space Grotesk', sans-serif"; ctx.fillText(r[1], x + 16, 122 + i * 64); }); } }
    ],
    build: buildBand
  });
  function band0(ctx, A, W, H) { drawCover(ctx, A.s.bg, W, H); ctx.fillStyle = "rgba(5,8,20,.45)"; ctx.fillRect(0, 0, W, H); }
  function bandPups(ctx, A, a) { drawPup(ctx, A.p.vega, 190, 300, 150, a); drawPup(ctx, A.p.jax, 450, 300, 150, a); }
  function bandLine(ctx, x1, y1, x2, y2) { ctx.save(); ctx.strokeStyle = "#5c8dff"; ctx.lineWidth = 4; ctx.shadowColor = "#5c8dff"; ctx.shadowBlur = 14; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore(); }
  function bandPacket(ctx, x, y) { ctx.save(); ctx.fillStyle = "#fff"; ctx.shadowColor = "#3ee6ff"; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill(); ctx.restore(); }

  function buildBand(main, coord) {
    const COLOR = sp("band").color;
    const S = {
      agents: [{ uid: "a1", id: "vega", x: 30, y: 93 }, { uid: "a2", id: "jax", x: 70, y: 93 }],
      links: [{ a: "a1", b: "a2" }],
      mode: "move", running: false, token: 0, msgs: [], dels: []
    };
    const GOALS = ["Plan a surprise birthday party for the team", "Debug the payment outage before the launch", "Plan a heist on the Moon Bank vault", "Pick the theme for the hackathon demo day", "Escape the sinking submarine"];
    main.innerHTML = `
      <div class="lab-bar">
        <select id="bdPick" aria-label="Choose an agent"></select>
        <button class="btn btn-sm" id="bdAdd">＋ Add agent</button>
        <button class="btn ghost btn-sm" id="bdRand">🎲 Random</button>
        <span class="seg" role="group" aria-label="Board mode"><button data-m="move" class="on">✋ Move</button><button data-m="connect">🔗 Connect</button></span>
        <button class="btn ghost btn-sm" id="bdClear" title="Remove all lines">Clear lines</button>
      </div>
      <div class="band-board" id="bdBoard">
        <svg class="bd-lines" id="bdLines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Channels between agents"></svg>
        <div class="bd-hint" id="bdHint"></div>
      </div>
      <div class="lab-bar run">
        <input id="bdGoal" maxlength="140" value="${esc(GOALS[1])}" aria-label="Team goal">
        <select id="bdTurns" aria-label="Number of messages"><option value="6">6 messages</option><option value="10" selected>10 messages</option><option value="14">14 messages</option></select>
        <button class="btn btn-sm" id="bdRun">▶ Run simulation</button>
      </div>
      <div class="ex-chips" id="bdGoals">${GOALS.map(g => `<button>${esc(g)}</button>`).join("")}</div>
      <div class="lab-bar manual" id="bdManual">
        <span class="bd-lbl">✉️ Send by hand</span>
        <select id="bdFrom" aria-label="From agent"></select><span class="bd-arrow">→</span>
        <select id="bdTo" aria-label="To agent"></select>
        <input id="bdMsg" maxlength="200" placeholder="Type a message to send along the channel…" aria-label="Message">
        <label class="bd-reply"><input type="checkbox" id="bdReply" checked> AI reply</label>
        <button class="btn btn-sm" id="bdSend">Send</button>
      </div>
      <div class="band-out">
        <div class="lab-panel"><div class="lp-h">CHANNEL FEED</div><ol class="feed" id="bdFeed"><li class="empty">Press ▶ Run simulation, or send a message by hand below.</li></ol></div>
        <div class="lab-panel"><div class="lp-h">HAND-OFFS · WHO DELEGATED WHAT</div><ol class="dels" id="bdDels"><li class="empty">Delegated tasks appear here.</li></ol></div>
      </div>`;
    const board = $("#bdBoard", main), svg = $("#bdLines", main);
    Scenes.mount(board, { base: "office", time: "night" });

    const ag = uid => S.agents.find(a => a.uid === uid);
    const el = uid => board.querySelector(`.ag[data-u="${uid}"]`);
    const nbrs = uid => S.links.filter(l => l.a === uid || l.b === uid).map(l => ag(l.a === uid ? l.b : l.a)).filter(Boolean);
    const anchor = a => ({ x: a.x, y: a.y - 26 });

    function fillPicker() {
      const used = new Set(S.agents.map(a => a.id));
      $("#bdPick", main).innerHTML = P.characters.filter(c => !used.has(c.id)).map(c => `<option value="${c.id}">${esc(c.name)} · ${esc(c.role)}</option>`).join("");
      $("#bdAdd", main).disabled = $("#bdRand", main).disabled = S.agents.length >= 6 || used.size >= P.characters.length;
    }
    function hint() {
      $("#bdHint", main).textContent = S.agents.length < 2 ? "Add at least two agents." : !S.links.length ? "Drag from a 🔗 handle onto another agent to open a channel." : S.mode === "connect" ? "Connect mode: tap one agent, then another." : "";
    }
    function drawAgents() {
      $$(".ag", board).forEach(n => n.remove());
      S.agents.forEach(a => {
        const c = charById(a.id), d = document.createElement("div");
        d.className = "ag"; d.dataset.u = a.uid; d.style.left = a.x + "%"; d.style.top = a.y + "%";
        d.innerHTML = `<div class="ag-bub"></div><div class="ag-pup"></div><span class="ag-n">${esc(first(c))}</span><button class="ag-x" title="Remove ${esc(c.name)}" aria-label="Remove ${esc(c.name)}">✕</button><button class="ag-h" title="Drag onto another agent to open a channel" aria-label="Link ${esc(c.name)}">🔗</button>`;
        board.appendChild(d);
        Puppet.mount($(".ag-pup", d), c);
      });
      fillPicker(); hint(); fillFromTo();
    }
    function drawLines(temp) {
      svg.innerHTML = S.links.map((l, i) => {
        const a = ag(l.a), b = ag(l.b); if (!a || !b) return "";
        const p = anchor(a), q = anchor(b);
        return `<g class="ln" data-i="${i}"><line class="hit" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" vector-effect="non-scaling-stroke"/><line class="glow" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" vector-effect="non-scaling-stroke"/><line class="core" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" vector-effect="non-scaling-stroke"/><title>Click to delete this channel</title></g>`;
      }).join("") + (temp ? `<line class="temp" x1="${temp.x1}" y1="${temp.y1}" x2="${temp.x2}" y2="${temp.y2}" vector-effect="non-scaling-stroke"/>` : "");
      hint();
      if (!temp) fillFromTo();
    }
    function fillFromTo() {
      const fromSel = $("#bdFrom", main), toSel = $("#bdTo", main); if (!fromSel) return;
      const keep = fromSel.value;
      fromSel.innerHTML = S.agents.map(a => `<option value="${a.uid}">${esc(charById(a.id).name)}</option>`).join("");
      if (S.agents.some(a => a.uid === keep)) fromSel.value = keep;
      const keepTo = toSel.value, ns = nbrs(fromSel.value);
      toSel.innerHTML = ns.length ? ns.map(a => `<option value="${a.uid}">${esc(charById(a.id).name)}</option>`).join("") : `<option value="">no channel: draw a line first</option>`;
      if (ns.some(a => a.uid === keepTo)) toSel.value = keepTo;
      $("#bdSend", main).disabled = !ns.length;
    }
    const pct = e => { const r = board.getBoundingClientRect(); return { x: clamp((e.clientX - r.left) / r.width * 100, 4, 96), y: clamp((e.clientY - r.top) / r.height * 100, 45, 97) }; };
    const agentAt = e => { const n = document.elementFromPoint(e.clientX, e.clientY); const a = n && n.closest(".ag"); return a && a.dataset.u; };
    function addLink(u1, u2) {
      if (!u1 || !u2 || u1 === u2) return;
      if (S.links.some(l => (l.a === u1 && l.b === u2) || (l.a === u2 && l.b === u1))) return;
      S.links.push({ a: u1, b: u2 }); drawLines();
    }
    let drag = null, pendingConnect = null;
    board.addEventListener("pointerdown", e => {
      const n = e.target.closest(".ag"); if (!n || S.running) return;
      if (e.target.closest(".ag-x")) return;
      const u = n.dataset.u;
      if (S.mode === "connect" && !e.target.closest(".ag-h")) {
        if (!pendingConnect) { pendingConnect = u; n.classList.add("sel"); }
        else { addLink(pendingConnect, u); $$(".ag.sel", board).forEach(x => x.classList.remove("sel")); pendingConnect = null; }
        return;
      }
      e.preventDefault();
      drag = { u, link: !!e.target.closest(".ag-h") || S.mode === "connect" };
      board.setPointerCapture(e.pointerId);
      n.classList.add("drag");
    });
    board.addEventListener("pointermove", e => {
      if (!drag) return;
      const p = pct(e), a = ag(drag.u);
      if (drag.link) { const s = anchor(a); drawLines({ x1: s.x, y1: s.y, x2: p.x, y2: p.y }); }
      else { a.x = p.x; a.y = p.y; const n = el(drag.u); n.style.left = a.x + "%"; n.style.top = a.y + "%"; Puppet.walk($(".pup", n), true); drawLines(); }
    });
    const end = e => {
      if (!drag) return;
      const n = el(drag.u); n && n.classList.remove("drag"); n && Puppet.walk($(".pup", n), false);
      if (drag.link) { board.releasePointerCapture && board.releasePointerCapture(e.pointerId); addLink(drag.u, agentAt(e)); drawLines(); }
      drag = null;
    };
    board.addEventListener("pointerup", end);
    board.addEventListener("pointercancel", end);
    board.addEventListener("click", e => {
      const x = e.target.closest(".ag-x");
      if (x && !S.running) { const u = x.closest(".ag").dataset.u; S.agents = S.agents.filter(a => a.uid !== u); S.links = S.links.filter(l => l.a !== u && l.b !== u); drawAgents(); drawLines(); return; }
      const g = e.target.closest(".ln");
      if (g && !S.running) { S.links.splice(+g.dataset.i, 1); drawLines(); }
    });
    let n = 3;
    function addAgent(id) {
      if (!id || S.agents.length >= 6) return;
      const free = [[50, 93], [15, 93], [85, 93], [40, 70], [62, 70], [22, 72]].map(([x, y]) => ({ x, y })).find(p => !S.agents.some(a => Math.abs(a.x - p.x) < 10 && Math.abs(a.y - p.y) < 10)) || { x: 50, y: 80 };
      S.agents.push({ uid: "a" + n++, id, x: free.x, y: free.y }); drawAgents(); drawLines();
    }
    $("#bdAdd", main).onclick = () => addAgent($("#bdPick", main).value);
    $("#bdRand", main).onclick = () => { const opts = $$("#bdPick option", main); opts.length && addAgent(rand(opts).value); };
    $$(".seg button", main).forEach(b => b.onclick = () => { S.mode = b.dataset.m; $$(".seg button", main).forEach(x => x.classList.toggle("on", x === b)); pendingConnect = null; $$(".ag.sel", board).forEach(x => x.classList.remove("sel")); board.classList.toggle("connect", S.mode === "connect"); hint(); });
    $("#bdClear", main).onclick = () => { if (!S.running) { S.links = []; drawLines(); } };
    $("#bdGoals", main).onclick = e => { const b = e.target.closest("button"); if (b) $("#bdGoal", main).value = b.textContent; };

    /* ---------- run ---------- */
    const chan = (a, b) => "#" + [first(charById(a.id)), first(charById(b.id))].map(s => s.toLowerCase()).sort().join("-");
    function packet(from, to, ms) {
      return new Promise(res => {
        const p = document.createElement("i"); p.className = "packet"; board.appendChild(p);
        const s = anchor(from), d = anchor(to), t0 = performance.now();
        (function step(now) {
          const k = clamp((now - t0) / ms, 0, 1), e = ease(k);
          p.style.left = (s.x + (d.x - s.x) * e) + "%"; p.style.top = (s.y + (d.y - s.y) * e) + "%";
          if (k < 1) requestAnimationFrame(step); else { p.remove(); res(); }
        })(t0);
        const line = S.links.findIndex(l => (l.a === from.uid && l.b === to.uid) || (l.b === from.uid && l.a === to.uid));
        const g = svg.querySelector(`.ln[data-i="${line}"]`); if (g) { g.classList.add("hot"); setTimeout(() => g.classList.remove("hot"), ms + 400); }
      });
    }
    function bubble(a, text) {
      $$(".ag-bub", board).forEach(b => b.classList.remove("on"));
      const n = el(a.uid); if (!n) return;
      const b = $(".ag-bub", n); b.textContent = text; b.classList.add("on");
      Puppet.talk($(".pup", n), 1600);
    }
    function logMsg(me, toAg, text, del, thought, src, manual) {
      const m = { from: me.uid, to: toAg.uid, text, del };
      S.msgs.push(m);
      const a = charById(me.id), b = charById(toAg.id);
      const fe = $("#bdFeed", main), empty = fe.querySelector(".empty"); empty && empty.remove();
      const li = document.createElement("li");
      li.innerHTML = `<span class="ch">${esc(chan(me, toAg))}${manual ? ` <em class="by-hand">sent by you</em>` : ""}</span><span class="who"><b>${esc(a.name)}</b> → ${esc(b.name)}</span><span class="msg">${esc(text)}</span>${del ? `<span class="del">📋 delegated: ${esc(del)}</span>` : ""}${thought ? `<span class="th">💭 ${esc(Brain.clip(thought, 160))}</span>` : ""}${src === "offline" && Brain.mode === "llm" ? `<span class="th">⚠ LLM call failed, offline agent used</span>` : ""}`;
      fe.prepend(li);
      if (del) {
        S.dels.push(m);
        $("#bdDels", main).innerHTML = S.dels.map(x => `<li><b>${esc(charById(ag(x.from).id).name)}</b> → <b>${esc(charById(ag(x.to).id).name)}</b><span>${esc(x.del)}</span></li>`).join("");
      }
      return m;
    }
    function agentPrompt(c, others, goal) {
      return `You are ${c.name}, the ${c.role}, one agent in a BAND workspace where agents built with different tools collaborate.
Personality: ${c.personality}
You can ONLY message agents you are connected to by a channel: ${others.map(o => `${charById(o.id).name} (${charById(o.id).role})`).join(", ")}.
Team goal: ${goal}
Move the goal forward: share a finding, ask a question, agree, or delegate ONE concrete sub-task to a connected agent. Stay in character, be specific, be brief.
Reply with JSON only: {"to":"exact name of ONE connected agent","message":"max 28 words","delegate":"the concrete task you hand to them, max 8 words, or empty string","thought":"one short private sentence"}`;
    }
    let sending = false;
    async function sendByHand() {
      if (sending || S.running) return;
      const from = ag($("#bdFrom", main).value), to = ag($("#bdTo", main).value), text = $("#bdMsg", main).value.trim();
      if (!from || !to) { $("#bdHint", main).textContent = "Pick a sender and a connected receiver. Draw a line between them first."; return; }
      if (!text) { $("#bdMsg", main).focus(); return; }
      sending = true; $("#bdSend", main).disabled = true;
      try {
        bubble(from, text);
        await packet(from, to, 900);
        logMsg(from, to, text, "", "", "", true);
        coord.pulse("team", "your message routed", "out");
        $("#bdMsg", main).value = "";
        if ($("#bdReply", main).checked) {
          const c = charById(to.id), goal = $("#bdGoal", main).value.trim() || GOALS[0];
          el(to.uid) && el(to.uid).classList.add("thinking");
          const seen = S.msgs.filter(m => m.from === to.uid || m.to === to.uid).slice(-8).map(m => `${charById(ag(m.from).id).name} → ${charById(ag(m.to).id).name}: ${m.text}`);
          const d = await Brain.ask(agentPrompt(c, [from], goal), `Messages on your channels so far:\n${seen.join("\n")}\n${charById(from.id).name} just sent you: "${text}". Reply to ${charById(from.id).name}.`, 0.9,
            () => ({ to: charById(from.id).name, message: rand([`Got it, ${first(charById(from.id))}. I'll take care of it and report back.`, `Good point. Before I do that, what's the deadline?`, `On it. I'll ${rand(TASKS)} first.`, `Hmm, I'm not sure. Can you ${rand(TASKS)} instead?`]), delegate: "", thought: "Answering the message I just got." }));
          el(to.uid) && el(to.uid).classList.remove("thinking");
          const reply = Brain.clip(d.message, 220) || "…";
          bubble(to, reply);
          await packet(to, from, 900);
          logMsg(to, from, reply, Brain.clip(d.delegate, 80), d.thought, d._src);
        }
      } finally { sending = false; fillFromTo(); }
    }
    $("#bdFrom", main).onchange = fillFromTo;
    $("#bdSend", main).onclick = sendByHand;
    $("#bdMsg", main).onkeydown = e => { if (e.key === "Enter") sendByHand(); };

    const TASKS = ["check the logs", "draft the plan", "book the venue", "test the fix", "write the summary", "call the vendor", "set the budget", "make the slides", "scout the exits", "order the cake"];
    function offline(me, others, goal, k, N) {
      const to = rand(others), t = rand(TASKS), t2 = rand(TASKS.filter(x => x !== t));
      const g = goal.replace(/\.$/, "").toLowerCase();
      const lines = k === N
        ? [[`Wrapping up: I'll ${t2}, you ${t}. That covers "${g}".`, ""], [`Final call: plan locked. ${first(to)}, ping me when you ${t}.`, ""]]
        : [[`${first(to)}, can you ${t}? I'll ${t2} meanwhile.`, t], [`Update on "${g}": I'm blocked until someone can ${t}. Can you take it?`, t], [`Done on my side. Next step is yours: ${t}.`, t], [`I think we're missing something. Before we ${t}, should we ${t2}?`, ""], [`Agreed. I'll handle it: ${t2}.`, ""]];
      const [message, delegate] = rand(lines);
      return { to: to.name, message, delegate, thought: `${first(to)} is the best fit for this.` };
    }
    async function run() {
      if (S.running) { S.token++; S.running = false; $("#bdRun", main).textContent = "▶ Run simulation"; board.classList.remove("running"); return; }
      const linked = S.agents.filter(a => nbrs(a.uid).length);
      if (!linked.length) { $("#bdHint", main).textContent = "Draw at least one line between two agents first."; board.classList.add("shake"); setTimeout(() => board.classList.remove("shake"), 500); return; }
      const goal = $("#bdGoal", main).value.trim() || GOALS[0], N = +$("#bdTurns", main).value, token = ++S.token;
      S.running = true; S.msgs = []; S.dels = [];
      $("#bdRun", main).textContent = "■ Stop"; board.classList.add("running");
      $("#bdFeed", main).innerHTML = ""; $("#bdDels", main).innerHTML = `<li class="empty">No hand-offs yet.</li>`;
      let last = null;
      for (let k = 1; k <= N; k++) {
        if (token !== S.token) return;
        let me = last && nbrs(last.to).length && Math.random() < 0.75 ? ag(last.to) : rand(linked);
        if (!me) me = rand(linked);
        const others = nbrs(me.uid), c = charById(me.id);
        el(me.uid) && el(me.uid).classList.add("thinking");
        const seen = S.msgs.filter(m => m.from === me.uid || m.to === me.uid).slice(-8).map(m => `${chan(ag(m.from) || me, ag(m.to) || me)} ${charById(ag(m.from).id).name} → ${charById(ag(m.to).id).name}: ${m.text}${m.del ? ` [delegated: ${m.del}]` : ""}`);
        const system = agentPrompt(c, others, goal);
        const user = `Messages on your channels so far:\n${seen.join("\n") || "(none yet: you start)"}\nThis is message ${k} of ${N}.${k === N ? " This is the LAST message: wrap up and confirm who does what." : ""}`;
        const d = await Brain.ask(system, user, 0.95, () => offline(me, others.map(o => charById(o.id)), goal, k, N));
        if (token !== S.token) return;
        el(me.uid) && el(me.uid).classList.remove("thinking");
        const toAg = others.find(o => charById(o.id).name === d.to) || others.find(o => first(charById(o.id)).toLowerCase() === String(d.to || "").toLowerCase()) || rand(others);
        const text = Brain.clip(d.message, 220) || "…", del = Brain.clip(d.delegate, 80);
        bubble(me, text);
        await packet(me, toAg, 900);
        if (token !== S.token) return;
        last = logMsg(me, toAg, text, del, d.thought, d._src);
        coord.pulse("team", `${first(charById(me.id))} → ${first(charById(toAg.id))}`, "in");
        if (del) coord.pulse("team", `hand-off: ${del}`, "out");
        await wait(1500);
      }
      coord.pulse("bruin", `${S.msgs.length} messages logged`, "out");
      if (S.dels.length) coord.pulse("finch", `${S.dels.length} tasks need skills`, "out");
      S.running = false; $("#bdRun", main).textContent = "▶ Run simulation again"; board.classList.remove("running");
      $$(".ag-bub", board).forEach(b => b.classList.remove("on"));
    }
    $("#bdRun", main).onclick = run;
    drawAgents(); drawLines();
    return { destroy() { S.token++; } };
  }

  /* LABS 2–5 are appended below (AdaL, Bruin, Finch, Casuro). */
  window.__LABS__ = { LABS, $, $$, esc, rand, clamp, wait, ease, charById, first, sp, speak, hush, rr, wrapLines, textBox, drawCover, drawPup, caption };

  /* ---------- boot (after the other labs register) ---------- */
  window.addEventListener("DOMContentLoaded", boot);
  if (document.readyState !== "loading") setTimeout(boot, 0);
  let booted = false;
  async function boot() {
    if (booted) return; booted = true;
    nav.innerHTML = visibleLabs().map(l => { const s = sp(l.id); return `<button data-lab="${l.id}" style="--c:${s.color}"><span>${s.icon}</span><b>${esc(s.name)}</b><small>${esc(l.tool)}</small></button>`; }).join("");
    nav.onclick = e => { const b = e.target.closest("[data-lab]"); b && open(b.dataset.lab, false); };
    const m = document.getElementById("labMode");
    if (m) m.innerHTML = `<span class="pill">● Checking for the AI server…</span>`;
    await Brain.init();
    const banner = () => {
      if (!m) return;
      m.innerHTML = Brain.mode === "llm"
        ? `<span class="pill ok">● LIVE AI AGENTS</span><span class="mb-txt">Labs run on ${Brain.provider === "adal" ? "AdaL cloud agents" : "OpenAI"} (<b>${esc(Brain.model)}</b>).${Brain.images ? "" : " Image generation is off, so AdaL renders offline vector previews."}</span><span class="mb-pick" id="provPick"></span>`
        : `<span class="pill warn">● OFFLINE DEMO AGENTS</span> ${esc(Brain.reason || "")} The labs still work with simulated agents.`;
      Brain.picker(document.getElementById("provPick"), banner);
    };
    banner();
    window.addEventListener("brain:adal", banner);
    const want = (location.hash.match(/^#lab-(\w+)/) || [])[1];
    open(want || (visibleLabs()[0] || {}).id, !!want);
    window.addEventListener("hashchange", () => { const w = (location.hash.match(/^#lab-(\w+)/) || [])[1]; if (w && (!current || !$("#lab-" + w))) open(w, true); });
  }
})();

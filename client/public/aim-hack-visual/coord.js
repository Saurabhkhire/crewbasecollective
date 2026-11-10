/* =========================================================
   Coord: how the sponsor tools coordinate on one agent task.
     Coord.network(el)        → full animated network (sponsors.html "Tools together" view)
     Coord.strip(el, focusId) → compact "Works with" strip inside a lab
                                returns { pulse(otherId, label, dir), note(text) }
   Nodes: finch, band, adal, casuro, bruin (+ team = the agents, you = the human).
   Needs data.js (HACK.sponsors), play-data.js, puppet.js.
   ========================================================= */
window.Coord = (function () {
  const H = window.HACK, P = window.PLAY;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const NS = "http://www.w3.org/2000/svg";
  const sp = id => H.sponsors.find(s => s.id === id) || (H.allSponsors || []).find(s => s.id === id) || {};
  /* respects the visitor's "⚙️ Tools" setting: hidden sponsor tools drop out of every view */
  const vis = id => id === "team" || id === "you" || !H.sponsorVisible || H.sponsorVisible(id);
  const stepsOf = k => SCENARIOS[k].steps.filter(s => vis(s.f) && vis(s.t));
  const ROLE = { finch: "Skills", band: "Channels", adal: "Images & video", casuro: "Voice & evaluation", bruin: "Data & insights", team: "Agent team", you: "You (human)" };
  const nodeColor = id => id === "team" ? "#eaf0ff" : id === "you" ? "#b6ff5c" : sp(id).color || "#fff";
  const nodeIcon = id => id === "team" ? "🤖" : id === "you" ? "🧑" : sp(id).icon || "•";
  const nodeName = id => id === "team" ? "Agents" : id === "you" ? "You" : sp(id).name || id;

  /* ---------- scenarios: who hands what to whom ---------- */
  const SCENARIOS = {
    film: {
      label: "🎬 Agent film", title: "An agent cast makes a short film",
      steps: [
        { f: "finch", t: "team", label: "🎒 Persuade · Deceive · Investigate", detail: "Finch installs reusable skills into each actor-agent's prompt, so Rook can lie convincingly and Marlowe can spot it." },
        { f: "team", t: "band", label: "💬 Vega → Rook (private)", detail: "Agents message each other only through the BAND channels the director allowed. Other actors can't read it." },
        { f: "band", t: "team", label: "📨 “Meet me at the pod.”", detail: "BAND routes the message, keeps the shared context in sync, and the receiver reacts on the next beat." },
        { f: "team", t: "adal", label: "🎬 12 scenes + cast", detail: "The finished plot goes to AdaL, which turns it into a movie poster and key frames for each act." },
        { f: "adal", t: "band", label: "🖼️ poster on #film", detail: "AdaL shares the poster and frames on the team channel so every agent sees the same visuals." },
        { f: "you", t: "casuro", label: "🎙️ your spoken review", detail: "You review the film out loud; Casuro transcribes it and scores it with evidence from your words." },
        { f: "casuro", t: "bruin", label: "📊 score + quotes", detail: "Casuro sends the scored review, with quotes, into Bruin." },
        { f: "band", t: "bruin", label: "🧾 54 events", detail: "Every message, skill use and frame lands in Bruin's pipeline: who drove the plot, which ending happens most." }
      ]
    },
    game: {
      label: "🎮 Co-op game", title: "Humans and agents survive a zombie night",
      steps: [
        { f: "finch", t: "team", label: "🩹 Medic · 🎯 Sharpshooter", detail: "Finch gives each agent teammate a skill that really changes how it plays." },
        { f: "you", t: "team", label: "🕹️ your moves", detail: "You play alongside the agents as an equal teammate." },
        { f: "team", t: "band", label: "📻 “Cover the north gate!”", detail: "Teammates coordinate over BAND team radio, so plans are shared, not guessed." },
        { f: "band", t: "team", label: "📻 callouts synced", detail: "Every agent gets the callout and re-plans its next wave." },
        { f: "adal", t: "team", label: "🎨 cover art + theme", detail: "AdaL generates the art for the custom game you designed." },
        { f: "team", t: "bruin", label: "📈 kills · damage · rounds", detail: "Every hit, heal and decision streams into Bruin's live stats and quality checks." },
        { f: "bruin", t: "finch", label: "💡 “Medic used 9× — keep it”", detail: "Bruin's numbers feed back into which Finch skills to equip next round." }
      ]
    },
    grow: {
      label: "🎓 Interview", title: "An agent panel interviews a human",
      steps: [
        { f: "finch", t: "team", label: "📋 Examine · 🧑‍🏫 Coach", detail: "Finch gives each panelist a scoring skill: one examines evidence, one coaches." },
        { f: "casuro", t: "you", label: "🎙️ question spoken", detail: "Casuro speaks the panel's question out loud." },
        { f: "you", t: "casuro", label: "🗣️ your answer (voice)", detail: "You answer with your voice; Casuro turns it into a transcript." },
        { f: "casuro", t: "team", label: "📝 transcript + evidence", detail: "The panel receives your exact words to score fairly." },
        { f: "team", t: "band", label: "🔒 “Push on the numbers”", detail: "Panelists confer privately in a BAND back-channel you never see during the session." },
        { f: "band", t: "team", label: "⬆️ next question: harder", detail: "The agreed plan comes back: the next questioner adapts to you." },
        { f: "team", t: "adal", label: "🏅 certificate image", detail: "AdaL renders a certificate for your result." },
        { f: "casuro", t: "bruin", label: "📊 scores per skill", detail: "Every score lands in Bruin: charts per question and per skill, ready to compare sessions." }
      ]
    }
  };

  /* ---------- small helpers ---------- */
  const el = (tag, attrs, parent, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs || {}) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; parent && parent.appendChild(e); return e; };
  const pupHref = c => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(Puppet.svg(c).replace('<svg class="puppet"', '<svg xmlns="http://www.w3.org/2000/svg"'));
  function curve(a, b, bend) {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const k = bend == null ? 0.16 : bend;
    return `M${a.x} ${a.y} Q${mx - dy / len * len * k} ${my + dx / len * len * k} ${b.x} ${b.y}`;
  }
  function defs(svg) {
    const d = el("defs", {}, svg);
    d.innerHTML = `<filter id="cgGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <radialGradient id="cgBg" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#141c3d"/><stop offset="1" stop-color="#070a14"/></radialGradient>
      <pattern id="cgGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0 L0 0 0 40" fill="none" stroke="rgba(120,140,255,.07)"/></pattern>`;
  }
  /* packets: travel along a path, then call done */
  function runPackets(path, color, layer, ms, n) {
    const L = path.getTotalLength();
    const dots = Array.from({ length: n || 3 }, () => el("circle", { r: 6, fill: color, filter: "url(#cgGlow)" }, layer));
    const t0 = performance.now();
    return new Promise(res => {
      (function step(now) {
        let alive = false;
        dots.forEach((d, i) => {
          const k = (now - t0 - i * 160) / ms;
          if (k < 0) { d.setAttribute("opacity", 0); alive = true; return; }
          if (k > 1) { d.setAttribute("opacity", 0); return; }
          alive = true;
          const pt = path.getPointAtLength(L * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2));
          d.setAttribute("cx", pt.x); d.setAttribute("cy", pt.y); d.setAttribute("opacity", 1 - Math.max(0, k - 0.85) * 6);
        });
        if (alive) requestAnimationFrame(step); else { dots.forEach(d => d.remove()); res(); }
      })(t0);
    });
  }

  /* =========================================================
     FULL NETWORK
     ========================================================= */
  const POS = { finch: { x: 175, y: 150 }, band: { x: 500, y: 82 }, adal: { x: 825, y: 150 }, casuro: { x: 825, y: 420 }, bruin: { x: 175, y: 420 }, team: { x: 500, y: 285 }, you: { x: 500, y: 505 } };
  const TEAM = ["vega", "rook", "bolt"];

  function network(root) {
    let scen = "film", step = 0, playing = true, timer = null, dead = false, token = 0, selected = null;
    root.innerHTML = `
      <div class="cg">
        <div class="cg-head">
          <div class="cg-tabs" role="tablist">${Object.entries(SCENARIOS).map(([k, s]) => `<button data-sc="${k}" class="${k === scen ? "on" : ""}">${s.label}</button>`).join("")}</div>
          <div class="cg-ctl"><button class="cg-b" data-a="prev" aria-label="Previous step">⏮</button><button class="cg-b" data-a="play" aria-label="Pause">❚❚</button><button class="cg-b" data-a="next" aria-label="Next step">⏭</button></div>
        </div>
        <div class="cg-body">
          <div class="cg-stage"><svg class="cg-svg" viewBox="0 0 1000 560" role="img" aria-label="Animated diagram of the sponsor tools handing work to each other"></svg>
            <div class="cg-cap" aria-live="polite"></div></div>
          <aside class="cg-side">
            <div class="cg-title"></div>
            <ol class="cg-steps"></ol>
            <div class="cg-info"><small>Tip: click any tool to see what it sends and receives.</small></div>
          </aside>
        </div>
        <div class="cg-legend">${["finch", "band", "adal", "casuro", "bruin"].filter(vis).map(id => `<span style="--c:${nodeColor(id)}"><i></i>${nodeIcon(id)} <b>${esc(nodeName(id))}</b> ${esc(ROLE[id])}</span>`).join("")}<span style="--c:#eaf0ff"><i></i>🤖 <b>Agents</b> do the work</span></div>
      </div>`;
    const svg = root.querySelector(".cg-svg");
    defs(svg);
    el("rect", { x: 0, y: 0, width: 1000, height: 560, fill: "url(#cgBg)" }, svg);
    el("rect", { x: 0, y: 0, width: 1000, height: 560, fill: "url(#cgGrid)" }, svg);
    const edgeL = el("g", {}, svg), packL = el("g", {}, svg), nodeL = el("g", {}, svg), labelL = el("g", {}, svg);

    /* nodes */
    const nodes = {};
    for (const id of Object.keys(POS).filter(vis)) {
      const p = POS[id], c = nodeColor(id), big = id === "team";
      const g = el("g", { class: "cg-node", "data-id": id, transform: `translate(${p.x} ${p.y})`, tabindex: 0, role: "button", "aria-label": `${nodeName(id)}: ${ROLE[id]}` }, nodeL);
      el("circle", { class: "halo", r: big ? 96 : 66, fill: c, opacity: 0 }, g);
      if (big) {
        el("rect", { x: -120, y: -62, width: 240, height: 124, rx: 22, fill: "#10172f", stroke: "rgba(234,240,255,.35)", "stroke-width": 2 }, g);
        TEAM.forEach((cid, i) => { const ch = P.characters.find(x => x.id === cid); if (ch) el("image", { href: pupHref(ch), x: -100 + i * 68, y: -56, width: 60, height: 110 }, g); });
        el("text", { y: 86, "text-anchor": "middle", class: "cg-nm" }, g, "🤖 Agent team");
      } else {
        el("rect", { x: -76, y: -40, width: 152, height: 80, rx: 18, fill: "#10172f", stroke: c, "stroke-width": 2 }, g);
        el("text", { x: -52, y: 9, "font-size": 30, "text-anchor": "middle" }, g, nodeIcon(id));
        el("text", { x: -22, y: -4, class: "cg-nm" }, g, nodeName(id));
        el("text", { x: -22, y: 18, class: "cg-rl", fill: c }, g, ({ finch: "SKILLS", band: "CHANNELS", adal: "MEDIA", casuro: "VOICE · EVAL", bruin: "DATA", you: "HUMAN" })[id] || "");
      }
      nodes[id] = g;
      const pick = () => { selected = selected === id ? null : id; info(); };
      g.addEventListener("click", pick);
      g.addEventListener("keydown", e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), pick()));
    }

    /* edges for the current scenario */
    let edges = {};
    function drawEdges() {
      edgeL.innerHTML = ""; edges = {};
      for (const s of stepsOf(scen)) {
        const key = [s.f, s.t].sort().join("-");
        if (edges[key]) continue;
        const a = POS[s.f], b = POS[s.t];
        const path = el("path", { d: curve(a, b, key === "band-team" ? 0.18 : 0.12), class: "cg-edge", stroke: "rgba(150,170,255,.18)", "stroke-width": 3, fill: "none" }, edgeL);
        edges[key] = path;
      }
    }
    function pathFor(s) {
      const key = [s.f, s.t].sort().join("-"), base = edges[key];
      const a = POS[s.f], b = POS[s.t];
      // direction-correct path for packets
      return el("path", { d: curve(a, b, key === "band-team" ? (s.f === "band" ? -0.18 : 0.18) : 0.12), fill: "none", stroke: "none" }, packL) || base;
    }

    function stepsList() {
      const S = SCENARIOS[scen], ST = stepsOf(scen);
      root.querySelector(".cg-title").innerHTML = `<small>SCENARIO</small><b>${esc(S.title)}</b>`;
      root.querySelector(".cg-steps").innerHTML = ST.map((s, i) => `<li data-i="${i}" class="${i === step ? "on" : i < step ? "done" : ""}"><span style="--c:${nodeColor(s.f)}">${nodeIcon(s.f)}</span><span class="ar">→</span><span style="--c:${nodeColor(s.t)}">${nodeIcon(s.t)}</span><em>${esc(s.label)}</em></li>`).join("");
    }
    function info() {
      Object.entries(nodes).forEach(([id, g]) => g.classList.toggle("sel", id === selected));
      const box = root.querySelector(".cg-info");
      if (!selected) { box.innerHTML = `<small>Tip: click any tool to see what it sends and receives.</small>`; return; }
      const S = stepsOf(scen);
      const out = S.filter(s => s.f === selected), inn = S.filter(s => s.t === selected);
      box.innerHTML = `<div class="cg-ib" style="--c:${nodeColor(selected)}"><b>${nodeIcon(selected)} ${esc(nodeName(selected))}</b> <small>${esc(ROLE[selected])}</small>
        <div><span class="k">SENDS</span>${out.length ? out.map(s => `<p>→ ${nodeIcon(s.t)} ${esc(nodeName(s.t))}: ${esc(s.label)}</p>`).join("") : `<p class="muted">nothing in this scenario</p>`}</div>
        <div><span class="k">RECEIVES</span>${inn.length ? inn.map(s => `<p>← ${nodeIcon(s.f)} ${esc(nodeName(s.f))}: ${esc(s.label)}</p>`).join("") : `<p class="muted">nothing in this scenario</p>`}</div>
        ${sp(selected).url ? `<a href="#lab-${selected}" data-lab-open="${selected}">Try ${esc(nodeName(selected))} in the labs →</a>` : ""}</div>`;
    }

    async function show(i) {
      const my = ++token;
      const S = stepsOf(scen);
      if (!S.length) { root.querySelector(".cg-cap").innerHTML = `<b>Turn on more sponsor tools to see hand-offs.</b><span>Open ⚙️ Tools in the top bar.</span>`; return; }
      step = (i + S.length) % S.length;
      const s = S[step];
      stepsList();
      Object.entries(nodes).forEach(([id, g]) => { g.classList.toggle("on", id === s.f || id === s.t); g.classList.toggle("dim", id !== s.f && id !== s.t); });
      Object.values(edges).forEach(p => p.setAttribute("stroke", "rgba(150,170,255,.14)"));
      const key = [s.f, s.t].sort().join("-"), e = edges[key];
      if (e) { e.setAttribute("stroke", nodeColor(s.f)); e.classList.add("hot"); }
      // label pill at the midpoint
      labelL.innerHTML = "";
      if (e) {
        const mid = e.getPointAtLength(e.getTotalLength() / 2);
        const g = el("g", { class: "cg-pill", transform: `translate(${mid.x} ${mid.y})` }, labelL);
        const t = el("text", { "text-anchor": "middle", y: 5 }, g, s.label);
        const w = Math.min(380, s.label.length * 8.4 + 28);
        g.insertBefore(el("rect", { x: -w / 2, y: -16, width: w, height: 30, rx: 15, fill: "#0b1022", stroke: nodeColor(s.f), "stroke-width": 2 }), t);
      }
      root.querySelector(".cg-cap").innerHTML = `<b>Step ${step + 1}/${S.length} · ${nodeIcon(s.f)} ${esc(nodeName(s.f))} → ${nodeIcon(s.t)} ${esc(nodeName(s.t))}</b><span>${esc(s.detail)}</span>`;
      packL.innerHTML = "";
      const path = pathFor(s);
      await runPackets(path, nodeColor(s.f), packL, 1500, 4);
      if (my !== token || dead) return;
      e && e.classList.remove("hot");
      if (selected) info();
      clearTimeout(timer);
      if (playing) timer = setTimeout(() => show(step + 1), 1700);
    }
    function setScen(k) { scen = k; selected = null; root.querySelectorAll("[data-sc]").forEach(b => b.classList.toggle("on", b.dataset.sc === k)); drawEdges(); info(); show(0); }

    root.addEventListener("click", e => {
      const sc = e.target.closest("[data-sc]"); if (sc) return setScen(sc.dataset.sc);
      const a = e.target.closest("[data-a]");
      if (a) {
        if (a.dataset.a === "play") { playing = !playing; a.textContent = playing ? "❚❚" : "▶"; a.setAttribute("aria-label", playing ? "Pause" : "Play"); clearTimeout(timer); if (playing) show(step + 1); }
        else { playing = false; clearTimeout(timer); root.querySelector('[data-a="play"]').textContent = "▶"; show(step + (a.dataset.a === "next" ? 1 : -1)); }
        return;
      }
      const li = e.target.closest(".cg-steps li"); if (li) { clearTimeout(timer); show(+li.dataset.i); return; }
      const lab = e.target.closest("[data-lab-open]");
      if (lab) { e.preventDefault(); location.hash = "#lab-" + lab.dataset.labOpen; const t = document.getElementById("labs"); t && t.scrollIntoView({ behavior: "smooth" }); }
    });
    drawEdges(); info(); show(0);
    return { destroy() { dead = true; clearTimeout(timer); token++; } };
  }

  /* =========================================================
     COMPACT STRIP (inside each lab)
     ========================================================= */
  const SPOT = [{ x: 60, y: 40 }, { x: 60, y: 120 }, { x: 420, y: 40 }, { x: 420, y: 120 }, { x: 240, y: 145 }];
  function strip(root, focus) {
    const others = ["team", "finch", "band", "adal", "casuro", "bruin"].filter(id => id !== focus && vis(id)).slice(0, 5);
    const pos = Object.fromEntries(others.map((id, i) => [id, SPOT[i]]));
    pos[focus] = { x: 240, y: 70 };
    // canned hand-offs involving this tool, from every scenario
    const canned = Object.values(SCENARIOS).flatMap(S => S.steps).filter(s => (s.f === focus || s.t === focus) && pos[s.f] && pos[s.t]);
    root.innerHTML = `<div class="cs" style="--c:${nodeColor(focus)}">
      <div class="cs-h"><b>🔗 Works with</b><small>how ${esc(nodeName(focus))} hands off to the other tools</small></div>
      <svg class="cs-svg" viewBox="0 0 480 170"></svg>
      <ol class="cs-log"><li class="muted">Use the lab: real hand-offs appear here.</li></ol></div>`;
    const svg = root.querySelector(".cs-svg");
    defs(svg);
    const eL = el("g", {}, svg), pL = el("g", {}, svg), nL = el("g", {}, svg), lL = el("g", {}, svg);
    const paths = {};
    for (const id of others) {
      paths[id] = el("path", { d: curve(pos[focus], pos[id], 0.1), stroke: "rgba(150,170,255,.2)", "stroke-width": 2, fill: "none", "stroke-dasharray": "4 6" }, eL);
    }
    const nodeG = {};
    for (const id of [focus, ...others]) {
      const p = pos[id], c = nodeColor(id), main = id === focus;
      const g = el("g", { class: "cs-node" + (main ? " main" : ""), transform: `translate(${p.x} ${p.y})` }, nL);
      el("circle", { r: main ? 30 : 20, fill: "#10172f", stroke: c, "stroke-width": main ? 3 : 2 }, g);
      el("text", { "text-anchor": "middle", y: main ? 9 : 6, "font-size": main ? 26 : 17 }, g, nodeIcon(id));
      el("text", { "text-anchor": "middle", y: main ? 46 : 34, class: "cs-nm" }, g, nodeName(id));
      nodeG[id] = g;
    }
    let busy = false, idleT = null, real = 0, dead = false;
    const logEl = root.querySelector(".cs-log");
    function log(text, isReal) {
      if (isReal) { if (!real) logEl.innerHTML = ""; real++; }
      else if (real) return;
      if (!isReal) logEl.innerHTML = "";
      const li = document.createElement("li"); li.innerHTML = text; logEl.prepend(li);
      while (logEl.children.length > 4) logEl.lastChild.remove();
    }
    async function pulse(other, label, dir, isReal) {
      if (!pos[other] || dead) return;
      const out = dir !== "in";
      const from = out ? focus : other, to = out ? other : focus;
      const tmp = el("path", { d: curve(pos[from], pos[to], out ? 0.1 : -0.1), fill: "none", stroke: "none" }, pL);
      paths[other].setAttribute("stroke", nodeColor(from)); paths[other].setAttribute("stroke-dasharray", "0");
      nodeG[other].classList.add("on");
      lL.innerHTML = "";
      const mid = paths[other].getPointAtLength(paths[other].getTotalLength() / 2);
      const lbl = String(label).slice(0, 34);
      const g = el("g", { transform: `translate(${Math.min(380, Math.max(100, mid.x))} ${mid.y - 2})`, class: "cs-pill" }, lL);
      const w = lbl.length * 6.3 + 18;
      el("rect", { x: -w / 2, y: -11, width: w, height: 20, rx: 10, fill: "#0b1022", stroke: nodeColor(from) }, g);
      el("text", { "text-anchor": "middle", y: 4 }, g, lbl);
      log(`<span style="color:${nodeColor(from)}">${nodeIcon(from)} ${esc(nodeName(from))}</span> → <span style="color:${nodeColor(to)}">${nodeIcon(to)} ${esc(nodeName(to))}</span> ${esc(label)}`, isReal);
      await runPackets(tmp, nodeColor(from), pL, 1100, 3);
      tmp.remove();
      paths[other].setAttribute("stroke", "rgba(150,170,255,.2)"); paths[other].setAttribute("stroke-dasharray", "4 6");
      nodeG[other].classList.remove("on");
    }
    let ci = 0;
    function idle() {
      clearTimeout(idleT);
      if (dead) return;
      idleT = setTimeout(async () => {
        if (!busy && canned.length && !document.hidden) {
          const s = canned[ci++ % canned.length], other = s.f === focus ? s.t : s.f;
          busy = true; await pulse(other, s.label, s.f === focus ? "out" : "in", false); busy = false;
        }
        idle();
      }, real ? 9000 : 2600);
    }
    idle();
    const queue = [];
    async function drain() { if (busy) return; const q = queue.shift(); if (!q) return; busy = true; await pulse(q[0], q[1], q[2], true); busy = false; drain(); }
    return {
      pulse(other, label, dir) { queue.push([other, label, dir]); if (queue.length > 6) queue.shift(); drain(); },
      destroy() { dead = true; clearTimeout(idleT); }
    };
  }

  /* =========================================================
     TOOL VIEWS: "All together" + one animated view per tool
     Coord.tools(el) → { destroy() }
     ========================================================= */
  const VIEW_INFO = {
    band: { title: "BAND · agents talk to each other", job: "Every agent is linked to the others by channels. Messages travel along the links, each one lands in the channel feed, and tasks get delegated between agents.", lab: "band" },
    finch: { title: "Finch · skills on agents", job: "Each agent carries reusable skills. When an agent uses one, the badge lights up and the skill's instruction changes what the agent says or does.", lab: "finch" },
    adal: { title: "AdaL · images and video", job: "An agent turns a prompt into a storyboard, renders frames one by one, and assembles a poster or short video the other agents can use.", lab: "adal" },
    bruin: { title: "Bruin · data from every agent", job: "Every decision, message and skill use streams into a pipeline (raw → clean → metrics) and becomes a live dashboard you can question.", lab: "bruin" },
    casuro: { title: "Casuro · voice interview & scoring", job: "A human answers out loud. Casuro transcribes the voice, scores each rubric item with evidence quotes, and hands the verdict to the panel.", lab: "casuro" }
  };
  const ORDER = ["band", "finch", "adal", "bruin", "casuro"];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const charOf = id => P.characters.find(c => c.id === id);
  const first = c => String(c.name).replace(/^(Dr\.|Prof\.|Captain|General|Lady)\s+/, "").split(" ")[0];

  function tools(root) {
    const tabs = [{ id: "together", label: "🔗 All together" }].concat(ORDER.filter(vis).map(id => ({ id, label: `${nodeIcon(id)} ${nodeName(id)}` })));
    if (tabs.length === 1) {
      root.innerHTML = `<div class="ct-empty"><span>🙈</span><b>All sponsor tools are hidden.</b><button class="btn btn-sm" data-open-tools>⚙️ Choose sponsor tools</button></div>`;
      return { destroy() {} };
    }
    root.innerHTML = `<div class="ct">
      <div class="ct-tabs" role="tablist">${tabs.map((t, i) => `<button role="tab" data-v="${t.id}" class="${i ? "" : "on"}" style="--c:${t.id === "together" ? "#eaf0ff" : nodeColor(t.id)}">${esc(t.label)}</button>`).join("")}</div>
      <div class="ct-host"></div></div>`;
    const host = root.querySelector(".ct-host");
    let cur = null;
    const show = id => {
      if (cur) { try { cur.destroy(); } catch {} }
      root.querySelectorAll("[data-v]").forEach(b => b.classList.toggle("on", b.dataset.v === id));
      host.innerHTML = "";
      cur = id === "together" ? network(host) : toolView(host, id);
    };
    root.querySelector(".ct-tabs").addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b) show(b.dataset.v); });
    show("together");
    return { destroy() { cur && cur.destroy(); } };
  }

  /* shared frame for one tool view */
  function toolView(host, id) {
    const info = VIEW_INFO[id], c = nodeColor(id);
    const inPlay = (P.tools ? ["film", "game", "grow"].map(t => (P.tools[t] || []).find(x => x.id === id) ? `<li><b>${{ film: "Track 01 · Film", game: "Track 02 · Games", grow: "Track 03 · Grow" }[t]}:</b> ${esc(P.tools[t].find(x => x.id === id).does)}</li>` : "").join("") : "");
    host.innerHTML = `<div class="tv" style="--c:${c}">
      <div class="tv-stage"><div class="tv-layer"></div><svg class="tv-svg" viewBox="0 0 100 100" preserveAspectRatio="none"></svg><div class="tv-cap"><b></b><span></span></div>
        <div class="tv-ctl"><button data-tv="play" aria-label="Pause">❚❚</button></div></div>
      <aside class="tv-side">
        <div class="tv-h"><span class="tv-ic">${nodeIcon(id)}</span><div><small>INDIVIDUAL VIEW</small><b>${esc(info.title)}</b></div></div>
        <p class="tv-job">${esc(info.job)}</p>
        <div class="tv-kpis"></div>
        <div class="tv-fh">LIVE FEED</div><ol class="tv-feed"></ol>
        ${inPlay ? `<div class="tv-fh">IN THE PLAYGROUND</div><ul class="tv-play">${inPlay}</ul>` : ""}
        <a class="btn btn-sm" href="#lab-${info.lab}" data-lab-open="${info.lab}">🧪 Try ${esc(nodeName(id))} in the lab</a>
      </aside></div>`;
    const stage = host.querySelector(".tv-stage"), layer = host.querySelector(".tv-layer"), svg = host.querySelector(".tv-svg");
    const ctx = {
      id, c, stage, layer, svg, alive: true, paused: false,
      cap(who, text) { const cp = host.querySelector(".tv-cap"); cp.querySelector("b").textContent = who || ""; cp.querySelector("span").textContent = text || ""; cp.classList.remove("on"); void cp.offsetWidth; cp.classList.add("on"); },
      feed(html) { const f = host.querySelector(".tv-feed"); const li = document.createElement("li"); li.innerHTML = html; f.prepend(li); while (f.children.length > 6) f.lastChild.remove(); },
      kpis(list) { host.querySelector(".tv-kpis").innerHTML = list.map(([k, v]) => `<div><b>${v}</b><small>${esc(k)}</small></div>`).join(""); },
      async tick(ms) { let left = ms; while (left > 0) { if (!ctx.alive) throw new Error("dead"); await wait(100); if (!ctx.paused && !document.hidden) left -= 100; } if (!ctx.alive) throw new Error("dead"); },
      agent(cid, x, y, scale) {
        const d = document.createElement("div"); d.className = "tv-ag"; d.style.left = x + "%"; d.style.top = y + "%"; if (scale) d.style.setProperty("--s", scale);
        d.innerHTML = `<div class="tv-pup"></div><span class="tv-nm">${esc(first(charOf(cid)))}</span>`;
        layer.appendChild(d); Puppet.mount(d.querySelector(".tv-pup"), charOf(cid));
        return { el: d, pup: d.querySelector(".pup"), id: cid, x, y, name: first(charOf(cid)) };
      },
      line(a, b, cls) { const l = document.createElementNS(NS, "line"); l.setAttribute("x1", a.x); l.setAttribute("y1", a.y); l.setAttribute("x2", b.x); l.setAttribute("y2", b.y); l.setAttribute("class", cls || "tv-ln"); l.setAttribute("vector-effect", "non-scaling-stroke"); svg.appendChild(l); return l; },
      async packet(a, b, color, ms) {
        const p = document.createElement("i"); p.className = "tv-pk"; p.style.background = color || c; p.style.boxShadow = `0 0 14px 4px ${color || c}`;
        p.style.left = a.x + "%"; p.style.top = a.y + "%"; layer.appendChild(p);
        const t0 = performance.now(), dur = ms || 900;
        await new Promise(res => { (function step(now) { const k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; p.style.left = (a.x + (b.x - a.x) * e) + "%"; p.style.top = (a.y + (b.y - a.y) * e) + "%"; if (k < 1 && ctx.alive) requestAnimationFrame(step); else res(); })(t0); setTimeout(res, dur + 400); });
        p.remove();
      }
    };
    Scenes.mount(stage, { base: { band: "office", finch: "lab", adal: "stage", bruin: "boardroom", casuro: "boardroom" }[id], time: "night", weather: "clear" });
    host.querySelector(".tv").addEventListener("click", e => {
      const b = e.target.closest("[data-tv]"); if (b) { ctx.paused = !ctx.paused; b.textContent = ctx.paused ? "▶" : "❚❚"; return; }
      const lab = e.target.closest("[data-lab-open]");
      if (lab) { e.preventDefault(); location.hash = "#lab-" + lab.dataset.labOpen; const t = document.getElementById("labs"); t && t.scrollIntoView({ behavior: "smooth" }); }
    });
    const run = { band: viewBand, finch: viewFinch, adal: viewAdal, bruin: viewBruin, casuro: viewCasuro }[id];
    run(ctx).catch(() => {});
    return { destroy() { ctx.alive = false; } };
  }

  /* ---------- BAND: everyone connected, messages on every link ---------- */
  async function viewBand(x) {
    const spots = [["vega", 20, 50], ["rook", 80, 50], ["bolt", 34, 88], ["priya", 66, 88]];
    const A = spots.map(([id, px, py]) => x.agent(id, px, py, 0.9));
    const anchor = a => ({ x: a.x, y: a.y - 22 });
    const lines = {};
    for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) lines[i + "-" + j] = x.line(anchor(A[i]), anchor(A[j]));
    const MSG = [
      [0, 1, "Rook, can you check the payment logs?", "check the logs"], [1, 0, "On it. Errors started at 9:41.", ""], [1, 2, "BOLT, roll back the 9:40 deploy?", "roll back deploy"],
      [2, 1, "Rollback done. Errors falling.", ""], [3, 0, "I'll tell the customers it's fixed.", "update customers"], [0, 3, "Thanks. Write the summary too?", "write summary"],
      [2, 3, "Here are the numbers for the summary.", ""], [3, 1, "Can you confirm the root cause?", ""], [1, 3, "A config typo. Adding a check.", "add a check"]
    ];
    let n = 0, dels = 0;
    for (let k = 0; ; k++) {
      const [i, j, text, del] = MSG[k % MSG.length], a = A[i], b = A[j];
      const key = Math.min(i, j) + "-" + Math.max(i, j), ln = lines[key];
      Object.values(lines).forEach(l => l.classList.remove("hot"));
      ln.classList.add("hot");
      A.forEach(g => g.el.classList.toggle("on", g === a || g === b));
      Puppet.face(a.pup, b.x > a.x ? 1 : -1); Puppet.face(b.pup, a.x > b.x ? 1 : -1);
      Puppet.talk(a.pup, 1300); Puppet.gesture(a.pup, del ? "point" : "nod", 1300);
      x.cap(`${a.name} → ${b.name} · #team`, text);
      await x.packet(anchor(a), anchor(b), nodeColor("band"), 1000);
      Puppet.gesture(b.pup, "nod", 900);
      n++; if (del) dels++;
      x.feed(`<span class="ch">#team</span> <b>${esc(a.name)}</b> → ${esc(b.name)}: ${esc(text)}${del ? `<em class="dl">📋 delegated: ${esc(del)}</em>` : ""}`);
      x.kpis([["messages", n], ["channels", Object.keys(lines).length], ["hand-offs", dels]]);
      await x.tick(1300);
    }
  }

  /* ---------- Finch: skill badges light up when used ---------- */
  async function viewFinch(x) {
    const lib = (P.allSkills ? P.allSkills() : P.skills || []).slice(0, 8);
    const libEl = document.createElement("div"); libEl.className = "tv-lib";
    libEl.innerHTML = `<small>SKILL LIBRARY</small>` + lib.map(s => `<span class="tv-sk" data-s="${esc(s.id)}" style="--k:${s.color || "#ff9f43"}">${s.icon} ${esc(s.name)}</span>`).join("");
    x.layer.appendChild(libEl);
    const cast = [["marlowe", 16], ["rook", 39], ["imani", 62], ["kit", 85]];
    const A = cast.map(([id, px], i) => { const a = x.agent(id, px, 86, 0.9); a.skills = [lib[(i * 2) % lib.length], lib[(i * 2 + 3) % lib.length]].filter(Boolean); const b = document.createElement("div"); b.className = "tv-badges"; b.innerHTML = a.skills.map(s => `<span data-s="${esc(s.id)}" style="--k:${s.color || "#ff9f43"}">${s.icon}<i>${esc(s.name)}</i></span>`).join(""); a.el.appendChild(b); return a; });
    const SAY = { negotiate: "Half the vault now, half after the alarm.", persuade: "Trust me: this is the only way out.", investigate: "Your story changed. Where were you at 9?", plan: "Step 1: lights. Step 2: vault. Step 3: van.", summarize: "Three facts: no alarm, open door, missing key.", examine: "Clarity 4, evidence 2: you never said how.", coach: "Good start. Now give me one concrete number.", translate: "¿Dónde está la llave? (Where is the key?)", deceive: "I was in the kitchen all night, ask the chef.", inspire: "We've done harder. One more push, together.", heal: "Kit's hurt. Covering him first.", predict: "You always go left. I'll wait on the left." };
    const used = {};
    for (let k = 0; ; k++) {
      const a = A[k % A.length], s = a.skills[Math.floor(k / A.length) % a.skills.length];
      libEl.querySelectorAll(".tv-sk").forEach(e => e.classList.toggle("hot", e.dataset.s === s.id));
      a.el.querySelectorAll(".tv-badges span").forEach(e => e.classList.toggle("hot", e.dataset.s === s.id));
      A.forEach(g => g.el.classList.toggle("on", g === a));
      const libChip = libEl.querySelector(`[data-s="${s.id}"]`);
      if (libChip) { const r1 = libChip.getBoundingClientRect(), r0 = x.stage.getBoundingClientRect(); await x.packet({ x: (r1.left + r1.width / 2 - r0.left) / r0.width * 100, y: (r1.bottom - r0.top) / r0.height * 100 }, { x: a.x, y: a.y - 30 }, s.color || nodeColor("finch"), 800); }
      Puppet.emotion(a.pup, s.id === "deceive" ? "sly" : s.id === "inspire" ? "determined" : "calm");
      Puppet.gesture(a.pup, "raise", 1400); Puppet.talk(a.pup, 1600);
      const line = SAY[s.id] || (s.desc || "Using my skill.");
      x.cap(`${a.name} uses ${s.icon} ${s.name}`, line);
      used[s.name] = (used[s.name] || 0) + 1;
      x.feed(`<b>${esc(a.name)}</b> · <span style="color:${s.color || "#ff9f43"}">${s.icon} ${esc(s.name)}</span><em>${esc(s.instructions || s.desc || "")}</em>`);
      x.kpis([["skills in library", lib.length], ["skills used", Object.values(used).reduce((p, q) => p + q, 0)], ["most used", Object.entries(used).sort((p, q) => q[1] - p[1])[0][0]]]);
      await x.tick(2200);
    }
  }

  /* ---------- AdaL: prompt → storyboard → frames → poster ---------- */
  async function viewAdal(x) {
    const box = document.createElement("div"); box.className = "tv-adal";
    box.innerHTML = `<div class="ad-prompt"><small>PROMPT</small><span class="ad-txt"></span><i class="ad-caret"></i></div><ol class="ad-steps"></ol><div class="ad-strip"></div><div class="ad-poster"></div>`;
    x.layer.appendChild(box);
    const JOBS = [
      { p: "A heist crew escapes a rainy neon city", shots: [["city", "night", "rain"], ["office", "night"], ["kitchen", "night"], ["city", "sunset"]], cast: ["rook", "nyx", "marlowe"], title: "THE INSIDE JOB" },
      { p: "Astronauts argue over the last escape pod", shots: [["space", "night"], ["lab", "night"], ["space", "night"], ["mars", "sunset"]], cast: ["vega", "bolt", "imani"], title: "ONE SEAT LEFT" },
      { p: "A wizard teaches robots to bake", shots: [["castle", "night", "embers"], ["kitchen", "day"], ["cafe", "day"], ["park", "sunset"]], cast: ["merlin", "bolt", "bruno"], title: "SPELLS & SOURDOUGH" }
    ];
    let renders = 0;
    for (let k = 0; ; k++) {
      const J = JOBS[k % JOBS.length];
      box.querySelector(".ad-strip").innerHTML = ""; box.querySelector(".ad-poster").innerHTML = ""; box.querySelector(".ad-poster").classList.remove("on");
      const txt = box.querySelector(".ad-txt"); txt.textContent = "";
      x.cap("You → AdaL", "Typing a one-line idea…");
      for (let i = 0; i <= J.p.length; i += 2) { txt.textContent = J.p.slice(0, i); await x.tick(40); }
      const steps = ["Writing a 4-shot storyboard", "Rendering frames", "Assembling the poster"];
      const ol = box.querySelector(".ad-steps");
      ol.innerHTML = steps.map(s => `<li><i>○</i> ${esc(s)}</li>`).join("");
      const mark = i => ol.querySelectorAll("li").forEach((li, j) => { li.className = j < i ? "done" : j === i ? "on" : ""; li.querySelector("i").textContent = j < i ? "✓" : j === i ? "●" : "○"; });
      mark(0); x.cap("AdaL agent", "Planning shots: wide establishing, close-up, reveal, ending."); await x.tick(1300);
      mark(1);
      for (let i = 0; i < J.shots.length; i++) {
        const [base, time, weather] = J.shots[i], who = charOf(J.cast[i % J.cast.length]);
        const f = document.createElement("div"); f.className = "ad-frame";
        f.innerHTML = `${Scenes.svg({ base, time, weather })}<img alt="" src="${pupHref(who)}"><span>SHOT ${i + 1}</span>`;
        box.querySelector(".ad-strip").appendChild(f);
        renders++;
        x.cap(`AdaL · frame ${i + 1}/${J.shots.length}`, `${base} at ${time}, starring ${first(who)}`);
        x.feed(`🖼️ <b>frame ${i + 1}</b> rendered · ${esc(base)} / ${esc(time)} · ${esc(first(who))}`);
        x.kpis([["frames rendered", renders], ["videos", k + (i === J.shots.length - 1 ? 1 : 0)], ["prompt words", J.p.split(" ").length]]);
        await x.tick(900);
      }
      mark(2); await x.tick(600);
      const po = box.querySelector(".ad-poster");
      po.innerHTML = `${Scenes.svg({ base: J.shots[0][0], time: J.shots[0][1], weather: J.shots[0][2] })}<div class="ad-pc">${J.cast.map(id => `<img alt="" src="${pupHref(charOf(id))}">`).join("")}</div><b>${esc(J.title)}</b><small>An agent film · made with AdaL</small>`;
      po.classList.add("on"); mark(3);
      x.cap("AdaL → BAND", `Poster "${J.title}" shared on #film so every agent sees it.`);
      x.feed(`🎬 <b>poster</b> "${esc(J.title)}" → shared to <span style="color:${nodeColor("band")}">BAND</span>`);
      await x.tick(3200);
    }
  }

  /* ---------- Bruin: events → pipeline → dashboard ---------- */
  async function viewBruin(x) {
    const cast = ["vega", "rook", "bolt", "priya"];
    const A = cast.map((id, i) => x.agent(id, i % 2 ? 15 : 7, 34 + i * 18, 0.55));
    const wrap = document.createElement("div"); wrap.className = "tv-bruin";
    wrap.innerHTML = `<div class="br-pipe">${["Raw events", "Clean", "Metrics"].map((s, i) => `<div class="br-st" data-i="${i}"><b>0</b><small>${s}</small></div>`).join("")}</div>
      <div class="br-dash"><small>DASHBOARD · decisions per agent</small>${cast.map(id => `<div class="br-row"><span>${esc(first(charOf(id)))}</span><div class="br-bar"><i style="width:0"></i></div><em>0</em></div>`).join("")}<div class="br-spark"></div></div>`;
    x.layer.appendChild(wrap);
    const stagePos = i => ({ x: 33 + i * 13, y: 22 });
    const counts = [0, 0, 0], per = cast.map(() => 0), spark = [];
    const KIND = [["💬", "message"], ["⚡", "decision"], ["🎒", "skill use"], ["🖼️", "frame"], ["🗡️", "betrayal"]];
    for (let k = 0; ; k++) {
      const ai = k % cast.length, a = A[ai], [ic, kind] = pick(KIND);
      a.el.classList.add("on"); setTimeout(() => a.el.classList.remove("on"), 900);
      x.cap(`${a.name} → Bruin`, `${ic} ${kind} event logged`);
      await x.packet({ x: a.x + 3, y: a.y - 8 }, stagePos(0), nodeColor("bruin"), 700);
      counts[0]++; wrap.querySelector('[data-i="0"] b').textContent = counts[0];
      await x.packet(stagePos(0), stagePos(1), "#eaf0ff", 450);
      counts[1]++; wrap.querySelector('[data-i="1"] b').textContent = counts[1];
      await x.packet(stagePos(1), stagePos(2), "#b6ff5c", 450);
      counts[2]++; wrap.querySelector('[data-i="2"] b').textContent = counts[2];
      if (kind !== "frame") per[ai]++;
      const max = Math.max(1, ...per);
      wrap.querySelectorAll(".br-row").forEach((r, i) => { r.querySelector("i").style.width = (per[i] / max * 100) + "%"; r.querySelector("em").textContent = per[i]; r.classList.toggle("hot", i === ai); });
      spark.push(per.reduce((p, q) => p + q, 0)); if (spark.length > 24) spark.shift();
      const mx = Math.max(...spark, 1);
      wrap.querySelector(".br-spark").innerHTML = `<svg viewBox="0 0 120 30" preserveAspectRatio="none"><polyline fill="none" stroke="${nodeColor("bruin")}" stroke-width="2" points="${spark.map((v, i) => `${i * 5},${30 - v / mx * 26}`).join(" ")}"/></svg>`;
      x.feed(`${ic} <b>${esc(a.name)}</b> · ${esc(kind)} → <em>raw → clean → metrics</em>`);
      const top = per.indexOf(Math.max(...per));
      x.kpis([["events", counts[0]], ["agents", cast.length], ["most active", first(charOf(cast[top]))]]);
      await x.tick(700);
    }
  }

  /* ---------- Casuro: voice answer, transcript, rubric scoring ---------- */
  async function viewCasuro(x) {
    const panel = x.agent("priya", 24, 86, 0.9), human = x.agent("kit", 76, 86, 0.9);
    Puppet.face(panel.pup, 1); Puppet.face(human.pup, -1);
    const box = document.createElement("div"); box.className = "tv-cas";
    box.innerHTML = `<div class="cs-wave">${Array.from({ length: 28 }, () => "<i></i>").join("")}</div><div class="cs-tr"><small>TRANSCRIPT</small><span></span></div><div class="cs-rub"></div>`;
    x.layer.appendChild(box);
    const QA = [
      { q: "Tell me about a project you're proud of.", a: "I built a booking app that cut wait times by 40 percent for 2,000 users.", scores: { Clarity: 5, Evidence: 5, Confidence: 4, Structure: 4 }, quote: "cut wait times by 40 percent" },
      { q: "What would you do differently?", a: "Um, I guess maybe test it earlier, like, I don't know.", scores: { Clarity: 2, Evidence: 1, Confidence: 2, Structure: 2 }, quote: "I guess maybe" },
      { q: "How did you handle a conflict in your team?", a: "First I listened to both sides, then we agreed on one metric and shipped in a week.", scores: { Clarity: 4, Evidence: 4, Confidence: 4, Structure: 5 }, quote: "agreed on one metric" }
    ];
    const rub = box.querySelector(".cs-rub");
    let total = 0, n = 0;
    for (let k = 0; ; k++) {
      const Q = QA[k % QA.length];
      rub.innerHTML = Object.keys(Q.scores).map(r => `<span data-r="${r}">${r} <b>–</b></span>`).join("");
      box.querySelector(".cs-tr span").textContent = "";
      panel.el.classList.add("on"); human.el.classList.remove("on");
      Puppet.talk(panel.pup, 1600); Puppet.gesture(panel.pup, "out", 1400);
      x.cap(`${panel.name} (panel) · 🔊 spoken by Casuro`, Q.q);
      await x.tick(2000);
      panel.el.classList.remove("on"); human.el.classList.add("on");
      box.classList.add("rec");
      Puppet.talk(human.pup, 2600); Puppet.gesture(human.pup, "nod", 1200);
      x.cap(`${human.name} · 🎙️ answering by voice`, "");
      const tr = box.querySelector(".cs-tr span");
      for (let i = 0; i <= Q.a.length; i += 3) { tr.textContent = Q.a.slice(0, i); await x.tick(55); }
      box.classList.remove("rec");
      for (const [r, v] of Object.entries(Q.scores)) {
        const chip = rub.querySelector(`[data-r="${r}"]`); chip.classList.add(v >= 4 ? "good" : v <= 2 ? "bad" : "mid"); chip.querySelector("b").textContent = v + "/5";
        await x.tick(350);
      }
      const avg = Object.values(Q.scores).reduce((p, q) => p + q, 0) / 4; total += avg; n++;
      Puppet.emotion(panel.pup, avg >= 4 ? "happy" : "thinking");
      x.cap("Casuro · evidence", `“${Q.quote}” → ${avg >= 4 ? "strong, specific answer" : "vague: ask a follow-up"}`);
      x.feed(`🎙️ <b>Q${n}</b> scored ${avg.toFixed(1)}/5 · evidence: <em>“${esc(Q.quote)}”</em>`);
      x.kpis([["answers scored", n], ["average", (total / n).toFixed(1) + "/5"], ["verdict so far", total / n >= 3.5 ? "Hire" : "Not yet"]]);
      await x.tick(2600);
    }
  }

  return { network, strip, tools, SCENARIOS };
})();

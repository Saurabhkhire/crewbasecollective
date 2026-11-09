/* Living world map: islands = tracks, buildings = sponsors,
   wandering agents that decide where to go and log why. */
(function () {
  const H = window.HACK, svg = document.getElementById("world");
  if (!svg || !H) return;
  const NS = "http://www.w3.org/2000/svg";
  const mode = svg.dataset.mode || "full";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, attrs, parent, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    (parent === undefined ? svg : parent) && (parent || svg).appendChild(e);
    return e;
  }
  const pts = a => a.map(p => p.join(",")).join(" ");

  /* ---------- defs & background ---------- */
  const defs = el("defs");
  defs.innerHTML = `
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="isogrid" width="40" height="20" patternUnits="userSpaceOnUse">
      <path d="M0 10 L20 0 L40 10 L20 20 Z" fill="none" stroke="rgba(120,140,255,.07)" stroke-width="1"/>
    </pattern>
    <radialGradient id="sea" cx="50%" cy="45%" r="75%">
      <stop offset="0" stop-color="#111b3d"/><stop offset="1" stop-color="#05070f"/>
    </radialGradient>`;
  el("rect", { x: -200, y: -200, width: 1600, height: 1160, fill: "url(#sea)" });
  el("rect", { x: -200, y: -200, width: 1600, height: 1160, fill: "url(#isogrid)" });

  const CENTER = { id: "center", x: 600, y: 375, rx: 262, ry: 122, hex: "#ffc857" };
  const islands = H.tracks.map(t => ({ id: t.id, x: t.map.x, y: t.map.y, rx: t.map.rx, ry: t.map.ry, hex: t.hex, t }));

  islands.concat([CENTER]).forEach(i => {
    const g = el("radialGradient", { id: "isl-" + i.id, cx: "50%", cy: "40%", r: "65%" }, defs);
    el("stop", { offset: "0", "stop-color": i.hex, "stop-opacity": ".30" }, g);
    el("stop", { offset: "1", "stop-color": i.hex, "stop-opacity": ".06" }, g);
  });

  /* ---------- bridges ---------- */
  const bridges = el("g");
  islands.forEach(i => {
    el("line", { x1: i.x, y1: i.y, x2: CENTER.x, y2: CENTER.y, stroke: i.hex, "stroke-opacity": ".18", "stroke-width": 14, "stroke-linecap": "round" }, bridges);
    el("line", { x1: i.x, y1: i.y, x2: CENTER.x, y2: CENTER.y, stroke: i.hex, "stroke-opacity": ".7", "stroke-width": 2, "stroke-dasharray": "2 9", "stroke-linecap": "round", class: "flow-line" }, bridges);
  });

  /* ---------- islands ---------- */
  function drawIsland(i, parent) {
    const g = el("g", { class: "island", "data-id": i.id }, parent);
    el("ellipse", { cx: i.x, cy: i.y + 16, rx: i.rx, ry: i.ry, fill: "#0a0f22", stroke: i.hex, "stroke-opacity": ".25" }, g);
    el("ellipse", { class: "top", cx: i.x, cy: i.y, rx: i.rx, ry: i.ry, fill: `url(#isl-${i.id})`, stroke: i.hex, "stroke-width": 2, "stroke-opacity": ".85" }, g);
    el("ellipse", { cx: i.x, cy: i.y, rx: i.rx * 0.8, ry: i.ry * 0.8, fill: "none", stroke: i.hex, "stroke-opacity": ".18", "stroke-dasharray": "4 6" }, g);
    return g;
  }

  function isoBox(g, x, y, w, h, c, opts) {
    const d = w / 2;
    const top = [[x, y - h - d], [x + w, y - h], [x, y - h + d], [x - w, y - h]];
    const left = [[x - w, y - h], [x, y - h + d], [x, y + d], [x - w, y]];
    const right = [[x + w, y - h], [x, y - h + d], [x, y + d], [x + w, y]];
    el("polygon", { points: pts(left), fill: c }, g);
    el("polygon", { points: pts(left), fill: "#000", "fill-opacity": ".38" }, g);
    el("polygon", { points: pts(right), fill: c }, g);
    el("polygon", { points: pts(right), fill: "#000", "fill-opacity": ".6" }, g);
    el("polygon", { points: pts(top), fill: c, stroke: "#fff", "stroke-opacity": ".35", "stroke-width": 1 }, g);
    if (!(opts && opts.noWindows) && h > 24) {
      for (let k = 1; k * 12 < h - 6; k++) {
        el("line", { x1: x + 4, y1: y - k * 12 + d - 2, x2: x + w - 4, y2: y - k * 12 + 2, stroke: "#fff", "stroke-opacity": ".22", "stroke-width": 2 }, g);
      }
    }
    return { topY: y - h - d, botY: y + d };
  }

  const islandLayer = el("g");
  islands.forEach(i => {
    const g = drawIsland(i, islandLayer);
    const c = i.hex;
    if (i.id === "film") {
      isoBox(g, i.x - 50, i.y + 12, 38, 46, c);
      isoBox(g, i.x + 35, i.y - 6, 22, 28, c);
      const tw = isoBox(g, i.x + 92, i.y + 26, 10, 64, c, { noWindows: true });
      el("polygon", { points: pts([[i.x + 92, tw.topY + 4], [i.x + 10, i.y - 80], [i.x - 30, i.y - 60]]), fill: c, "fill-opacity": ".12", class: "beam" }, g);
    } else if (i.id === "game") {
      el("ellipse", { cx: i.x - 20, cy: i.y + 18, rx: 68, ry: 32, fill: "#000", "fill-opacity": ".4", stroke: c, "stroke-width": 8, "stroke-opacity": ".75" }, g);
      el("ellipse", { cx: i.x - 20, cy: i.y + 18, rx: 42, ry: 18, fill: c, "fill-opacity": ".15", stroke: c, "stroke-opacity": ".5" }, g);
      isoBox(g, i.x + 82, i.y - 10, 18, 30, c);
      isoBox(g, i.x - 108, i.y - 8, 15, 22, c);
    } else {
      isoBox(g, i.x, i.y + 6, 54, 34, c);
      isoBox(g, i.x - 98, i.y + 20, 18, 22, c);
      isoBox(g, i.x + 100, i.y + 10, 14, 48, c, { noWindows: true });
    }
    const labelY = i.y + i.ry + 38;
    el("text", { x: i.x, y: labelY, "text-anchor": "middle", class: "isl-label", fill: c }, g, `${i.t.icon}  TRACK ${i.t.num}`);
    el("text", { x: i.x, y: labelY + 20, "text-anchor": "middle", class: "isl-sub" }, g, i.t.name);
    el("title", {}, g, `${i.t.name}: ${i.t.tagline}`);
    if (mode === "full") {
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "link");
      const go = () => (location.href = "/aim-hack-visual/tracks.html#" + i.id);
      g.addEventListener("click", go);
      g.addEventListener("keydown", e => e.key === "Enter" && go());
    }
  });

  /* ---------- sponsor district ---------- */
  const center = drawIsland(CENTER, islandLayer);
  center.classList.add("no-hover");
  el("text", { x: CENTER.x, y: CENTER.y + CENTER.ry + 40, "text-anchor": "middle", class: "isl-label", fill: CENTER.hex }, center, "SPONSOR DISTRICT");

  const sponsorLayer = el("g");
  H.sponsors.slice().sort((a, b) => a.map.y - b.map.y).forEach(s => {
    const m = s.map, g = el("g", { class: "sponsor", "data-id": s.id, tabindex: "0", role: "button" }, sponsorLayer);
    if (s.tier === "main") el("ellipse", { cx: m.x, cy: m.y + m.w / 2, rx: m.w * 1.6, ry: m.w * 0.8, fill: s.color, "fill-opacity": ".12", stroke: s.color, "stroke-opacity": ".4", "stroke-dasharray": "3 5" }, g);
    const b = isoBox(g, m.x, m.y, m.w, m.h, s.color, { noWindows: !!s.tower });
    if (s.tower) {
      el("line", { x1: m.x, y1: b.topY, x2: m.x, y2: b.topY - 22, stroke: s.color, "stroke-width": 2 }, g);
      const ring = el("circle", { cx: m.x, cy: b.topY - 22, r: 4, fill: "none", stroke: s.color, "stroke-width": 2 }, g);
      if (!reduce) {
        el("animate", { attributeName: "r", values: "4;30", dur: "2.4s", repeatCount: "indefinite" }, ring);
        el("animate", { attributeName: "opacity", values: "1;0", dur: "2.4s", repeatCount: "indefinite" }, ring);
      }
    }
    el("text", { x: m.x, y: b.topY - (s.tower ? 32 : 10), "text-anchor": "middle", "font-size": s.tier === "main" ? 30 : 18 }, g, s.icon);
    el("text", { x: m.x, y: b.botY + 16, "text-anchor": "middle", class: s.tier === "main" ? "sp-label main" : "sp-label" }, g, s.name);
    el("title", {}, g, `${s.landmark}: click for details`);
    const open = () => window.openSponsor && window.openSponsor(s.id);
    g.addEventListener("click", open);
    g.addEventListener("keydown", e => e.key === "Enter" && open());
  });

  /* ---------- nodes (places agents can go) ---------- */
  const nodes = [];
  islands.forEach(i => nodes.push({ id: i.id, x: i.x, y: i.y + 30, label: i.t.island, short: i.t.short, kind: "track", island: i.id, color: i.hex, reasons: i.t.agentReasons }));
  H.sponsors.forEach(s => nodes.push({ id: s.id, x: s.map.x + s.map.w + 16, y: s.map.y + 6, label: s.landmark, short: s.name, kind: "sponsor", island: "center", color: s.color }));
  const hub = nodes.find(n => n.kind === "sponsor" && H.sponsors.find(s => s.id === n.id).tier === "main") || { x: CENTER.x, y: CENTER.y + 40, island: "center" };

  const rand = a => a[Math.floor(Math.random() * a.length)];
  const jit = r => (Math.random() - 0.5) * r;

  function pickTarget(a) {
    const others = nodes.filter(n => n !== a.at);
    const sp = others.filter(n => n.kind === "sponsor"), tr = others.filter(n => n.kind === "track");
    const pSponsor = mode === "sponsors" ? 0.85 : 0.45;
    return rand(Math.random() < pSponsor && sp.length ? sp : tr.length ? tr : sp);
  }
  function route(from, to) {
    if (from.island === to.island || from === hub || to === hub) return [to];
    return [hub, to];
  }

  /* ---------- agents ---------- */
  const agentLayer = el("g");
  const startPool = mode === "sponsors" ? nodes.filter(n => n.kind === "sponsor") : nodes;
  const agents = H.agents.map((a, i) => {
    const at = startPool[i % startPool.length];
    const g = el("g", { class: "agent" }, agentLayer);
    el("ellipse", { cx: 0, cy: 2, rx: 8, ry: 3.5, fill: "#000", "fill-opacity": ".5" }, g);
    el("rect", { x: -5.5, y: -14, width: 11, height: 14, rx: 5, fill: a.color, filter: "url(#glow)" }, g);
    el("circle", { cx: 0, cy: -19, r: 5, fill: "#f4f6ff" }, g);
    el("circle", { cx: 1.8, cy: -19.5, r: 1.1, fill: "#111" }, g);
    const ax = at.x + jit(40), ay = at.y + jit(14);
    g.setAttribute("transform", `translate(${ax},${ay})`);
    return Object.assign({}, a, { at, x: ax, y: ay, path: [], wait: i < 3 ? 0 : i * 700, g });
  });

  /* ---------- decision log ---------- */
  const logEl = document.getElementById("log"), countEl = document.getElementById("decCount");
  const t0 = performance.now();
  let decisions = 0;
  function logDecision(a, dest, reason) {
    decisions++;
    if (countEl) countEl.textContent = decisions;
    if (!logEl) return;
    const s = Math.floor((performance.now() - t0) / 1000);
    const ts = `t+${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    const li = document.createElement("li");
    li.innerHTML = `<span class="ts">${ts}</span><b style="color:${a.color}">${a.name}</b> <span class="trait">${a.trait}</span>
      <span class="dest">→ <span style="color:${dest.color}">${dest.label}</span></span>
      <em>“${reason}”</em>`;
    logEl.prepend(li);
    while (logEl.children.length > 7) logEl.lastChild.remove();
  }

  /* ---------- loop ---------- */
  const SPEED = reduce ? 1e6 : 52;
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(60, now - last);
    last = now;
    for (const a of agents) {
      if (a.wait > 0) { a.wait -= dt; continue; }
      if (!a.path.length) {
        const dest = pickTarget(a);
        a.dest = dest;
        a.path = route(a.at, dest).map(n => ({ x: n.x + jit(n.kind === "sponsor" ? 18 : 60), y: n.y + jit(12) }));
        // only track-island visits are logged; sponsor buildings are just places to walk to
        if (dest.kind === "track" && dest.reasons && dest.reasons.length) logDecision(a, dest, rand(dest.reasons));
      }
      const p = a.path[0], dx = p.x - a.x, dy = p.y - a.y, dist = Math.hypot(dx, dy), step = (SPEED * dt) / 1000;
      if (dist <= step) {
        a.x = p.x; a.y = p.y; a.path.shift();
        if (!a.path.length) { a.at = a.dest; a.wait = (reduce ? 4000 : 1800) + Math.random() * 3800; }
      } else { a.x += (dx / dist) * step; a.y += (dy / dist) * step; }
      a.g.setAttribute("transform", `translate(${a.x.toFixed(1)},${a.y.toFixed(1)})`);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

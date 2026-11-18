/* =========================================================
   The world map: the AWS Loft town hall on a centre island, three track islands around it,
   and every sponsor + partner mascot roaming the islands doing what their tool does.
     <div data-world></div>  → mounted automatically
     World.mount(el)         → mount by hand
     <div data-world="film"></div> → island view: only that track's island, with the sponsors whose
                               tool is used in that track (+ partners living there), roaming and acting
   Needs data.js (HACK.tracks / sponsors / partners / agents) and mascots.js (+ world.css).
   Clicking a mascot opens its card (window.openSponsor from site.js); clicking an island opens its track.
   ========================================================= */
window.World = (function () {
  const H = window.HACK, M = window.Mascots;
  const NS = "http://www.w3.org/2000/svg";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rand = a => a[Math.floor(Math.random() * a.length)];
  const pts = a => a.map(p => p.join(",")).join(" ");
  const SCALE0 = 1, ACT0 = 1.22;

  function mount(root, only) {
    if (!H || !M || !root || root._world) return;
    root._world = true;
    only = only || root.dataset.world || "";
    const isl1 = H.tracks.some(t => t.id === only) ? only : "";   /* island view */
    const SCALE = isl1 ? 0.58 : SCALE0, ACT = isl1 ? 0.78 : ACT0;   /* the island view is zoomed in, so characters shrink */
    root.classList.add("wm");
    root.innerHTML = `<div class="wm-map"><svg class="wm-svg" viewBox="0 0 1200 780" role="img" aria-label="Map: the AWS Loft town hall in the middle, three track islands around it, and the sponsor and partner characters walking between them"></svg></div>
      <div class="wm-cast" aria-label="Who's on the map"></div>`;
    const svg = root.querySelector("svg");
    const el = (tag, attrs, parent, text) => {
      const e = document.createElementNS(NS, tag);
      for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
      if (text != null) e.textContent = text;
      (parent || svg).appendChild(e);
      return e;
    };

    /* ---------- defs & sea ---------- */
    const defs = el("defs");
    defs.innerHTML = `
      <filter id="wmGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="wmZap" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <pattern id="wmGrid" width="40" height="20" patternUnits="userSpaceOnUse"><path d="M0 10 L20 0 L40 10 L20 20 Z" fill="none" stroke="rgba(120,140,255,.07)"/></pattern>
      <radialGradient id="wmSea" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#111b3d"/><stop offset="1" stop-color="#05070f"/></radialGradient>`;
    el("rect", { x: -200, y: -200, width: 1600, height: 1180, fill: "url(#wmSea)" });
    el("rect", { x: -200, y: -200, width: 1600, height: 1180, fill: "url(#wmGrid)" });
    const waves = el("g", { class: "wm-waves" });
    for (let i = 0; i < 14; i++) el("path", { d: `M${(i * 233) % 1150 + 20} ${(i * 157) % 740 + 20} q10 -6 20 0 q10 6 20 0`, stroke: "rgba(140,170,255,.18)", fill: "none", "stroke-width": 1.5, style: `animation-delay:${(i % 5) * 0.7}s` }, waves);

    /* ---------- islands ---------- */
    const CENTER = { id: "center", x: 600, y: 352, rx: 262, ry: 112, hex: "#ff9f1c" };
    const tracks = H.tracks.map(t => ({ id: t.id, x: t.map.x, y: t.map.y, rx: t.map.rx, ry: t.map.ry, hex: t.hex, t }));
    const ISL = Object.fromEntries(tracks.concat([CENTER]).map(i => [i.id, i]));
    tracks.concat([CENTER]).forEach(i => {
      const g = el("radialGradient", { id: "wmIsl-" + i.id, cx: "50%", cy: "40%", r: "65%" }, defs);
      el("stop", { offset: "0", "stop-color": i.hex, "stop-opacity": ".30" }, g);
      el("stop", { offset: "1", "stop-color": i.hex, "stop-opacity": ".06" }, g);
    });
    const onEllipse = (i, toward, k) => {
      const a = Math.atan2((toward.y - i.y) / i.ry, (toward.x - i.x) / i.rx);
      return { x: i.x + Math.cos(a) * i.rx * k, y: i.y + Math.sin(a) * i.ry * k };
    };
    tracks.forEach(i => { i.dock = onEllipse(i, CENTER, 0.8); i.cdock = onEllipse(CENTER, i, 0.84); });
    if (isl1) { const i = ISL[isl1]; svg.setAttribute("viewBox", `${i.x - i.rx - 30} ${i.y - i.ry - 170} ${i.rx * 2 + 60} ${i.ry * 2 + 250}`); root.classList.add("wm-one"); }
    const WALK = isl1 ? [isl1] : Object.keys(ISL);   /* islands characters may walk to */
    const PLAZA = { x: 600, y: 430 };

    /* bridges (planks + flowing line) */
    const bridges = el("g");
    tracks.forEach(i => {
      el("line", { x1: i.dock.x, y1: i.dock.y, x2: i.cdock.x, y2: i.cdock.y, stroke: "#1b2446", "stroke-width": 22, "stroke-linecap": "round" }, bridges);
      el("line", { x1: i.dock.x, y1: i.dock.y, x2: i.cdock.x, y2: i.cdock.y, stroke: i.hex, "stroke-opacity": ".25", "stroke-width": 16, "stroke-linecap": "round", "stroke-dasharray": "3 6" }, bridges);
      el("line", { x1: i.dock.x, y1: i.dock.y, x2: i.cdock.x, y2: i.cdock.y, stroke: i.hex, "stroke-opacity": ".75", "stroke-width": 2, "stroke-dasharray": "2 9", "stroke-linecap": "round", class: "wm-flow" }, bridges);
    });

    const FOOT = [];   /* building footprints: characters never stand on these */
    function isoBox(g, x, y, w, h, c, o) {
      const d = w / 2;
      FOOT.push({ x, y, w, h });
      const top = [[x, y - h - d], [x + w, y - h], [x, y - h + d], [x - w, y - h]];
      const left = [[x - w, y - h], [x, y - h + d], [x, y + d], [x - w, y]];
      const right = [[x + w, y - h], [x, y - h + d], [x, y + d], [x + w, y]];
      el("polygon", { points: pts(left), fill: c }, g); el("polygon", { points: pts(left), fill: "#000", "fill-opacity": ".38" }, g);
      el("polygon", { points: pts(right), fill: c }, g); el("polygon", { points: pts(right), fill: "#000", "fill-opacity": ".6" }, g);
      el("polygon", { points: pts(top), fill: (o && o.roof) || c, stroke: "#fff", "stroke-opacity": ".35" }, g);
      if (!(o && o.noWindows) && h > 24) for (let k = 1; k * 12 < h - 6; k++) {
        el("line", { x1: x + 4, y1: y - k * 12 + d - 2, x2: x + w - 4, y2: y - k * 12 + 2, stroke: (o && o.lit) || "#fff", "stroke-opacity": o && o.lit ? ".8" : ".22", "stroke-width": 2 }, g);
        if (o && o.lit) el("line", { x1: x - w + 4, y1: y - k * 12 + 2, x2: x - 4, y2: y - k * 12 + d - 2, stroke: o.lit, "stroke-opacity": ".55", "stroke-width": 2 }, g);
      }
      return { topY: y - h - d, botY: y + d };
    }
    function drawIsland(i, parent) {
      const g = el("g", { class: "wm-island", "data-id": i.id }, parent);
      el("ellipse", { cx: i.x, cy: i.y + 16, rx: i.rx, ry: i.ry, fill: "#0a0f22", stroke: i.hex, "stroke-opacity": ".25" }, g);
      el("ellipse", { class: "top", cx: i.x, cy: i.y, rx: i.rx, ry: i.ry, fill: `url(#wmIsl-${i.id})`, stroke: i.hex, "stroke-width": 2, "stroke-opacity": ".85" }, g);
      el("ellipse", { cx: i.x, cy: i.y, rx: i.rx * 0.8, ry: i.ry * 0.8, fill: "none", stroke: i.hex, "stroke-opacity": ".16", "stroke-dasharray": "4 6" }, g);
      return g;
    }

    const islandL = el("g");
    tracks.forEach(i => {
      const g = drawIsland(i, islandL), c = i.hex;
      if (i.id === "film") {
        isoBox(g, i.x - 52, i.y - 4, 34, 40, c);
        const tw = isoBox(g, i.x + 96, i.y + 8, 9, 58, c, { noWindows: true });
        el("polygon", { points: pts([[i.x + 96, tw.topY + 4], [i.x + 20, i.y - 86], [i.x - 18, i.y - 66]]), fill: c, "fill-opacity": ".12", class: "wm-beam" }, g);
      } else if (i.id === "game") {
        el("ellipse", { cx: i.x - 16, cy: i.y + 2, rx: 62, ry: 28, fill: "#000", "fill-opacity": ".4", stroke: c, "stroke-width": 7, "stroke-opacity": ".75" }, g);
        el("ellipse", { cx: i.x - 16, cy: i.y + 2, rx: 38, ry: 15, fill: c, "fill-opacity": ".15", stroke: c, "stroke-opacity": ".5" }, g);
        isoBox(g, i.x + 92, i.y - 16, 16, 26, c);
      } else {
        isoBox(g, i.x - 6, i.y - 6, 46, 30, c);
        isoBox(g, i.x + 108, i.y + 2, 12, 42, c, { noWindows: true });
      }
      const ly = i.y + i.ry + 36;
      el("text", { x: i.x, y: ly, "text-anchor": "middle", class: "wm-isl", fill: c }, g, `${i.t.icon}  TRACK ${i.t.num}`);
      el("text", { x: i.x, y: ly + 20, "text-anchor": "middle", class: "wm-isl-sub" }, g, i.t.name);
      el("title", {}, g, `${i.t.name}: ${i.t.tagline} (click to open the track)`);
      g.setAttribute("tabindex", "0"); g.setAttribute("role", "link"); g.classList.add("link");
      const go = () => (location.href = "/aim-hack-visual/tracks.html#" + i.id);
      g.addEventListener("click", e => { if (!e.target.closest(".ent")) go(); });
      g.addEventListener("keydown", e => e.key === "Enter" && go());
    });

    /* ---------- centre island: AWS Loft town hall ---------- */
    const cg = drawIsland(CENTER, islandL);
    const ev = H.event || {};
    const BY = CENTER.y - 8;
    const hall = el("g", { class: "wm-hall" }, cg);
    isoBox(hall, 684, BY + 22, 34, 36, "#2c3657", { lit: "#ffcf7a" });
    const main = isoBox(hall, 600, BY, 86, 70, "#33406a", { lit: "#ffcf7a", roof: "#3d4a78" });
    el("polygon", { points: pts([[548, BY + 17], [566, BY + 26], [566, BY + 6], [548, BY - 3]]), fill: "#ffcf7a", "fill-opacity": ".85" }, hall);
    el("line", { x1: 600, y1: main.topY + 30, x2: 600, y2: main.topY - 20, stroke: "#c9d0ee", "stroke-width": 2 }, hall);
    el("path", { d: `M600 ${main.topY - 20} l26 6 l-26 6 Z`, fill: "#ff9f1c", class: "wm-flag" }, hall);
    const sy = main.topY + 6;
    el("rect", { x: 540, y: sy, width: 120, height: 26, rx: 5, fill: "#ff9f1c", stroke: "#1b1530", "stroke-width": 2 }, hall);
    el("text", { x: 600, y: sy + 18, "text-anchor": "middle", class: "wm-sign" }, hall, "AWS LOFT");
    el("title", {}, hall, `AWS Loft · town hall · ${ev.date || ""} · ${ev.time || ""}`);
    el("text", { x: CENTER.x, y: CENTER.y + CENTER.ry + 30, "text-anchor": "middle", class: "wm-isl", fill: CENTER.hex }, cg, "🏛️  AWS LOFT · TOWN HALL");
    el("text", { x: CENTER.x, y: CENTER.y + CENTER.ry + 49, "text-anchor": "middle", class: "wm-isl-sub" }, cg, `${ev.dateShort || ""} · ${ev.time || ""}`);
    const blocked = (x, y) => FOOT.some(b => Math.abs(x - b.x) < b.w + 14 && y < b.y + b.w / 2 + 12 && y > b.y - b.w / 2 - Math.min(b.h, 40)) || (x > 520 && x < 690 && y < CENTER.y - 20 && y > CENTER.y - CENTER.ry);

    /* island view: fade the other islands so the track island stands out */
    if (isl1) { islandL.querySelectorAll(".wm-island").forEach(g => g.dataset.id !== isl1 && g.setAttribute("opacity", ".1")); bridges.setAttribute("opacity", ".2"); }
    const ents = [];
    /* ---------- walking helpers ---------- */
    function sample(id) {
      const i = ISL[id];
      for (let n = 0; n < 40; n++) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.74;
        const x = i.x + Math.cos(a) * i.rx * r, y = i.y + Math.sin(a) * i.ry * r + 6;
        if (!blocked(x, y) && (n > 30 || !ents.some(o => Math.abs(o.x - x) < 46 && Math.abs(o.y - y) < 26))) return { x, y };
      }
      return id === "center" ? { x: PLAZA.x + (Math.random() - 0.5) * 120, y: PLAZA.y + (Math.random() - 0.5) * 20 } : { x: i.x, y: i.y + 20 };
    }
    function route(from, to, p) {
      if (from === to) return [p];
      const out = [];
      if (from !== "center") out.push(ISL[from].dock, ISL[from].cdock);
      out.push(PLAZA);
      if (to !== "center") out.push(ISL[to].cdock, ISL[to].dock);
      out.push(p);
      return out.map(q => ({ x: q.x + (Math.random() - 0.5) * 8, y: q.y + (Math.random() - 0.5) * 6 }));
    }
    const islandAt = (x, y) => (Object.values(ISL).find(i => ((x - i.x) / i.rx) ** 2 + ((y - i.y) / i.ry) ** 2 < 1) || CENTER).id;

    /* ---------- layers ---------- */
    const entL = el("g"), fxL = el("g", { class: "wm-fx" }), actL = el("g");

    /* agents (the hackers' AI characters) */
    (H.agents || []).slice(0, isl1 ? 3 : 6).forEach((a, i) => {
      const isl = rand(WALK), p = sample(isl);
      const g = el("g", { class: "ent agent" }, entL);
      el("ellipse", { cx: 0, cy: 1, rx: 7, ry: 3, fill: "#000", "fill-opacity": ".5" }, g);
      const body = el("g", {}, g);
      el("rect", { x: -5.5, y: -15, width: 11, height: 15, rx: 5, fill: a.color, filter: "url(#wmGlow)" }, body);
      el("circle", { cx: 0, cy: -20, r: 5.2, fill: "#f4f6ff" }, body);
      el("circle", { cx: 1.8, cy: -20.5, r: 1.1, fill: "#111" }, body);
      const badge = el("text", { x: 0, y: -30, "text-anchor": "middle", class: "wm-badge" }, g, "");
      el("title", {}, g, `${a.name}: an AI agent (${a.trait})`);
      ents.push({ kind: "agent", id: "ag-" + i, name: a.name, color: a.color, g, body, badge, x: p.x, y: p.y, island: isl, path: [], state: "idle", t: 300 + i * 500, speed: 40, alt: 0, face: 1 });
    });

    /* mascots */
    let orgs = H.sponsors.map(s => ({ s, type: s.tier === "main" ? "Main sponsor · main tool" : s.comms ? "Official event chat" : "Sponsor" })).concat((H.partners || []).map(s => ({ s, type: "Partner" })));
    if (H.host) orgs.unshift({ s: H.host, type: "Host" });
    if (isl1) orgs = orgs.filter(({ s }) => (s.tracks && s.tracks[isl1]) || (s.mascot && s.mascot.home === isl1));
    const station = i => { const I = ISL[isl1], a = (i / orgs.length) * Math.PI * 2 + 0.4; return { x: I.x + Math.cos(a) * I.rx * 0.6, y: I.y + Math.sin(a) * I.ry * 0.55 + 6 }; };
    const toolOf = s => (isl1 && s.tracks && s.tracks[isl1]) || null;
    orgs.forEach(({ s, type }, i) => {
      const m = s.mascot || {};
      const home = isl1 || (ISL[m.home] ? m.home : "center"), st = isl1 ? station(i) : null, p = st || sample(home), fly = M.fly(s.id);
      const g = el("g", { class: "ent mascot", "data-id": s.id, tabindex: 0, role: "button", "aria-label": `${s.name} (${type}): ${m.name || "mascot"}. ${m.action || ""}` }, entL);
      el("ellipse", { cx: 0, cy: 1, rx: fly ? 10 : 15, ry: fly ? 3 : 4.6, fill: "#000", "fill-opacity": fly ? ".3" : ".5", class: "wm-shadow" }, g);
      el("ellipse", { cx: 0, cy: 1, rx: 24, ry: 8, fill: "none", stroke: s.color, "stroke-width": 2, class: "wm-ring" }, g);
      const lift = el("g", {}, g);
      const inner = el("g", { class: "mascot" }, lift);
      inner.innerHTML = M.body(s.id);
      el("text", { x: 0, y: 15, "text-anchor": "middle", class: "wm-name", fill: s.color }, g, s.name);
      const act = el("g", { class: "m-actwrap" }, actL);
      const actIn = el("g", {}, act);
      actIn.innerHTML = M.act(s.id);
      const open = () => window.openSponsor && window.openSponsor(s.id);
      g.addEventListener("click", open);
      g.addEventListener("keydown", e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open()));
      ents.push({ kind: "mascot", id: s.id, org: s, type, m, home, fly, st, g, lift, inner, act, actIn, x: p.x, y: p.y, island: home, path: [], state: "idle", t: 200 + i * 450, speed: fly ? 78 : 44, alt: fly ? 48 : 0, face: 1, phase: Math.random() * 6 });
    });

    /* ---------- cast strip ---------- */
    const cast = root.querySelector(".wm-cast");
    cast.innerHTML = ents.filter(e => e.kind === "mascot").map(e => `
      <button class="wm-c" style="--c:${e.org.color}" data-id="${e.id}">
        <span class="wm-av">${M.svg(e.id)}</span>
        <span class="wm-ct"><b>${esc(e.org.name)}</b><small>${esc(e.type)} · ${esc(toolOf(e.org) ? toolOf(e.org).label : e.m.name || "")}</small><i>${esc(toolOf(e.org) ? toolOf(e.org).does : e.m.action || "")}</i></span>
      </button>`).join("");
    const castBtn = id => cast.querySelector(`[data-id="${id}"]`);
    cast.addEventListener("click", e => { const b = e.target.closest("[data-id]"); b && window.openSponsor && window.openSponsor(b.dataset.id); });
    cast.addEventListener("pointerover", e => { const b = e.target.closest("[data-id]"); ents.forEach(x => x.kind === "mascot" && x.g.classList.toggle("hl", !!b && x.id === b.dataset.id)); });
    cast.addEventListener("pointerleave", () => ents.forEach(x => x.g.classList.remove("hl")));

    /* ---------- action effects (things that reach other characters) ---------- */
    const head = e => ({ x: e.x, y: e.y - e.alt - (e.kind === "agent" ? 20 : 52 * SCALE) });
    const nearest = (e, n, filter) => ents.filter(o => o !== e && (!filter || filter(o))).map(o => [o, Math.hypot(o.x - e.x, o.y - e.y)]).sort((a, b) => a[1] - b[1]).slice(0, n).map(a => a[0]);
    const zig = (a, b, k) => { const out = [[a.x, a.y]]; for (let i = 1; i < k; i++) { const t = i / k; out.push([a.x + (b.x - a.x) * t + (Math.random() - 0.5) * 14, a.y + (b.y - a.y) * t + (Math.random() - 0.5) * 14]); } out.push([b.x, b.y]); return pts(out); };
    const SKILLS = ((window.PLAY && PLAY.skills) || []).map(s => `${s.icon} ${s.name}`).concat(["🤝 Negotiate", "🔎 Investigate"]);
    const FX = {
      band(e) {
        const g = el("g", {}, fxL); let t = 0, targets = nearest(e, 3, o => Math.hypot(o.x - e.x, o.y - e.y) < 340);
        targets.forEach(o => o.g.classList.add("zapped"));
        return {
          update(dt) {
            t -= dt; if (t > 0) return; t = 110;
            g.innerHTML = "";
            const a = { x: e.x, y: e.y - 75 * SCALE };
            targets.forEach(o => { const b = head(o), p = zig(a, b, 6); el("polyline", { points: p, fill: "none", stroke: "#5c8dff", "stroke-width": 6, "stroke-opacity": ".35", "stroke-linecap": "round" }, g); el("polyline", { points: p, fill: "none", stroke: "#e6eeff", "stroke-width": 1.8, filter: "url(#wmZap)" }, g); });
          },
          end() { g.remove(); targets.forEach(o => o.g.classList.remove("zapped")); }
        };
      },
      finch(e) {
        if (!e.drop) return null;
        const tgt = e.drop; e.drop = null;
        const skill = rand(SKILLS);
        const card = el("g", { class: "wm-card" }, fxL);
        el("rect", { x: -9, y: -7, width: 18, height: 14, rx: 2.5, fill: "#fff", stroke: "#ff9f43", "stroke-width": 1.5 }, card);
        el("text", { x: 0, y: 4, "text-anchor": "middle", "font-size": 9 }, card, "🎒");
        e.inner.querySelector(".m-card") && e.inner.querySelector(".m-card").setAttribute("opacity", 0);
        let k = 0; const a = head(e);
        return {
          update(dt) {
            if (k >= 1) return;
            k = Math.min(1, k + dt / 900);
            const b = head(tgt), x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k * k;
            card.setAttribute("transform", `translate(${x} ${y}) rotate(${k * 200})`);
            if (k >= 1) {
              card.remove();
              if (tgt.badge) { tgt.badge.textContent = skill; tgt.g.classList.add("skilled"); clearTimeout(tgt._bt); tgt._bt = setTimeout(() => { tgt.badge.textContent = ""; tgt.g.classList.remove("skilled"); }, 8000); }
            }
          },
          end() { card.remove(); e.inner.querySelector(".m-card") && e.inner.querySelector(".m-card").removeAttribute("opacity"); }
        };
      },
      hirey(e) {
        const near = nearest(e, 4, o => (o.kind === "agent" || o.kind === "mascot") && Math.hypot(o.x - e.x, o.y - e.y) < 230);
        if (near.length < 2) return null;
        const pairs = [[near[0], near[1]]].concat(near.length >= 4 ? [[near[2], near[3]]] : []);
        const g = el("g", {}, fxL);
        const P = pairs.map(() => ({ link: el("path", { fill: "none", stroke: "#4fd1c5", "stroke-width": 2.5, "stroke-dasharray": "6 5", class: "wm-flow" }, g), arms: [0, 1].map(() => el("path", { fill: "none", stroke: "#3fb8ad", "stroke-width": 3, "stroke-linecap": "round", "stroke-opacity": ".75" }, g)), hs: el("text", { "text-anchor": "middle", "font-size": 15 }, g, "🤝") }));
        near.forEach(o => o.g.classList.add("matched"));
        return {
          update() {
            const h = head(e);
            pairs.forEach((pr, k) => {
              const a = head(pr[0]), b = head(pr[1]), mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - 40, q = P[k];
              q.link.setAttribute("d", `M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`);
              q.hs.setAttribute("x", mx); q.hs.setAttribute("y", (a.y + b.y) / 4 + my / 2 + 4);
              [a, b].forEach((p, j) => q.arms[j].setAttribute("d", `M${h.x} ${h.y + 30} Q${(h.x + p.x) / 2} ${Math.max(h.y, p.y) + 24} ${p.x} ${p.y + 8}`));
            });
          },
          end() { g.remove(); near.forEach(o => o.g.classList.remove("matched")); }
        };
      },
      /* Teamily kangaroo: opens a group chat with the nearest characters; agent joeys answer in role */
      teamily(e) {
        const near = nearest(e, 3, o => o !== e && (o.kind === "agent" || o.kind === "mascot") && Math.hypot(o.x - e.x, o.y - e.y) < 280);
        if (!near.length) return null;
        const g = el("g", {}, fxL), ROLES = ["📣", "🎨", "💻"];
        const hub = el("g", {}, g); el("rect", { x: -30, y: -11, width: 60, height: 18, rx: 9, fill: "#8b7bff" }, hub); el("text", { y: 2, "text-anchor": "middle", "font-size": 10, fill: "#fff", "font-weight": 700 }, hub, "# team");
        const L = near.map((o, k) => ({ p: el("path", { fill: "none", stroke: "#8b7bff", "stroke-width": 2, "stroke-dasharray": "4 4", class: "wm-flow" }, g), b: el("g", { opacity: 0 }, g) }));
        L.forEach((q, k) => { el("rect", { x: -13, y: -10, width: 26, height: 16, rx: 7, fill: "#1d2147", stroke: "#8b7bff" }, q.b); el("text", { y: 2.5, "text-anchor": "middle", "font-size": 10 }, q.b, ROLES[k % 3]); });
        near.forEach(o => o.g.classList.add("matched"));
        let t = 0;
        return {
          update(dt) {
            t += dt;
            const h = head(e), hy = h.y - 22;
            hub.setAttribute("transform", `translate(${h.x} ${hy})`);
            near.forEach((o, k) => { const b = head(o); L[k].p.setAttribute("d", `M${h.x} ${hy + 7} Q${(h.x + b.x) / 2} ${Math.min(hy, b.y) - 30} ${b.x} ${b.y - 10}`); L[k].b.setAttribute("transform", `translate(${b.x} ${b.y - 22})`); if (t > 500 + k * 600) L[k].b.setAttribute("opacity", 1); });
          },
          end() { g.remove(); near.forEach(o => o.g.classList.remove("matched")); }
        };
      },
      /* Telem owl: radar pings from its dish, then search beams reach the nearest characters */
      telem(e) {
        const near = nearest(e, 3, o => o !== e && (o.kind === "agent" || o.kind === "mascot") && Math.hypot(o.x - e.x, o.y - e.y) < 300);
        if (!near.length) return null;
        const g = el("g", {}, fxL), rings = [0, 1, 2].map(() => el("circle", { r: 0, fill: "none", stroke: "#e86bff", "stroke-width": 2 }, g));
        const L = near.map(() => ({ p: el("path", { fill: "none", stroke: "#e86bff", "stroke-width": 1.8, "stroke-dasharray": "2 5", class: "wm-flow" }, g), b: el("g", { opacity: 0 }, g) }));
        L.forEach(q => { el("rect", { x: -11, y: -9, width: 22, height: 15, rx: 7, fill: "#2a1340", stroke: "#e86bff" }, q.b); el("text", { y: 2.5, "text-anchor": "middle", "font-size": 9 }, q.b, "🔎"); });
        near.forEach(o => o.g.classList.add("matched"));
        let t = 0;
        return {
          update(dt) {
            t += dt;
            const h = head(e), hy = h.y - 28;
            rings.forEach((r, i) => { const k = ((t / 1400) + i / 3) % 1; r.setAttribute("cx", h.x); r.setAttribute("cy", hy); r.setAttribute("r", 6 + k * 60); r.setAttribute("stroke-opacity", 1 - k); });
            near.forEach((o, k) => { const b = head(o); L[k].p.setAttribute("d", `M${h.x} ${hy} Q${(h.x + b.x) / 2} ${Math.min(hy, b.y) - 36} ${b.x} ${b.y - 10}`); L[k].b.setAttribute("transform", `translate(${b.x} ${b.y - 22})`); if (t > 700 + k * 450) L[k].b.setAttribute("opacity", 1); });
          },
          end() { g.remove(); near.forEach(o => o.g.classList.remove("matched")); }
        };
      },
      /* Runware bot: a mini pod above its head runs jobs and beams results to the nearest characters */
      runware(e) {
        const near = nearest(e, 3, o => o !== e && (o.kind === "agent" || o.kind === "mascot") && Math.hypot(o.x - e.x, o.y - e.y) < 280);
        if (!near.length) return null;
        const g = el("g", {}, fxL), pod = el("g", {}, g), ICONS = ["🖼️", "🔊", "💬"];
        el("rect", { x: -26, y: -12, width: 52, height: 20, rx: 4, fill: "#0b1022", stroke: "#2ee6a6", "stroke-width": 1.5 }, pod);
        const cells = Array.from({ length: 8 }, (_, i) => el("rect", { x: -22 + (i % 4) * 11, y: -9 + Math.floor(i / 4) * 8, width: 9, height: 6, rx: 1.5, fill: "#2ee6a6", opacity: 0.2 }, pod));
        const L = near.map((o, k) => ({ p: el("path", { fill: "none", stroke: "#2ee6a6", "stroke-width": 2, "stroke-dasharray": "3 5", class: "wm-flow" }, g), b: el("g", { opacity: 0 }, g) }));
        L.forEach((q, k) => { el("rect", { x: -11, y: -9, width: 22, height: 15, rx: 4, fill: "#123a30", stroke: "#2ee6a6" }, q.b); el("text", { y: 2.5, "text-anchor": "middle", "font-size": 9 }, q.b, ICONS[k % 3]); });
        near.forEach(o => o.g.classList.add("matched"));
        let t = 0;
        return {
          update(dt) {
            t += dt;
            const h = head(e), hy = h.y - 24;
            pod.setAttribute("transform", `translate(${h.x} ${hy})`);
            cells.forEach((c, i) => c.setAttribute("opacity", (Math.floor(t / 120) + i * 3) % 5 < 2 ? 1 : 0.2));
            near.forEach((o, k) => { const b = head(o); L[k].p.setAttribute("d", `M${h.x} ${hy - 12} Q${(h.x + b.x) / 2} ${Math.min(hy, b.y) - 40} ${b.x} ${b.y - 10}`); L[k].b.setAttribute("transform", `translate(${b.x} ${b.y - 22})`); if (t > 600 + k * 500) L[k].b.setAttribute("opacity", 1); });
          },
          end() { g.remove(); near.forEach(o => o.g.classList.remove("matched")); }
        };
      },
      /* Crewbase host: lights circuit traces to the nearest characters and powers them up */
      crewbase(e) {
        const near = nearest(e, 3, o => o !== e && (o.kind === "agent" || o.kind === "mascot") && Math.hypot(o.x - e.x, o.y - e.y) < 260);
        if (!near.length) return null;
        const g = el("g", {}, fxL);
        const L = near.map(() => ({ p: el("path", { fill: "none", stroke: "#7fe7ff", "stroke-width": 2.2, "stroke-dasharray": "5 4", class: "wm-flow" }, g), n: el("circle", { r: 4, fill: "#c9f6ff" }, g) }));
        near.forEach(o => o.g.classList.add("matched"));
        return {
          update() {
            const h = head(e);
            near.forEach((o, k) => { const b = head(o), mx = b.x; L[k].p.setAttribute("d", `M${h.x} ${h.y + 14} L${mx} ${h.y + 14} L${b.x} ${b.y + 6}`); L[k].n.setAttribute("cx", b.x); L[k].n.setAttribute("cy", b.y + 6); });
          },
          end() { g.remove(); near.forEach(o => o.g.classList.remove("matched")); }
        };
      },
      /* Partnr beaver: builds a plank bridge to another island, then a talent walks across */
      partnr(e) {
        const others = WALK.filter(id => id !== islandAt(e.x, e.y));
        const d = sample(others.length ? rand(others) : WALK[0]), a = { x: e.x + 18, y: e.y - 6 };
        const c = { x: (a.x + d.x) / 2, y: Math.min(a.y, d.y) - (others.length ? 110 : 50) };
        const q = u => ({ x: (1 - u) ** 2 * a.x + 2 * (1 - u) * u * c.x + u * u * d.x, y: (1 - u) ** 2 * a.y + 2 * (1 - u) * u * c.y + u * u * d.y });
        const g = el("g", {}, fxL), N = 18, planks = [];
        for (let i = 0; i < N; i++) { const p = q((i + 0.5) / N), p2 = q((i + 0.9) / N); planks.push(el("rect", { x: -6, y: -3, width: 12, height: 6, rx: 1.5, fill: "#c8955a", stroke: "#7b4a2a", "stroke-width": 1, opacity: 0, transform: `translate(${p.x} ${p.y}) rotate(${Math.atan2(p2.y - p.y, p2.x - p.x) * 57.3})` }, g)); }
        const walker = el("g", { opacity: 0 }, g); el("circle", { r: 5, fill: "#ff8fab" }, walker); el("text", { y: -8, "text-anchor": "middle", "font-size": 11 }, walker, "🎓");
        let t = 0;
        return {
          update(dt) {
            t += dt;
            const built = Math.min(N, Math.floor(t / 110));
            planks.forEach((p, i) => i < built && p.setAttribute("opacity", 1));
            if (built >= N) { const u = Math.min(1, (t - N * 110) / 2200), p = q(u); walker.setAttribute("opacity", 1); walker.setAttribute("transform", `translate(${p.x} ${p.y - 4})`); }
          },
          end() { g.remove(); }
        };
      },
      marvelous(e) {
        const guests = nearest(e, 3, o => o.kind === "agent");
        const g = el("g", {}, fxL);
        const lines = guests.map(() => el("line", { stroke: "#ffc857", "stroke-width": 2, "stroke-dasharray": "4 5", class: "wm-flow" }, g));
        const tags = guests.map(() => el("text", { "text-anchor": "middle", "font-size": 12 }, g, "✉️"));
        guests.forEach(o => o.g.classList.add("invited"));
        return {
          update() { const h = head(e); guests.forEach((o, i) => { const p = head(o); lines[i].setAttribute("x1", h.x); lines[i].setAttribute("y1", h.y + 10); lines[i].setAttribute("x2", p.x); lines[i].setAttribute("y2", p.y); tags[i].setAttribute("x", p.x); tags[i].setAttribute("y", p.y - 10); }); },
          end() { g.remove(); guests.forEach(o => o.g.classList.remove("invited")); }
        };
      }
    };

    /* ---------- behaviour ---------- */
    function nextTarget(e) {
      if (e.id === "finch") {
        // alternate: pick a skill somewhere on the home island, then fly it to an agent
        e.picking = !e.picking;
        if (!e.picking) { const ag = rand(ents.filter(o => o.kind === "agent" && WALK.includes(islandAt(o.x, o.y)))); if (ag) { e.drop = ag; e.path = [{ x: ag.x + 6, y: ag.y }]; return; } }
        e.path = [sample(e.home)]; return;
      }
      if (e.st) { e.path = [{ x: e.st.x + (Math.random() - 0.5) * 50, y: e.st.y + (Math.random() - 0.5) * 16 }]; return; }
      const to = isl1 ? isl1 : e.kind === "mascot" && (!e.moved || Math.random() < 0.78) ? e.home : rand(WALK);
      e.moved = true;
      const p = sample(to);
      e.path = e.fly ? [p] : route(islandAt(e.x, e.y), to, p);
    }
    function startAct(e) {
      e.state = "act"; e.t = e.id === "finch" && !e.drop ? 2600 : 5200 + Math.random() * 1500;
      /* only one speech panel per crowded spot, so panels never pile up; the action itself still plays */
      const crowded = ents.some(o => o !== e && o.state === "act" && o.act && o.act.classList.contains("on") && Math.abs(o.x - e.x) < 150 && Math.abs(o.y - o.alt - (e.y - e.alt)) < 90);
      if (!crowded) e.act.classList.add("on");
      e.g.classList.add("acting");
      const b = castBtn(e.id); b && b.classList.add("on");
      e.fx = FX[e.id] ? FX[e.id](e) : null;
    }
    function endAct(e) {
      e.act.classList.remove("on"); e.g.classList.remove("acting");
      const b = castBtn(e.id); b && b.classList.remove("on");
      if (e.fx) { e.fx.end(); e.fx = null; }
    }
    function place(e, now) {
      const bob = e.fly ? Math.sin(now / 260 + e.phase) * 4 : 0, lift = e.alt + bob;
      e.g.setAttribute("transform", `translate(${e.x.toFixed(1)} ${e.y.toFixed(1)})`);
      if (e.kind === "agent") { e.body.setAttribute("transform", e.face < 0 ? "scale(-1 1)" : ""); return; }
      e.lift.setAttribute("transform", `translate(0 ${(-lift).toFixed(1)})`);
      e.inner.setAttribute("transform", `scale(${(SCALE * e.face).toFixed(2)} ${SCALE})`);
      e.act.setAttribute("transform", `translate(${e.x.toFixed(1)} ${(e.y - lift).toFixed(1)}) scale(${ACT})`);
    }

    let last = performance.now(), visible = true, sortT = 0;
    if ("IntersectionObserver" in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(root);
    function tick(now) {
      const dt = Math.min(60, now - last); last = now;
      if (visible && !document.hidden) {
        for (const e of ents) {
          if (e.state === "walk") {
            const p = e.path[0];
            if (!p) { e.g.classList.remove("walking"); if (e.kind === "mascot") startAct(e); else { e.state = "idle"; e.t = 1200 + Math.random() * 3000; } }
            else {
              const dx = p.x - e.x, dy = p.y - e.y, dist = Math.hypot(dx, dy), step = (e.speed * dt) / 1000;
              if (Math.abs(dx) > 0.5) e.face = dx < 0 ? -1 : 1;
              if (dist <= step) { e.x = p.x; e.y = p.y; e.path.shift(); } else { e.x += (dx / dist) * step; e.y += (dy / dist) * step; }
            }
          } else if (e.state === "act") {
            e.t -= dt; e.fx && e.fx.update(dt);
            if (e.t <= 0) { endAct(e); e.state = "idle"; e.t = 500 + Math.random() * 1500; }
          } else {
            e.t -= dt;
            if (e.t <= 0) { nextTarget(e); e.state = "walk"; e.g.classList.add("walking"); }
          }
          place(e, now);
        }
        sortT -= dt;
        if (sortT <= 0) { sortT = 250; ents.slice().sort((a, b) => a.y - b.y).forEach(e => entL.appendChild(e.g)); }
      }
      requestAnimationFrame(tick);
    }
    if (reduce) {
      ents.forEach(e => place(e, 0));
      ents.slice().sort((a, b) => a.y - b.y).forEach(e => entL.appendChild(e.g));
    } else requestAnimationFrame(tick);

    return { highlight(id) { ents.forEach(x => x.kind === "mascot" && x.g.classList.toggle("hl", x.id === id)); } };
  }

  const boot = () => document.querySelectorAll("[data-world]").forEach(el => mount(el));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  return { mount };
})();

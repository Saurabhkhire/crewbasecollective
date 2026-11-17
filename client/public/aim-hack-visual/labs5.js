/* Sponsor Labs, part 5: Runware (AI inference: one API for image, video, audio, 3D and text,
   running on serverless or dedicated compute in modular "Sonic Pod" data centers).
   Registers into window.__LABS__.LABS created by labs.js.
   Everything here is SIMULATED: no request goes to Runware; prices are examples and
   results are local previews (text jobs use the labs' AI server when it is on).
   Job kinds, example prices and track jobs live in PLAY.runware (play-data.js). */
(function () {
  const L = window.__LABS__;
  if (!L) return;
  const { LABS, $, $$, esc, rand, clamp, wait, ease, rr, textBox, drawCover, drawPup } = L;
  const P = window.PLAY, R = P && P.runware;
  if (!R) return;
  const K = id => R.kinds.find(k => k.id === id) || R.kinds[0];
  const MINT = "#2ee6a6";
  const CELLS = 60, RESERVED = 16;
  const MODES = [
    ["api", "🔌 Models API", "Pay per result. Call any model through one endpoint."],
    ["serverless", "☁️ Serverless", "Your own model or pipeline. Scales up on demand and to zero when idle."],
    ["dedicated", "🧱 Dedicated", "Reserved GPUs in a pod for steady, heavy load."]
  ];
  const BURSTS = {
    film: { label: "🎬 Render a film", n: 24 },
    game: { label: "🎮 Game night", n: 36 },
    grow: { label: "🎓 Interview panel", n: 18 }
  };
  const PROMPTS = { image: "A neon city on a rainy night, cinematic", video: "Drone shot over a forest at sunrise", audio: "A calm narrator says: welcome aboard", "3d": "A low-poly medkit", text: "Write a one-line hook for our hackathon demo" };

  /* ---------- local previews (stand-ins for real model output) ---------- */
  const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const MOTIF = [[/city|neon|street|town/i, "🏙️"], [/space|star|rocket|planet|ship/i, "🚀"], [/rain|storm/i, "🌧️"], [/forest|tree|jungle/i, "🌲"], [/sea|ocean|beach|wave/i, "🌊"], [/cat|kitten/i, "🐱"], [/dog|puppy/i, "🐶"], [/dragon/i, "🐉"], [/robot|android|bot/i, "🤖"], [/zombie/i, "🧟"], [/castle|king|queen/i, "🏰"], [/med|heal|kit/i, "🩹"], [/coffee|cafe/i, "☕"], [/sun|dawn|sunrise|sunset/i, "🌅"], [/mountain|snow/i, "🏔️"]];
  const motif = p => (MOTIF.find(([r]) => r.test(p)) || [0, "✨"])[1];
  function art(prompt, w, h) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d"), hh = hash(prompt), hue = hh % 360;
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `hsl(${hue},65%,22%)`); g.addColorStop(1, `hsl(${(hue + 50) % 360},80%,62%)`);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = `hsla(${(hue + 180) % 360},90%,75%,.85)`; x.beginPath(); x.arc(w * (0.25 + (hh % 50) / 100), h * 0.32, h * 0.14, 0, 7); x.fill();
    for (let i = 0; i < 3; i++) {
      x.fillStyle = `hsl(${(hue + 20 * i) % 360},45%,${28 - i * 8}%)`; x.beginPath(); x.moveTo(0, h);
      for (let k = 0; k <= 8; k++) x.lineTo(w * k / 8, h * (0.55 + i * 0.12) + Math.sin(k * 1.3 + hh % 7 + i * 2) * h * 0.07);
      x.lineTo(w, h); x.closePath(); x.fill();
    }
    x.font = `${Math.round(h * 0.34)}px sans-serif`; x.textAlign = "center"; x.fillText(motif(prompt), w * 0.68, h * 0.62);
    return c;
  }
  function preview(job) {
    const k = K(job.kind), hue = hash(job.prompt) % 360;
    if (k.id === "image") { const c = art(job.prompt, 168, 110); c.className = "rw-img"; return c; }
    if (k.id === "video") { const d = document.createElement("div"); d.className = "rw-vid"; const c = art(job.prompt, 220, 110); d.append(c); d.insertAdjacentHTML("beforeend", `<span class="rw-play">▶</span><span class="rw-dur">0:05</span>`); return d; }
    if (k.id === "audio") { const d = document.createElement("div"); d.className = "rw-aud"; d.style.setProperty("--h", hue); d.innerHTML = `<span class="rw-play">▶</span>${Array.from({ length: 22 }, (_, i) => `<i style="--d:${(i * 0.07).toFixed(2)}s;--a:${20 + (hash(job.prompt + i) % 70)}%"></i>`).join("")}`; return d; }
    if (k.id === "3d") { const d = document.createElement("div"); d.className = "rw-3d"; d.style.setProperty("--h", hue); d.innerHTML = `<div class="rw-cube">${["f", "b", "l", "r", "t", "d"].map(s => `<i class="${s}"></i>`).join("")}</div>`; return d; }
    const d = document.createElement("p"); d.className = "rw-txt"; d.textContent = job.text || "…"; return d;
  }
  const CANNED = ["Ten agents, one stage, zero scripts: watch them improvise a film in real time.", "Our NPCs think on the fly, and every turn costs less than a cent.", "Practice your interview with a panel that listens, scores and coaches.", "Build the multiplayer AI world everyone else will want to play in."];

  /* ---------- demo (looping canvas video) ---------- */
  function demoPod(ctx, W, p, on) {
    ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, 360);
    ctx.fillStyle = "#121a33"; rr(ctx, 250, 70, 360, 200, 14); ctx.fill(); ctx.strokeStyle = MINT; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = MINT; ctx.font = "700 12px 'JetBrains Mono', monospace"; ctx.fillText("⚡ SONIC POD · modular data center", 266, 92);
    for (let i = 0; i < 40; i++) {
      const x = 266 + (i % 10) * 33, y = 106 + Math.floor(i / 10) * 38, lit = on && ((i * 7 + Math.floor(p * 30)) % 5 < 2);
      ctx.fillStyle = lit ? MINT : "rgba(46,230,166,.12)"; rr(ctx, x, y, 27, 30, 5); ctx.fill();
    }
  }
  LABS.push({
    id: "runware", tool: "AI inference & compute", playLink: "film",
    title: "Run any model, at about half the cost",
    pitch: "One API for image, video, voice, 3D and text models, running on serverless or dedicated GPUs in modular data centers. Send jobs from your agents, watch the pod light up, and compare the bill with a traditional neocloud.",
    how: [
      "<b>Pick what to generate</b> (image, video, voice, 3D or text), write a prompt and press <b>⚡ Run job</b>. Every kind goes through the same API.",
      "Or <b>load a whole track</b>: a film crew, a game night or an interview panel fires dozens of jobs at once.",
      "Choose how it runs: <b>Models API</b> (pay per result), <b>Serverless</b> (scales to zero when idle) or <b>Dedicated</b> (reserved GPUs).",
      "Watch the <b>Sonic Pod</b>: each light is a group of GPUs picking up a job. Results land on the right.",
      "The <b>cost panel</b> compares your session with a typical neocloud, and the planner estimates your hackathon budget. Prices and previews here are simulated examples."
    ],
    demoChars: ["bolt"], demoScenes: { bg: { base: "lab", time: "night" } },
    demo: [
      { cap: "Your agent needs a frame, a voice and a clip", dur: 3.2, draw(ctx, p, A, W, H) { drawCover(ctx, A.s.bg, W, H); ctx.fillStyle = "rgba(5,8,20,.45)"; ctx.fillRect(0, 0, W, H); drawPup(ctx, A.p.bolt, 150, 340, 220); ["🖼️ key frame", "🔊 voice line", "🎬 5 s clip"].forEach((t, i) => { if (p * 3.5 > i) textBox(ctx, t, 290, 90 + i * 60, 220, { bg: "rgba(46,230,166,.95)", color: "#04140e" }); }); } },
      { cap: "One API sends every job to the pod", dur: 3.4, draw(ctx, p, A, W, H) { demoPod(ctx, W, p, true); drawPup(ctx, A.p.bolt, 120, 340, 200); for (let i = 0; i < 3; i++) { const k = clamp(p * 1.6 - i * 0.25, 0, 1), x = 170 + (420 - 170) * ease(k), y = 180 - Math.sin(k * Math.PI) * 60; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y + i * 20, 6, 0, 7); ctx.fill(); } } },
      { cap: "Results come back in seconds", dur: 3.4, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H); ["A neon city on a rainy night", "Drone shot over a forest", "A low-poly medkit"].forEach((pr, i) => { if (p * 3.4 > i) { const c = art(pr, 170, 120); ctx.drawImage(c, 50 + i * 190, 100); ctx.fillStyle = "#e6ecff"; ctx.font = "12px 'Space Grotesk', sans-serif"; ctx.fillText(["🖼️ 1.1 s", "🎬 8.6 s", "🧊 5.2 s"][i], 56 + i * 190, 240); } }); } },
      { cap: "About half the bill of a traditional neocloud", dur: 3.8, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, W, H); const e = ease(clamp(p * 1.5, 0, 1)); ctx.font = "600 15px 'Space Grotesk', sans-serif"; ctx.fillStyle = "#e6ecff"; ctx.fillText("Runware", 60, 140); ctx.fillText("Typical neocloud", 60, 210); ctx.fillStyle = MINT; rr(ctx, 210, 122, 180 * e, 26, 6); ctx.fill(); ctx.fillStyle = "#ff8a7a"; rr(ctx, 210, 192, 360 * e, 26, 6); ctx.fill(); if (p > 0.6) textBox(ctx, "Same jobs, up to half the cost", W / 2, 270, 360, { center: true, bg: "rgba(46,230,166,.95)", color: "#04140e" }); } }
    ],
    build: buildRunware
  });

  function buildRunware(main, coord) {
    coord = coord || { pulse() {} };
    const S = { kind: "image", mode: "api", queue: [], busy: new Set(), n: 0, cost: 0, secs: 0, token: 0, idleT: null, byKind: {} };
    main.innerHTML = `
      <div class="rw-top">
        <div class="rw-ask">
          <label class="small muted" for="rwPrompt">What should your agent generate?</label>
          <div class="chip-row rw-kinds" id="rwKinds">${R.kinds.map(k => `<button data-k="${k.id}" class="${k.id === S.kind ? "on" : ""}">${k.icon} ${esc(k.name)}</button>`).join("")}</div>
          <div class="lab-bar"><input id="rwPrompt" maxlength="160" value="${esc(PROMPTS.image)}"><button class="btn btn-sm" id="rwRun">⚡ Run job</button></div>
          <div class="ex-chips rw-burst" id="rwBurst"><small>Or load a whole track:</small>${Object.entries(BURSTS).map(([k, b]) => `<button data-b="${k}">${b.label} · ${b.n} jobs</button>`).join("")}</div>
        </div>
        <div class="rw-modes" id="rwModes">${MODES.map(([id, t, d]) => `<button data-m="${id}" class="${id === S.mode ? "on" : ""}"><b>${t}</b><small>${esc(d)}</small></button>`).join("")}</div>
      </div>
      <div class="rw-mid">
        <div class="lab-panel rw-podp"><div class="lp-h">SONIC POD <span class="muted">· a modular inference data center · each light = a group of GPUs</span></div>
          <div class="rw-pod" id="rwPod"><div class="rw-cells" id="rwCells">${Array.from({ length: CELLS }, (_, i) => `<i data-i="${i}"></i>`).join("")}</div>
            <div class="rw-pipe"><span></span></div><div class="rw-podst" id="rwPodSt"></div></div>
          <div class="rw-q" id="rwQ"></div></div>
        <div class="lab-panel rw-outp"><div class="lp-h">RESULTS <i class="gl-sim">${esc(R.note)}</i></div><div class="rw-gal" id="rwGal"><p class="muted small">Run a job to see results here.</p></div></div>
      </div>
      <div class="rw-under">
        <div class="lab-panel"><div class="lp-h">COST · THIS SESSION</div><div id="rwCost"></div></div>
        <div class="lab-panel"><div class="lp-h">PLAN YOUR HACKATHON BUDGET <span class="muted">· 2 days</span></div><div class="rw-plan" id="rwPlan">
          ${[["image", "Images / day", 2000, 10000, 100], ["video", "5 s clips / day", 40, 400, 5], ["audio", "Voice minutes / day", 60, 600, 10], ["text", "LLM tokens / day (K)", 2000, 20000, 500]].map(([k, l, v, max, step]) => `<label><span>${K(k).icon} ${l}</span><input type="range" data-k="${k}" min="0" max="${max}" step="${step}" value="${v}"><b></b></label>`).join("")}
          <div class="rw-plan-out" id="rwPlanOut"></div></div></div>
      </div>
      <div class="lab-panel rw-connect"><div class="lp-h">ONE API FOR EVERY MODEL</div>
        <p class="small">The same request shape works for images, video, audio, 3D and text: you change the task type and the model. Example below; check the Runware docs for exact fields and model ids.</p>
        <pre class="rw-code"><code>${esc(R.example)}</code></pre>
        <a class="btn btn-sm" href="https://runware.ai" target="_blank" rel="noopener">Open runware.ai ↗</a></div>`;

    const cells = $$("#rwCells i", main), pod = $("#rwPod", main);
    const allowed = () => S.mode === "dedicated" ? cells.slice(0, RESERVED) : cells;
    const cap = () => S.mode === "dedicated" ? RESERVED : S.mode === "serverless" ? CELLS : 12;
    function podState() {
      cells.forEach((c, i) => {
        c.classList.toggle("res", S.mode === "dedicated" && i < RESERVED);
        c.classList.toggle("shared", S.mode === "api" && !S.busy.has(c) && (i * 13) % 7 === 0);
        if (S.mode === "serverless" && !S.busy.has(c) && !S.queue.length) c.classList.add("off");
        if (S.mode !== "serverless") c.classList.remove("off");
      });
      const active = S.busy.size;
      $("#rwPodSt", main).innerHTML = S.mode === "serverless"
        ? (active ? `☁️ Scaled up: <b>${active}</b> GPU groups busy` : `☁️ Scaled to zero · <b>$0</b> while idle`)
        : S.mode === "dedicated" ? `🧱 <b>${RESERVED}</b> reserved GPU groups · ${active} busy` : `🔌 Shared pool · <b>${active}</b> of your jobs running`;
      pod.classList.toggle("hot", active > 0);
    }
    function drawQ() {
      const q = S.queue.slice(0, 14);
      $("#rwQ", main).innerHTML = (q.length ? `<small>QUEUE · ${S.queue.length}</small>` : "") + q.map(j => `<span style="--c:${K(j.kind).color}">${K(j.kind).icon}</span>`).join("");
    }
    function drawCost() {
      const neo = S.cost * R.neo, kinds = Object.entries(S.byKind);
      $("#rwCost", main).innerHTML = !S.n ? `<p class="muted small">No jobs yet.</p>` : `
        <div class="rw-kpi"><div><b>${S.n}</b><small>jobs</small></div><div><b>${(S.secs / S.n).toFixed(1)} s</b><small>avg time</small></div><div><b>${R.price(S.cost)}</b><small>spent</small></div></div>
        <div class="rw-bars"><div><span>Runware</span><i style="--w:${100 / R.neo}%;--c:${MINT}"></i><b>${R.price(S.cost)}</b></div><div><span>Typical neocloud</span><i style="--w:100%;--c:#ff8a7a"></i><b>${R.price(neo)}</b></div></div>
        <div class="gl-save">You kept <b>${R.price(neo - S.cost)}</b> in this session. ${kinds.map(([k, n]) => `${K(k).icon} ${n}`).join(" · ")}</div>`;
    }
    function drawPlan() {
      let tot = 0;
      $$("#rwPlan input", main).forEach(inp => {
        const k = K(inp.dataset.k), v = +inp.value;
        inp.nextElementSibling.textContent = v.toLocaleString();
        tot += v * k.price * 2;
      });
      $("#rwPlanOut", main).innerHTML = `<div><span>Runware</span><b style="color:${MINT}">${R.price(tot)}</b></div><div><span>Typical neocloud</span><b style="color:#ff8a7a">${R.price(tot * R.neo)}</b></div><div class="rw-keep">Left for pizza: <b>${R.price(tot * (R.neo - 1))}</b></div>`;
    }
    function addResult(job, secs) {
      const gal = $("#rwGal", main);
      if (gal.querySelector("p.muted")) gal.innerHTML = "";
      const k = K(job.kind), card = document.createElement("figure");
      card.className = "rw-card"; card.style.setProperty("--c", k.color);
      card.append(preview(job));
      card.insertAdjacentHTML("beforeend", `<figcaption><b>${k.icon} ${esc(job.label || job.prompt).slice(0, 60)}</b><small>${secs.toFixed(1)} s · ${R.price(k.price)} / ${esc(k.unit)}</small></figcaption>`);
      gal.prepend(card);
      while (gal.children.length > 8) gal.lastChild.remove();
    }
    async function fly(cell) {
      const r0 = pod.getBoundingClientRect(), r1 = cell.getBoundingClientRect();
      const d = document.createElement("b"); d.className = "rw-dot"; pod.append(d);
      d.style.left = "0px"; d.style.top = r0.height / 2 + "px";
      void d.offsetWidth;
      d.style.left = (r1.left - r0.left + r1.width / 2) + "px"; d.style.top = (r1.top - r0.top + r1.height / 2) + "px";
      await wait(420); d.remove();
    }
    async function runJob(job, token) {
      const free = allowed().filter(c => !S.busy.has(c)), cell = free[Math.floor(Math.random() * free.length)];
      if (!cell) { S.queue.unshift(job); return; }
      S.busy.add(cell); clearTimeout(S.idleT);
      const k = K(job.kind), secs = +(k.secs * (0.7 + Math.random() * 0.6)).toFixed(1);
      if (S.mode === "serverless" && cell.classList.contains("off")) { cell.classList.remove("off"); cell.classList.add("boot"); await wait(250); cell.classList.remove("boot"); }
      podState();
      await fly(cell);
      if (token !== S.token) return;
      cell.style.setProperty("--c", k.color); cell.classList.add("busy");
      if (job.kind === "text" && !job.text) {
        const out = await Brain.ask("You are a text model served through one inference API at a hackathon. Answer the request in one or two short sentences, max 40 words. Reply with JSON only: {\"text\":\"...\"}", job.prompt, 0.8, () => ({ text: rand(CANNED) }));
        job.text = Brain.clip(out.text, 260) || rand(CANNED);
      }
      await wait(clamp(secs * 330, 350, 3200));
      if (token !== S.token) return;
      cell.classList.remove("busy"); cell.classList.add("done"); setTimeout(() => cell.classList.remove("done"), 500);
      S.busy.delete(cell);
      S.n++; S.cost += k.price; S.secs += secs; S.byKind[k.id] = (S.byKind[k.id] || 0) + 1;
      if (!job.burst || S.n % 4 === 0) addResult(job, secs);
      if (!job.burst || S.n % 6 === 0) coord.pulse("team", `${k.icon} ${k.name.toLowerCase()} · ${secs} s`, "out");
      drawCost(); podState(); pump(token);
      if (!S.busy.size && !S.queue.length) {
        $("#rwRun", main).disabled = false;
        if (S.mode === "serverless") S.idleT = setTimeout(() => { cells.forEach(c => c.classList.add("off")); podState(); }, 1800);
        if (S.n >= 6) coord.pulse("bruin", `${S.n} jobs · cost per run`, "out");
      }
    }
    function pump(token) {
      while (S.queue.length && S.busy.size < cap() && allowed().some(c => !S.busy.has(c))) {
        const j = S.queue.shift();
        runJob(j, token);
      }
      drawQ();
    }
    function enqueue(jobs) {
      S.queue.push(...jobs);
      clearTimeout(S.idleT);
      drawQ(); pump(S.token);
    }
    function runOne() {
      const prompt = $("#rwPrompt", main).value.trim() || PROMPTS[S.kind];
      coord.pulse("team", `${K(S.kind).icon} job: ${prompt.slice(0, 18)}`, "in");
      enqueue([{ kind: S.kind, prompt, label: prompt }]);
    }
    function burst(track) {
      const list = R.jobs[track], n = BURSTS[track].n, jobs = [];
      for (let i = 0; i < n; i++) { const [kind, label] = list[i % list.length]; jobs.push({ kind, label, prompt: label, burst: true, text: kind === "text" ? rand(CANNED) : "" }); }
      coord.pulse("team", `${n} ${track} jobs`, "in");
      enqueue(jobs);
    }

    $("#rwRun", main).onclick = runOne;
    $("#rwPrompt", main).onkeydown = e => { if (e.key === "Enter") runOne(); };
    $("#rwKinds", main).onclick = e => { const b = e.target.closest("[data-k]"); if (!b) return; S.kind = b.dataset.k; $$("#rwKinds button", main).forEach(x => x.classList.toggle("on", x === b)); $("#rwPrompt", main).value = PROMPTS[S.kind]; };
    $("#rwBurst", main).onclick = e => { const b = e.target.closest("[data-b]"); if (b) burst(b.dataset.b); };
    $("#rwModes", main).onclick = e => {
      const b = e.target.closest("[data-m]"); if (!b || b.dataset.m === S.mode) return;
      S.mode = b.dataset.m; $$("#rwModes button", main).forEach(x => x.classList.toggle("on", x === b));
      if (S.mode === "serverless" && !S.busy.size) cells.forEach(c => c.classList.add("off"));
      podState(); pump(S.token);
    };
    $("#rwPlan", main).oninput = drawPlan;
    podState(); drawCost(); drawPlan(); drawQ();
    return { destroy() { S.token++; clearTimeout(S.idleT); } };
  }
})();

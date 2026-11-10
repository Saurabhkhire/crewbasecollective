/* Tracks page: track sections, idea bank filters, idea generator, readiness checklist */
(function () {
  const H = window.HACK;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const TAGS = [["all", "All"], ["Starter", "Beginner-friendly"], ["3D", "3D"], ["Voice", "Voice"], ["ML", "ML / learning"]];

  /* ---------- tabs ---------- */
  const tabs = $("#trackTabs");
  if (tabs) {
    tabs.innerHTML =
      H.tracks.map(t => `<a href="#${t.id}" data-id="${t.id}" style="--c:${t.hex}">${t.icon} ${t.num} · ${esc(t.name)}</a>`).join("") +
      `<a href="#generator">🎲 Idea generator</a><a href="#checklist">✅ Am I eligible?</a><a href="#pitfalls">⚠️ Pitfalls</a>`;
  }

  /* ---------- track sections ---------- */
  const root = $("#tracksRoot");
  root.innerHTML = H.tracks.map(t => `
    <section class="track" id="${t.id}" style="--c:${t.hex}">
      <div class="wrap">
        <div class="track-head">
          <div>
            <span class="num">TRACK ${t.num} · ${t.island.toUpperCase()}</span>
            <h2>${t.icon} ${esc(t.name)}</h2>
            <p class="tl">${esc(t.tagline)}</p>
            <p>${esc(t.pitch)}</p>
          </div>
          <div>
            <div class="for-you"><b>Great fit for:</b> ${esc(t.forYou)}</div>
            <a class="btn" style="margin-top:12px" href="/aim-hack-visual/play.html#${t.id}">▶ ${t.id === "film" ? "Direct a film with agents" : t.id === "game" ? "Play games with agents" : "Get interviewed by an agent panel"}</a>
          </div>
        </div>

        <div class="track-body">
          <div class="card flow">
            ${t.flow.map((f, i) => `<div class="step"><div class="k">${i + 1}</div><h4>${esc(f[0])}</h4><p>${esc(f[1])}</p></div>`).join("")}
          </div>
          <div class="card musts">
            <h3>Track must-haves</h3>
            <ul>${t.musts.map(m => `<li>${esc(m)}</li>`).join("")}</ul>
          </div>
        </div>

        <div class="ideas-head">
          <h3>Idea bank<span>${t.ideas.length} starting points. Steal, remix, combine.</span></h3>
          <div class="filters">${TAGS.map((g, i) => `<button data-tag="${g[0]}" class="${i ? "" : "on"}">${g[1]}</button>`).join("")}</div>
        </div>
        <div class="ideas">
          ${t.ideas.map(i => `
            <article class="card idea" data-tags="${i.tags.join(",")}">
              <div class="top"><h4>${esc(i.t)}</h4><div class="tags">${i.tags.map(g => `<span class="tag t-${g}">${g === "Starter" ? "STARTER" : g.toUpperCase()}</span>`).join("")}</div></div>
              <p class="logline">${esc(i.log)}</p>
              <div class="cast">${i.cast.map(c => `<span>${esc(c)}</span>`).join("")}</div>
              <div class="key"><b>${esc(t.keyLabel)}</b>${esc(i.key)}</div>
              ${i.up ? `<p class="up">⬆ ${esc(i.up)}</p>` : ""}
            </article>`).join("")}
        </div>
      </div>
    </section>`).join("");

  root.querySelectorAll(".filters").forEach(f =>
    f.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      f.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
      const tag = b.dataset.tag;
      f.closest(".track").querySelectorAll(".idea").forEach(c => {
        c.hidden = tag !== "all" && !c.dataset.tags.split(",").includes(tag);
      });
    })
  );

  /* highlight active tab on scroll */
  if (tabs && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) tabs.querySelectorAll("a").forEach(a => a.classList.toggle("on", a.dataset.id === en.target.id));
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    root.querySelectorAll(".track").forEach(s => io.observe(s));
  }

  /* ---------- idea generator ---------- */
  const genTabs = $("#genTabs"), slotsEl = $("#genSlots"), outEl = $("#genOut");
  let cur = H.tracks[0].id;
  const state = {}; // trackId -> { vals:[], locks:[] }
  const rand = a => a[Math.floor(Math.random() * a.length)];

  function roll(id, force) {
    const slots = H.generator[id];
    const st = state[id] || (state[id] = { vals: [], locks: [] });
    slots.forEach((s, i) => {
      if (st.locks[i] && !force) return;
      let v, n = 0;
      do { v = rand(s[1]); } while (v === st.vals[i] && n++ < 10);
      st.vals[i] = v;
    });
  }
  function sentence(id, v) {
    if (id === "film") return `A short film set in <b>${v[0]}</b> starring <b>${v[1]}</b>. It opens when <b>${v[2]}</b>. The twist: <b>${v[3]}</b>. The agents decide how it ends.`;
    if (id === "game") return `A co-op game in <b>${v[0]}</b>. Human players try to <b>${v[2]}</b>, sharing the world with <b>${v[1]}</b>, who can trigger <b>${v[3]}</b> entirely on their own.`;
    return `Practise <b>${v[0]}</b> in <b>${v[2]}</b> with <b>${v[1]}</b>. As the session goes on, <b>${v[3]}</b>. It ends with a verdict and evidence-based feedback.`;
  }
  function renderGen(animate) {
    const t = H.tracks.find(x => x.id === cur), st = state[cur];
    genTabs.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.id === cur));
    slotsEl.innerHTML = H.generator[cur].map((s, i) => `
      <button class="card slot ${st.locks[i] ? "locked" : ""} ${animate && !st.locks[i] ? "spin" : ""}" data-i="${i}" style="--c:${t.hex}" aria-pressed="${!!st.locks[i]}">
        <small><span>${esc(s[0])}</span><span>${st.locks[i] ? "🔒 locked" : "click to lock"}</span></small>
        <span class="v">${esc(st.vals[i])}</span>
      </button>`).join("");
    outEl.style.setProperty("--c", t.hex);
    outEl.innerHTML = `<span class="kicker">Your prompt · Track ${t.num}</span>${sentence(cur, st.vals.map(esc))}`;
  }
  if (genTabs) {
    genTabs.innerHTML = H.tracks.map(t => `<button data-id="${t.id}" style="--c:${t.hex}">${t.icon} ${esc(t.short)}</button>`).join("");
    H.tracks.forEach(t => roll(t.id, true));
    genTabs.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; cur = b.dataset.id; renderGen(true); });
    slotsEl.addEventListener("click", e => {
      const b = e.target.closest(".slot"); if (!b) return;
      const st = state[cur], i = +b.dataset.i; st.locks[i] = !st.locks[i]; renderGen(false);
    });
    $("#genRoll").addEventListener("click", () => { roll(cur); renderGen(true); });
    renderGen(false);
  }

  /* ---------- ✨ agentic idea generator (LLM via Brain, offline fallback from the slots) ---------- */
  const ai = $("#aiGen");
  if (ai && window.Brain) {
    const HKEY = "aimp_ideas";
    const loadH = () => { try { return JSON.parse(localStorage.getItem(HKEY) || "[]"); } catch { return []; } };
    const saveH = list => { try { localStorage.setItem(HKEY, JSON.stringify(list.slice(0, 12))); } catch {} };
    const STEPS = ["Reading your interests", "Picking a world", "Casting the agents", "Choosing sponsor tools", "Writing build steps"];
    const EX = ["I love cooking and robots", "space, mystery and voice acting", "football and strategy games", "learning Spanish", "job interviews for nurses", "music festivals"];
    let aiTrack = cur, current = null, busy = false;
    const playHref = id => `/aim-hack-visual/play.html#${id}`;
    const trackOf = id => H.tracks.find(t => t.id === id) || H.tracks[0];

    ai.innerHTML = `
      <div class="ag-head">
        <div><span class="kicker">New · agentic</span><h3>✨ Generate with an AI agent</h3>
        <p class="muted">Tell the agent what you're into. It designs a complete project idea: world, cast, the moment agents decide, sponsor tools and your first build steps.</p></div>
        <div class="ag-banner" id="agBanner"><span class="pill">● Checking the AI server…</span></div>
      </div>
      <div class="ag-form">
        <div class="ag-tracks" id="agTracks">${H.tracks.map(t => `<button type="button" data-t="${t.id}" style="--c:${t.hex}">${t.icon} ${esc(t.short)}</button>`).join("")}</div>
        <div class="ag-row"><input id="agIn" maxlength="160" placeholder="Your interests or a theme (optional), e.g. I love cooking and robots"><button class="btn ai" id="agGo">✨ Generate idea</button></div>
        <div class="ex-chips" id="agEx">${EX.map(e => `<button type="button">${esc(e)}</button>`).join("")}</div>
      </div>
      <div id="agWork"></div>
      <div id="agOut"></div>
      <div class="ag-hist" id="agHist"></div>`;

    const banner = () => {
      const b = $("#agBanner");
      if (Brain.mode === "llm") { b.innerHTML = `<span class="pill ok">● LIVE AI AGENT</span><span class="ag-pp" id="agPick"></span>`; Brain.picker($("#agPick"), banner); }
      else b.innerHTML = `<span class="pill warn">● OFFLINE AGENT</span><span class="muted" style="font-size:13px">Ideas come from the built-in generator.</span>`;
    };
    Brain.init().then(banner);
    window.addEventListener("brain:adal", banner);

    const setTrack = id => { aiTrack = id; ai.querySelectorAll("[data-t]").forEach(b => b.classList.toggle("on", b.dataset.t === id)); };
    setTrack(aiTrack);

    function work(on) {
      const w = $("#agWork");
      if (!on) { w.innerHTML = ""; return null; }
      w.innerHTML = `<div class="ag-work"><b>🤖 ${Brain.mode === "llm" ? "Agent at work" : "Offline agent at work"}</b><ol>${STEPS.map((s, i) => `<li data-i="${i}"><i>○</i>${esc(s)}</li>`).join("")}</ol></div>`;
      const lis = [...w.querySelectorAll("li")];
      const set = k => lis.forEach((li, i) => { li.className = i < k ? "done" : i === k ? "on" : ""; li.querySelector("i").textContent = i < k ? "✓" : i === k ? "●" : "○"; });
      let k = 0; set(0);
      const t = setInterval(() => { if (k < STEPS.length - 1) set(++k); }, 850);
      return { done() { clearInterval(t); set(STEPS.length); } };
    }

    function offlineIdea(trackId, interest) {
      roll(trackId, true);
      const v = state[trackId].vals, t = trackOf(trackId), sps = H.sponsors.slice(0, 3);
      const words = String(interest || "").replace(/^i (love|like|enjoy)\s+/i, "").trim();
      const base = rand(t.ideas);
      const goals = ["wants to win at any cost", "is hiding a secret", "protects the group", "plays both sides", "wants to be the hero", "tests the humans"];
      const cast = (base.cast || []).slice(0, 4).map(r => ({ role: r, goal: rand(goals) }));
      const cap = w => w ? w[0].toUpperCase() + w.slice(1) : w;
      const logline = trackId === "film" ? `A short film set in ${v[0]} with ${v[1]}. It opens when ${v[2]}; the twist: ${v[3]}.`
        : trackId === "game" ? `A co-op game in ${v[0]} where humans try to ${v[2]} alongside ${v[1]}, who can trigger ${v[3]} on their own.`
        : `Practise ${v[0]} in ${v[2]} with ${v[1]}; ${v[3]}.`;
      return {
        title: words ? `${base.t}: ${words.split(/[ ,]+/).filter(Boolean).slice(0, 3).map(cap).join(" ")} Edition` : base.t,
        logline: logline + (words ? ` Themed around ${words}.` : ""),
        track: trackId, world: v[0], cast,
        agent_decides: base.key,
        coordination: trackId === "grow" ? "Panelists confer privately after every answer and agree how to adapt the next question." : "Agents message each other privately, form alliances and react to each other's moves every turn.",
        sponsors: sps.map(s => ({ id: s.id, how: s.buildIdea })),
        stretch: ["3D: " + (base.up || "move the scene into a simple 3D space"), "Voice: give each agent its own TTS voice", "ML: agents remember the last run and change strategy"],
        steps: ["Write each agent as a JSON profile: goal, personality, secret, memory", "Build the loop: observe → decide (LLM, JSON output) → act on screen → log", "Show the decision log next to the visuals and run it twice to prove outcomes change"],
        _src: "offline"
      };
    }

    async function generate(remixOf) {
      if (busy) return; busy = true;
      const interest = $("#agIn").value.trim();
      const t = trackOf(aiTrack);
      const go = $("#agGo"); go.disabled = true; go.textContent = "Thinking…";
      $("#agOut").innerHTML = "";
      const w = work(true);
      const sponsors = H.sponsors.map(s => `${s.id}: ${s.name} — ${s.blurb.split(". ")[0]}`).join("\n") || "(none)";
      const system = `You are an idea agent for the "Multiplayer AI" hackathon (${H.event.date}, ${H.event.time}, ${H.event.venue}; ${H.event.format}). Projects must have: ${H.checklist.must.map(m => m[0] + " (" + m[1] + ")").join("; ")}. Bonus: ${H.checklist.bonus.map(b => b[0]).join(", ")}.
Track: ${t.name}. ${t.pitch}
Must-haves for this track: ${t.musts.join("; ")}.
Sponsor tools available (use ONLY these ids, pick 1-3 that genuinely fit):
${sponsors}
Design ONE specific, buildable-in-a-day project idea that fits the person's interests. Be concrete and visual, no generic chatbots.
Reply with JSON only: {"title":"max 6 words","logline":"one vivid sentence, max 30 words","track":"${t.id}","world":"the setting, max 14 words","cast":[{"role":"agent role","goal":"one-line goal or secret"}],"agent_decides":"the key moment the agents decide, max 22 words","coordination":"how the agents coordinate with each other, max 26 words","sponsors":[{"id":"sponsor id","how":"how it is used in this project, max 20 words"}],"stretch":["3 stretch goals: one 3D, one voice, one ML/memory"],"steps":["first 3 build steps, max 16 words each"]}`;
      const user = remixOf
        ? `Remix this idea into a fresh variation (keep the spirit, change the world and the twist): ${JSON.stringify({ title: remixOf.title, logline: remixOf.logline, world: remixOf.world })}. Interests: ${interest || "(none given)"}`
        : `Interests / theme: ${interest || "(none given: surprise me)"}`;
      let idea = await Brain.ask(system, user, 1.0, () => offlineIdea(t.id, interest));
      w && w.done();
      idea = clean(idea, t.id, interest);
      current = idea;
      const hist = loadH(); hist.unshift({ ...idea, at: Date.now() }); saveH(hist);
      show(idea); renderHist();
      go.disabled = false; go.textContent = "✨ Generate idea"; busy = false;
    }
    function clean(o, trackId, interest) {
      const fb = offlineIdea(trackId, interest);
      const clip = (x, n) => String(x == null ? "" : x).trim().slice(0, n);
      const arr = (x, n) => (Array.isArray(x) ? x : []).slice(0, n);
      const vis = id => H.sponsors.some(s => s.id === id);
      const cast = arr(o.cast, 5).map(c => ({ role: clip(c && (c.role || c.name), 40), goal: clip(c && c.goal, 120) })).filter(c => c.role);
      const sps = arr(o.sponsors, 3).filter(s => s && vis(s.id)).map(s => ({ id: s.id, how: clip(s.how, 160) }));
      const stretch = arr(o.stretch, 3).map(x => clip(x, 140)).filter(Boolean);
      const steps = arr(o.steps, 3).map(x => clip(x, 140)).filter(Boolean);
      return {
        title: clip(o.title, 60) || fb.title, logline: clip(o.logline, 260) || fb.logline, track: trackId, world: clip(o.world, 120) || fb.world,
        cast: cast.length ? cast : fb.cast,
        agent_decides: clip(o.agent_decides, 200) || fb.agent_decides, coordination: clip(o.coordination, 220) || fb.coordination,
        sponsors: sps.length ? sps : fb.sponsors,
        stretch: stretch.length ? stretch : fb.stretch,
        steps: steps.length ? steps : fb.steps,
        _src: o._src
      };
    }
    function asText(i) {
      const t = trackOf(i.track);
      return `${i.title}\n${i.logline}\n\nTrack: ${t.name}\nWorld: ${i.world}\nCast:\n${i.cast.map(c => `- ${c.role}: ${c.goal}`).join("\n")}\nAgents decide: ${i.agent_decides}\nCoordination: ${i.coordination}\nSponsor tools:\n${i.sponsors.map(s => `- ${(H.allSponsors.find(x => x.id === s.id) || {}).name || s.id}: ${s.how}`).join("\n")}\nStretch goals:\n${i.stretch.map(x => "- " + x).join("\n")}\nFirst build steps:\n${i.steps.map((x, k) => `${k + 1}. ${x}`).join("\n")}\n\nSubmit on ${H.submitUrl}`;
    }
    function show(i) {
      const t = trackOf(i.track);
      $("#agOut").innerHTML = `
        <article class="card ag-card" style="--c:${t.hex}">
          <div class="ag-top"><span class="kicker">${t.icon} Track ${t.num} · ${esc(t.short)}${i._src === "offline" && Brain.mode === "llm" ? " · offline fallback" : ""}</span><h3>${esc(i.title)}</h3><p class="ag-log">${esc(i.logline)}</p></div>
          <div class="ag-grid">
            <div><h5>🌍 World</h5><p>${esc(i.world)}</p><h5>🎭 Agent cast</h5><ul class="ag-cast">${i.cast.map(c => `<li><b>${esc(c.role)}</b><span>${esc(c.goal)}</span></li>`).join("")}</ul></div>
            <div><h5>⚡ The agents decide</h5><p>${esc(i.agent_decides)}</p><h5>🔗 How agents coordinate</h5><p>${esc(i.coordination)}</p>
              <h5>🧩 Sponsor tools</h5><div class="ag-sps">${i.sponsors.map(s => { const sp = H.allSponsors.find(x => x.id === s.id) || {}; return `<div class="ag-sp" style="--c:${sp.color}"><span>${sp.icon || "•"}</span><div><b>${esc(sp.name || s.id)}</b><small>${esc(s.how)}</small></div></div>`; }).join("") || `<p class="muted">No sponsor tools for this idea.</p>`}</div></div>
            <div><h5>🚀 Stretch goals</h5><ul class="ag-list">${i.stretch.map(x => `<li>${esc(x)}</li>`).join("")}</ul><h5>🛠️ First build steps</h5><ol class="ag-list">${i.steps.map(x => `<li>${esc(x)}</li>`).join("")}</ol></div>
          </div>
          <div class="ag-btns"><button class="btn btn-sm" data-ag="again">🔁 Another idea</button><button class="btn ghost btn-sm" data-ag="remix">🎛️ Remix this</button><button class="btn ghost btn-sm" data-ag="copy">📋 Copy</button><a class="btn ghost btn-sm" href="${playHref(i.track)}">▶ Try it in the playground</a></div>
        </article>`;
      $("#agOut").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    function renderHist() {
      const h = loadH();
      $("#agHist").innerHTML = h.length ? `<div class="ag-hh"><span class="kicker">Your recent ideas</span><button class="lnk-btn" data-ag="clear">clear</button></div><div class="ag-hl">${h.map((x, k) => { const t = trackOf(x.track); return `<button class="ag-hi" data-h="${k}" style="--c:${t.hex}">${t.icon} ${esc(x.title)}</button>`; }).join("")}</div>` : "";
    }
    function copy(btn) {
      const txt = asText(current);
      const done = () => { btn.textContent = "✓ Copied"; setTimeout(() => (btn.textContent = "📋 Copy"), 1500); };
      const legacy = () => { const ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch {} ta.remove(); done(); };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, legacy); else legacy();
    }
    ai.addEventListener("click", e => {
      const tb = e.target.closest("[data-t]"); if (tb) { setTrack(tb.dataset.t); return; }
      const ex = e.target.closest("#agEx button"); if (ex) { $("#agIn").value = ex.textContent; return; }
      if (e.target.closest("#agGo")) { generate(); return; }
      const a = e.target.closest("[data-ag]");
      if (a) {
        const k = a.dataset.ag;
        if (k === "again") generate();
        else if (k === "remix" && current) generate(current);
        else if (k === "copy" && current) copy(a);
        else if (k === "clear") { saveH([]); renderHist(); }
        return;
      }
      const h = e.target.closest("[data-h]"); if (h) { current = loadH()[+h.dataset.h]; if (current) { setTrack(current.track); show(current); } }
    });
    $("#agIn").addEventListener("keydown", e => { if (e.key === "Enter") generate(); });
    if (genTabs) genTabs.addEventListener("click", e => { const b = e.target.closest("button"); if (b && !busy) setTrack(b.dataset.id); });
    renderHist();
  }

  /* ---------- readiness checklist ---------- */
  const ck = $("#checkRoot");
  if (ck) {
    const C = H.checklist;
    ck.innerHTML = `
      <div class="check-grid">
        <div class="card"><h3>Required (all 5)</h3>${C.must.map((m, i) => `<label class="check"><input type="checkbox" data-k="m${i}"><div><b>${m[0]}</b><span>${m[1]}</span></div></label>`).join("")}</div>
        <div class="card"><h3>Score boosters</h3>${C.bonus.map((m, i) => `<label class="check bonus-c"><input type="checkbox" data-k="b${i}"><div><b>★ ${m[0]}</b><span>${m[1]}</span></div></label>`).join("")}
          <div class="meter"><div class="bar"><div class="fill" id="meterFill"></div></div><div class="status" id="meterStatus"></div></div>
        </div>
      </div>`;
    const update = () => {
      const m = [...ck.querySelectorAll('[data-k^="m"]')].filter(x => x.checked).length;
      const b = [...ck.querySelectorAll('[data-k^="b"]')].filter(x => x.checked).length;
      $("#meterFill").style.width = ((m / C.must.length) * 75 + (b / C.bonus.length) * 25) + "%";
      const stars = `<span class="stars">${"★".repeat(b)}${"☆".repeat(C.bonus.length - b)}</span>`;
      $("#meterStatus").innerHTML = m < C.must.length
        ? `${m}/${C.must.length} required. Not eligible yet. ${stars}`
        : b === C.bonus.length ? `Eligible and fully boosted. Go win this. ${stars}` : `Eligible ✓ Add boosters to score higher. ${stars}`;
    };
    ck.addEventListener("change", update);
    update();
  }
})();

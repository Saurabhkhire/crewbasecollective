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
            ${t.id !== "grow" ? `<a class="btn" style="margin-top:12px" href="/aimultiplayerhackathon-visual/play.html#${t.id}">▶ ${t.id === "film" ? "Direct a film with agents" : "Play against agents"}</a>` : ""}
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

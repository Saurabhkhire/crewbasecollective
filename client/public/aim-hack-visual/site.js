/* Shared behaviour: sponsor modal, home sections, sponsors page */
(function () {
  const H = window.HACK;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const spCount = $("#spCount"); if (spCount) spCount.textContent = H.sponsors.length;
  /* ---------- home: event card + submission steps ---------- */
  const ev = $("#eventCard");
  if (ev && H.event) {
    ev.innerHTML = `<div><small>📅 Date</small><b>${esc(H.event.date)}</b></div><div><small>⏰ Time</small><b>${esc(H.event.time)}</b></div><div><small>📍 Venue</small><b>${esc(H.event.venue)}</b></div><div><small>👥 Teams</small><b>${esc(H.event.format)}</b></div>`;
  }
  const steps = $("#submitSteps");
  if (steps) {
    const url = H.submitUrl || "https://hackathons.crewbasecollective.com", host = url.replace(/^https?:\/\//, "");
    const S = [
      ["🛠️", "Build during the event", `Hack at the ${esc(H.event.venue)} on ${esc(H.event.dateShort)}, ${esc(H.event.time)}. Solo or in a team of up to 4. Pick one track: agent film, multiplayer game, or grow with agents.`],
      ["🚀", "Submit online", `Go to <a href="${url}" target="_blank" rel="noopener">${esc(host)}</a> and create one submission per team before the deadline announced at the event. You can edit it until then.`],
      ["📦", "What to include", `<ul class="sub-list"><li>Project name and a 2–3 sentence description</li><li>Team members (names + emails)</li><li>Chosen track (01 Film · 02 Game · 03 Grow)</li><li>Link to your code repository</li><li><b>A demo video (1–3 min), a live demo link, or both.</b> At least one is required.</li><li>Which sponsor tools you used, and how</li></ul>`],
      ["✅", "Check the judging list", `Judges look for the five must-haves: ${H.checklist.must.map(m => esc(m[0].toLowerCase())).join(", ")}. Bonus points for ${H.checklist.bonus.map(b => esc(b[0])).join(", ")}. <a href="/aim-hack-visual/tracks.html#checklist">Run the eligibility check →</a>`],
      ["🎤", "Demo", `Be ready to show it running at the end of the day (the event wraps at 8:30 PM). If you submitted a live link, keep it running; a video is a good backup.`]
    ];
    steps.innerHTML = S.map((x, i) => `<div class="card sub-step"><span class="sub-n">${i + 1}</span><span class="sub-ic">${x[0]}</span><h4>${x[1]}</h4><div>${x[2]}</div></div>`).join("");
  }

  /* ---------- sponsor modal ---------- */
  let dlg;
  const mascotSvg = (id, o) => window.Mascots ? Mascots.svg(id, o) : "";
  window.openSponsor = function (id) {
    const s = H.sponsors.find(x => x.id === id), p = !s && (H.partners || []).find(x => x.id === id);
    const o = s || p;
    if (!o) return;
    const m = o.mascot || {};
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "sp-modal";
      document.body.appendChild(dlg);
      dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
    }
    dlg.style.setProperty("--c", o.color);
    dlg.innerHTML = `
      <button class="close" aria-label="Close">✕</button>
      <div class="m-row"><div class="org-mascot">${mascotSvg(o.id, { act: true, label: m.name })}</div>${o.image ? `<img class="m-pic" src="${o.image}" alt="${esc(m.name || o.name)} mascot artwork">` : ""}</div>
      ${m.name ? `<p class="m-who"><b>${esc(m.name)}</b> · ${esc(m.action || "")}</p>` : ""}
      <span class="lm">${s ? (s.tier === "main" ? "Main sponsor · " : "Sponsor · ") + esc(s.landmark) : "Partner"}</span>
      <h3>${o.icon} ${esc(o.name)}</h3>
      <p>${esc(o.blurb)}</p>
      ${s ? `<div class="use"><b>Idea: how it could fit your build</b>${esc(s.buildIdea)}</div>` : `<div class="use"><b>What they bring to the hackathon</b>${esc(p.brings || "")}</div>`}
      <div class="row">${s ? `<a class="btn btn-sm" data-lab href="/aim-hack-visual/sponsors.html#lab-${s.id}">🧪 Try it in the lab</a>` : ""}
      <a class="btn ${s ? "ghost " : ""}btn-sm" href="${o.url}" target="_blank" rel="noopener">Visit ${esc(o.name)} ↗</a></div>`;
    dlg.querySelector(".close").onclick = () => dlg.close();
    const lab = dlg.querySelector("[data-lab]"); lab && lab.addEventListener("click", () => dlg.close());
    dlg.showModal();
  };

  /* ---------- home: hero LIVE CAST (a short, believable conversation) ---------- */
  const stage = $("#heroStage");
  if (stage && window.LiveCast) {
    const ev = H.event || {};
    LiveCast.mount(stage, {
      scene: { base: "office", time: "sunset", weather: "clear" },
      actors: [{ id: "priya", tag: "Mentor" }, { id: "kit", tag: "First-time hacker" }, { id: "jax", tag: "Engineer" }, { id: "bolt", tag: "AI agent", c: "#c48bff" }],
      script: [
        [0, `Welcome to the ${ev.venue || "AWS Loft"}! Doors at 9:30, demos wrap by 8:30.`, "happy", "wave"],
        [1, "Okay, honest question: is this just another chatbot hackathon?", "thinking", "shrug"],
        [2, "Nope. Agents that move, decide and act on screen. No text boxes.", "determined", "point"],
        [3, "Correct. I am an agent. I decided to attend.", "happy", "nod"],
        [1, "Ha. So what do we actually build?", "happy", "out"],
        [0, "Pick a track: an agent film, a co-op game you create with AI players, or agents that teach and coach you.", "calm", "out"],
        [1, "Game. Can the agents betray me?", "sly", "raise"],
        [3, "Only if you trust me first.", "sly", "shrug"],
        [2, "Log every decision. Judges want to see why an agent did what it did.", "determined", "point"],
        [0, "Teams up to four. Submit on hackathons.crewbasecollective.com with a demo video, a live link, or both.", "happy", "nod"],
        [1, "Then let's start building!", "happy", "jump"]
      ]
    });
  }

  /* ---------- home: try-it cards ---------- */
  const tryEl = $("#homeTry");
  if (tryEl && window.Puppet && window.Scenes && window.PLAY) {
    const CARDS = [
      { href: "#film", c: "var(--film)", num: "TRACK 01", t: "Direct an agent film", p: "Pick a cast and a scene, write one opening line, and watch 10–20 scenes unfold. The agents decide the ending.", go: "Make a film", scene: { base: "manor", time: "night", weather: "rain" }, cast: ["marlowe", "ashford"] },
      { href: "#game", c: "var(--game)", num: "TRACK 02", t: "Create co-op games with agents", p: "Create your own game or pick zombie survival, Snakes & Ladders or Rock-Paper-Scissors, and play it with AI teammates and rivals.", go: "Create a game", scene: { base: "city", time: "night" }, cast: ["kit", "bolt", "hale"] },
      { href: "#grow", c: "var(--grow)", num: "TRACK 03", t: "Grow with agents", p: "Agents tutor, coach, test and interview you: a language café, a pitch, an exam or a job interview, with a verdict backed by evidence.", go: "Start a session", scene: { base: "boardroom", time: "day" }, cast: ["priya", "okafor"] },
      { href: "#studio", c: "#c48bff", num: "STUDIO", t: "Create characters & scenes", p: "Design a character by hand, or describe one and let an AI agent create it. Same for scenes.", go: "Open the studio", scene: { base: "lab", time: "night" }, cast: ["zorp", "merlin"] }
    ];
    tryEl.innerHTML = CARDS.map(x => `
      <a class="card try2" href="/aim-hack-visual/play.html${x.href}" style="--c:${x.c}">
        <div class="try2-art">${Scenes.svg(x.scene)}<div class="try2-cast">${x.cast.map(() => `<div class="try2-pup"></div>`).join("")}</div></div>
        <div class="try2-body"><span class="num">${x.num}</span><h3>${esc(x.t)}</h3><p>${esc(x.p)}</p><span class="go">${esc(x.go)} →</span></div>
      </a>`).join("");
    [...tryEl.querySelectorAll(".try2")].forEach((card, i) => card.querySelectorAll(".try2-pup").forEach((el, j) => Puppet.mount(el, PLAY.characters.find(c => c.id === CARDS[i].cast[j]))));
  }


  /* ---------- home: track cards ---------- */
  const homeTracks = $("#homeTracks");
  if (homeTracks) {
    homeTracks.innerHTML = H.tracks.map(t => `
      <a class="card track-card" href="/aim-hack-visual/tracks.html#${t.id}" style="--c:${t.hex}">
        <span class="num">TRACK ${t.num} · ${t.island.toUpperCase()}</span>
        <span class="ico">${t.icon}</span>
        <h3>${esc(t.name)}</h3>
        <p class="tl">${esc(t.tagline)}</p>
        <p>${esc(t.pitch.split(". ")[0])}.</p>
        <ul>${t.ideas.slice(0, 3).map(i => `<li><b>${esc(i.t)}</b>: ${esc(i.log)}</li>`).join("")}</ul>
        <span class="more">See all ${t.ideas.length} ideas →</span>
      </a>`).join("");
  }

  /* ---------- home: requirements ---------- */
  const homeReq = $("#homeReq");
  if (homeReq) {
    homeReq.innerHTML =
      `<div class="req-grid">${H.checklist.must.map((m, i) => `<div class="card req"><span class="n">0${i + 1} · REQUIRED</span><h4>${m[0]}</h4><p>${m[1]}</p></div>`).join("")}</div>
       <div class="bonus-row">${H.checklist.bonus.map(b => `<div class="card req bonus"><span class="n">★ SCORES HIGHER</span><h4>${b[0]}</h4><p>${b[1]}</p></div>`).join("")}</div>`;
  }

  /* ---------- home: partners (own section, different look from the sponsor tiles) ---------- */
  const homePt = $("#homePartners");
  if (homePt) {
    homePt.innerHTML = (H.partners || []).map(p => `
      <button class="card pt-tile" style="--c:${p.color}" data-sp="${p.id}">
        <span class="pt-stage"><span class="org-mascot">${mascotSvg(p.id, { act: true })}</span></span>
        <span class="pt-txt"><b>${p.icon} ${esc(p.name)}</b><small>${esc((p.mascot || {}).name || "")}</small><i>${esc(p.brings || "")}</i></span>
      </button>`).join("");
    homePt.addEventListener("click", e => { const b = e.target.closest("[data-sp]"); b && window.openSponsor(b.dataset.sp); });
  }

  /* ---------- sponsor strip (home) ---------- */
  const strip = $("#homeSponsors");
  if (strip) {
    strip.innerHTML = H.sponsors.map(s => `
      <button class="card sp-tile ${s.tier === "main" ? "main" : ""}" style="--c:${s.color}" data-sp="${s.id}" title="${esc((s.mascot || {}).name || "")}">
        <span class="org-mascot">${mascotSvg(s.id)}</span><b>${esc(s.name)}</b><small>${s.tier === "main" ? "Main sponsor" : "Sponsor"}</small>
      </button>`).join("");
    strip.addEventListener("click", e => { const b = e.target.closest("[data-sp]"); b && window.openSponsor(b.dataset.sp); });
  }

  /* ---------- sponsors page ---------- */
  const spGrid = $("#spGrid");
  if (spGrid) {
    const main = H.sponsors.filter(s => s.tier === "main");
    const rest = H.sponsors.filter(s => s.tier !== "main");
    spGrid.innerHTML =
      main.map(s => `
        <div class="card sp-featured" style="--c:${s.color}">
          <div class="badge m-stage" style="width:200px;height:auto;font-size:0"><div class="org-mascot">${mascotSvg(s.id, { act: true })}</div></div>
          <div><span class="kicker">Main sponsor · ${esc(s.landmark)}</span><h3>${esc(s.name)}</h3><p>${esc(s.blurb)}</p>
          <div class="use"><b>Idea: how it could fit your build</b>${esc(s.buildIdea)}</div>
          <p style="margin-top:14px"><a class="lnk" href="${s.url}" target="_blank" rel="noopener">${s.url.replace(/^https?:\/\//, "")} ↗</a></p></div>
        </div>`).join("") +
      `<div class="sp-cards">${rest.map(s => `
        <div class="card sp-card" style="--c:${s.color}">
          <div class="m-stage"><div class="org-mascot">${mascotSvg(s.id, { act: true })}</div></div>
          <div class="hd"><span class="i">${s.icon}</span><div><h3>${esc(s.name)}</h3><span class="lm">${esc(s.landmark)}</span></div></div>
          ${s.mascot ? `<span class="m-name">${esc(s.mascot.name)}</span><p class="m-does">${esc(s.mascot.action)}</p>` : ""}
          <p>${esc(s.blurb)}</p>
          <div class="use"><b>Idea: how it could fit your build</b>${esc(s.buildIdea)}</div>
          <a class="lnk" href="${s.url}" target="_blank" rel="noopener">${s.url.replace(/^https?:\/\//, "")} ↗</a>
        </div>`).join("")}</div>`;
  }
  /* ---------- partners page: one big row per partner ---------- */
  const ptFeat = $("#ptFeature");
  if (ptFeat) {
    const island = id => id === "center" ? "the AWS Loft town hall" : ((H.tracks.find(t => t.id === id) || {}).island || "the islands");
    ptFeat.innerHTML = (H.partners || []).map((p, i) => { const m = p.mascot || {}; return `
      <article class="pf ${i % 2 ? "flip" : ""}" style="--c:${p.color}" id="p-${p.id}">
        <div class="pf-stage" data-scene="${esc(JSON.stringify(p.scene || { base: "office", time: "day" }))}">
          <div class="pf-m">${mascotSvg(p.id, { act: true, label: m.name })}</div>
          ${p.image ? `<img class="pf-pic" src="${p.image}" alt="${esc(m.name || p.name)} artwork">` : ""}
          <span class="pf-where">📍 Find ${esc(m.name || p.name)} on ${esc(island(m.home))}</span>
        </div>
        <div class="pf-body">
          <span class="kind">Partner</span>
          <h3>${p.icon} ${esc(p.name)}</h3>
          ${m.name ? `<p class="pf-who"><b>${esc(m.name)}</b>: ${esc(m.look || "")}</p>` : ""}
          <p>${esc(p.blurb)}</p>
          <div class="brings"><b>What they bring</b>${esc(p.brings || "")}</div>
          ${m.action ? `<div class="brings act"><b>On the map</b>${esc(m.action)}</div>` : ""}
          <a class="btn btn-sm" href="${p.url}" target="_blank" rel="noopener">Visit ${esc(p.name)} ↗</a>
        </div>
      </article>`; }).join("") || `<p class="muted">Partners will be announced soon.</p>`;
    if (window.Scenes) ptFeat.querySelectorAll(".pf-stage").forEach(el => { try { Scenes.mount(el, JSON.parse(el.dataset.scene)); } catch {} });
  }
  const toggle = $("#viewToggle");
  if (toggle) {
    toggle.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      toggle.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
      ["flow", "map", "grid"].forEach(v => { const sec = $("#" + v + "View"); if (sec) sec.hidden = b.dataset.view !== v; });
    });
  }
})();

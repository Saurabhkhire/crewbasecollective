/* Shared behaviour: sponsor modal, home sections, sponsors page */
(function () {
  const H = window.HACK;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- register links ---------- */
  if (H.registerUrl && H.registerUrl !== "#register")
    document.querySelectorAll("[data-register]").forEach(a => (a.href = H.registerUrl));

  /* ---------- sponsor modal ---------- */
  let dlg;
  window.openSponsor = function (id) {
    const s = H.sponsors.find(x => x.id === id);
    if (!s) return;
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "sp-modal";
      document.body.appendChild(dlg);
      dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
    }
    dlg.style.setProperty("--c", s.color);
    dlg.innerHTML = `
      <button class="close" aria-label="Close">✕</button>
      <div class="i">${s.icon}</div>
      <span class="lm">${s.tier === "main" ? "Main sponsor · " : ""}${esc(s.landmark)}</span>
      <h3>${esc(s.name)}</h3>
      <p>${esc(s.blurb)}</p>
      <div class="use"><b>Idea: how it could fit your build</b>${esc(s.buildIdea)}</div>
      <div class="row"><a class="btn btn-sm" data-lab href="/aim-hack-visual/sponsors.html#lab-${s.id}">🧪 Try it in the lab</a>
      <a class="btn ghost btn-sm" href="${s.url}" target="_blank" rel="noopener">Visit ${esc(s.name)} ↗</a></div>`;
    dlg.querySelector(".close").onclick = () => dlg.close();
    dlg.querySelector("[data-lab]").addEventListener("click", () => dlg.close());
    dlg.showModal();
  };

  /* ---------- home: hero cast ---------- */
  const stage = $("#heroStage");
  if (stage && window.Puppet && window.Scenes && window.PLAY) {
    Scenes.mount(stage, { base: "stage", time: "night", weather: "clear" });
    const CAST = [
      { id: "vega", c: "var(--film)", tag: "Track 01 · Film", lines: ["I'll decide how this film ends.", "Nobody scripted this. Not even you.", "Plot twist incoming…"] },
      { id: "bolt", c: "var(--game)", tag: "Track 02 · Games", lines: ["Snakes & Ladders? I never lose.", "Cover me. Zombies at six o'clock!", "Rock, paper… I remember your last move."] },
      { id: "priya", c: "var(--grow)", tag: "Track 03 · Grow", lines: ["Tell me about a project you're proud of.", "Give me a concrete example.", "We'll confer, then you get a verdict."] },
      { id: "zorp", c: "#c48bff", tag: "Studio", lines: ["Describe me and an agent will draw me.", "I was made from one sentence.", "Office, forest or space? Pick a scene."] }
    ];
    stage.insertAdjacentHTML("beforeend", CAST.map((x, i) => `<div class="hs-actor ${i === 0 ? "first" : i === CAST.length - 1 ? "last" : ""}" style="--c:${x.c};--d:${i * 0.18}s;left:${16 + i * 23}%"><div class="hs-bub"></div><div class="hs-pup"></div><span class="hs-t">${esc(x.tag)}</span></div>`).join(""));
    const actors = [...stage.querySelectorAll(".hs-actor")];
    actors.forEach((a, i) => Puppet.mount(a.querySelector(".hs-pup"), PLAY.characters.find(c => c.id === CAST[i].id)));
    let k = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const beat = () => {
      const i = k % CAST.length, a = actors[i], line = CAST[i].lines[Math.floor(k / CAST.length) % CAST[i].lines.length];
      actors.forEach(x => x.classList.remove("on"));
      a.classList.add("on");
      a.querySelector(".hs-bub").textContent = line;
      const pup = a.querySelector(".pup");
      Puppet.talk(pup, 1400 + line.length * 25);
      Puppet.gesture(pup, ["point", "wave", "nod", "raise"][i], 1800);
      Puppet.emotion(pup, ["determined", "sly", "happy", "happy"][i]);
      k++;
    };
    beat();
    if (!reduce) setInterval(beat, 2800);
  }

  /* ---------- home: try-it cards ---------- */
  const tryEl = $("#homeTry");
  if (tryEl && window.Puppet && window.Scenes && window.PLAY) {
    const CARDS = [
      { href: "#film", c: "var(--film)", num: "TRACK 01", t: "Direct an agent film", p: "Pick a cast and a scene, write one opening line, and watch 10–20 scenes unfold. The agents decide the ending.", go: "Make a film", scene: { base: "manor", time: "night", weather: "rain" }, cast: ["marlowe", "ashford"] },
      { href: "#game", c: "var(--game)", num: "TRACK 02", t: "Play games with agents", p: "Zombie survival, Snakes & Ladders, Rock-Paper-Scissors, or build your own, with AI teammates and rivals.", go: "Pick a game", scene: { base: "city", time: "night" }, cast: ["kit", "bolt", "hale"] },
      { href: "#grow", c: "var(--grow)", num: "TRACK 03", t: "Get interviewed by agents", p: "A three-agent panel questions you, confers in private, adapts, and gives a verdict with evidence.", go: "Start a session", scene: { base: "boardroom", time: "day" }, cast: ["priya", "okafor"] },
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

  /* ---------- sponsor strip (home) ---------- */
  const strip = $("#homeSponsors");
  if (strip) {
    strip.innerHTML = H.sponsors.map(s => `
      <button class="card sp-tile ${s.tier === "main" ? "main" : ""}" style="--c:${s.color}" data-sp="${s.id}">
        <span class="i">${s.icon}</span><b>${esc(s.name)}</b><small>${s.tier === "main" ? "Main sponsor" : "Sponsor"}</small>
      </button>`).join("");
    strip.addEventListener("click", e => { const b = e.target.closest("[data-sp]"); b && window.openSponsor(b.dataset.sp); });
  }

  /* ---------- sponsors page ---------- */
  const spList = $("#spList");
  if (spList) {
    spList.innerHTML = H.sponsors.map(s => `
      <button style="--c:${s.color}" data-sp="${s.id}"><span class="i">${s.icon}</span>
        <span><b>${esc(s.name)}</b><small>${esc(s.landmark)}</small></span></button>`).join("");
    spList.addEventListener("click", e => { const b = e.target.closest("[data-sp]"); b && window.openSponsor(b.dataset.sp); });
  }
  const spGrid = $("#spGrid");
  if (spGrid) {
    const main = H.sponsors.filter(s => s.tier === "main");
    const rest = H.sponsors.filter(s => s.tier !== "main");
    spGrid.innerHTML =
      main.map(s => `
        <div class="card sp-featured" style="--c:${s.color}">
          <div class="badge">${s.icon}</div>
          <div><span class="kicker">Main sponsor · ${esc(s.landmark)}</span><h3>${esc(s.name)}</h3><p>${esc(s.blurb)}</p>
          <div class="use"><b>Idea: how it could fit your build</b>${esc(s.buildIdea)}</div>
          <p style="margin-top:14px"><a class="lnk" href="${s.url}" target="_blank" rel="noopener">${s.url.replace(/^https?:\/\//, "")} ↗</a></p></div>
        </div>`).join("") +
      `<div class="sp-cards">${rest.map(s => `
        <div class="card sp-card" style="--c:${s.color}">
          <div class="hd"><span class="i">${s.icon}</span><div><h3>${esc(s.name)}</h3><span class="lm">${esc(s.landmark)}</span></div></div>
          <p>${esc(s.blurb)}</p>
          <div class="use"><b>Idea: how it could fit your build</b>${esc(s.buildIdea)}</div>
          <a class="lnk" href="${s.url}" target="_blank" rel="noopener">${s.url.replace(/^https?:\/\//, "")} ↗</a>
        </div>`).join("")}</div>`;
  }
  const toggle = $("#viewToggle");
  if (toggle) {
    toggle.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      toggle.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
      $("#mapView").hidden = b.dataset.view !== "map";
      $("#gridView").hidden = b.dataset.view !== "grid";
    });
  }
})();

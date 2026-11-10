/* Shared behaviour: sponsor tool settings, sponsor modal, home sections, sponsors page */
(function () {
  const H = window.HACK;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- ⚙️ sponsor tool visibility (nav button on every page) ---------- */
  const TOOL_LINE = { band: "Agent channels: agents message each other along links you draw.", adal: "Images & video: posters, frames and short videos from a sentence.", bruin: "Data & insights: every agent decision into a pipeline and dashboard.", finch: "Skills: reusable abilities you equip on agents, or create with AI.", casuro: "Voice interviews: speak your answers, get evidence-based scores." };
  function openTools() {
    let d = $("#toolsDlg");
    if (!d) { d = document.createElement("dialog"); d.id = "toolsDlg"; d.className = "sp-modal tools-dlg"; document.body.appendChild(d); d.addEventListener("click", e => { if (e.target === d) d.close(); }); }
    const hidden = new Set(H.hiddenSponsors);
    const draw = () => {
      d.innerHTML = `<button class="close" aria-label="Close">✕</button>
        <span class="lm">Sponsor tools</span><h3>Choose which tools to show</h3>
        <p class="muted">Hidden tools disappear from the maps, the Sponsor Labs and the toolbars in every track. Saved in this browser only.</p>
        <div class="tg-list">${H.allSponsors.map(s => `<label class="tg-row" style="--c:${s.color}"><span class="tg-ic">${s.icon}</span><span class="tg-tx"><b>${esc(s.name)}</b><small>${esc(TOOL_LINE[s.id] || s.blurb.split(". ")[0])}</small></span>
          <input type="checkbox" class="tg-sw" data-id="${s.id}" ${hidden.has(s.id) ? "" : "checked"} aria-label="Show ${esc(s.name)}"></label>`).join("")}</div>
        <div class="row tg-btns"><button class="btn ghost btn-sm" data-all="1">Show all</button><button class="btn ghost btn-sm" data-all="0">Hide all</button><span style="flex:1"></span><button class="btn btn-sm" data-save>Save & reload</button></div>`;
      d.querySelector(".close").onclick = () => d.close();
    };
    draw();
    d.onchange = e => { const c = e.target.closest(".tg-sw"); if (c) c.checked ? hidden.delete(c.dataset.id) : hidden.add(c.dataset.id); };
    d.onclick = e => {
      if (e.target === d) return d.close();
      const a = e.target.closest("[data-all]"); if (a) { H.allSponsors.forEach(s => (a.dataset.all === "1" ? hidden.delete(s.id) : hidden.add(s.id))); draw(); return; }
      if (e.target.closest("[data-save]")) { H.setHiddenSponsors([...hidden]); location.reload(); }
    };
    if (!d.open) d.showModal();
  }
  window.openSponsorTools = openTools;
  const navEl = document.querySelector(".nav nav");
  if (navEl && H.allSponsors) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "nav-tools"; b.title = "Choose which sponsor tools to show";
    b.innerHTML = `⚙️ <span class="hide-xs">Tools</span>${H.hiddenSponsors.length ? `<i>${H.allSponsors.length - H.hiddenSponsors.length}/${H.allSponsors.length}</i>` : ""}`;
    b.onclick = openTools;
    const submit = navEl.querySelector(".nav-submit");
    navEl.insertBefore(b, submit || null);
  }
  document.addEventListener("click", e => { const t = e.target.closest("[data-open-tools]"); if (t) { e.preventDefault(); openTools(); } });

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

  /* ---------- home: hero LIVE CAST (a short, believable conversation) ---------- */
  const stage = $("#heroStage");
  if (stage && window.Puppet && window.Scenes && window.PLAY) {
    Scenes.mount(stage, { base: "office", time: "sunset", weather: "clear" });
    const CAST = [
      { id: "priya", x: 18, c: "var(--grow)", tag: "Mentor" },
      { id: "kit", x: 40, c: "var(--game)", tag: "First-time hacker" },
      { id: "jax", x: 62, c: "var(--film)", tag: "Engineer" },
      { id: "bolt", x: 83, c: "#c48bff", tag: "AI agent" }
    ];
    const ev = H.event || {};
    const SCRIPT = [
      [0, `Welcome to the ${ev.venue || "AWS Loft"}! Doors at 9:30, demos wrap by 8:30.`, "happy", "wave"],
      [1, "Okay, honest question: is this just another chatbot hackathon?", "thinking", "shrug"],
      [2, "Nope. Agents that move, decide and act on screen. No text boxes.", "determined", "point"],
      [3, "Correct. I am an agent. I decided to attend.", "happy", "nod"],
      [1, "Ha. So what do we actually build?", "happy", "out"],
      [0, "Pick a track: an agent film, a game with AI players, or agents that coach you.", "calm", "out"],
      [1, "Game. Can the agents betray me?", "sly", "raise"],
      [3, "Only if you trust me first.", "sly", "shrug"],
      [2, "Log every decision. Judges want to see why an agent did what it did.", "determined", "point"],
      [0, "Teams up to four. Submit on hackathons.crewbasecollective.com with a demo video, a live link, or both.", "happy", "nod"],
      [1, "Then let's start building!", "happy", "jump"]
    ];
    stage.insertAdjacentHTML("beforeend", `
      <div class="hs-light"></div>
      <div class="hs-cam">${CAST.map((x, i) => `<div class="hs-actor" style="--c:${x.c};--d:${i * 0.15}s;left:${x.x}%"><div class="hs-pup"></div><span class="hs-t">${esc(PLAY.characters.find(c => c.id === x.id).name.split(" ")[0])}</span></div>`).join("")}</div>
      <div class="hs-sub" aria-live="polite"><b class="hs-who"></b><span class="hs-line"></span></div>`);
    const actors = [...stage.querySelectorAll(".hs-actor")];
    const pups = actors.map((a, i) => { Puppet.mount(a.querySelector(".hs-pup"), PLAY.characters.find(c => c.id === CAST[i].id)); return a.querySelector(".pup"); });
    const who = stage.querySelector(".hs-who"), lineEl = stage.querySelector(".hs-line"), cam = stage.querySelector(".hs-cam"), light = stage.querySelector(".hs-light");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let k = 0, typer = null;
    const beat = () => {
      const [i, text, emo, gest] = SCRIPT[k % SCRIPT.length];
      const sx = CAST[i].x;
      actors.forEach((a, j) => {
        a.classList.toggle("on", j === i);
        if (j !== i) {
          Puppet.face(pups[j], CAST[j].x > sx ? -1 : 1);   // listeners turn to the speaker
          Puppet.emotion(pups[j], Math.random() < 0.5 ? "neutral" : "calm");
        }
      });
      Puppet.face(pups[i], sx > 50 ? -1 : 1);
      Puppet.emotion(pups[i], emo);
      Puppet.gesture(pups[i], gest, 1800);
      const talkMs = Math.min(3600, 900 + text.length * 32);
      Puppet.talk(pups[i], talkMs);
      // a listener reacts halfway through
      const listener = (i + 1 + (k % 3)) % CAST.length;
      if (listener !== i) setTimeout(() => Puppet.gesture(pups[listener], ["nod", "nod", "shrug"][k % 3], 1200), talkMs * 0.55);
      stage.style.setProperty("--sx", sx + "%");
      light.style.left = sx + "%";
      if (!reduce) cam.style.transform = `scale(1.045) translateX(${(50 - sx) * 0.06}%)`;
      who.textContent = PLAY.characters.find(c => c.id === CAST[i].id).name.split(" ")[0] + " · " + CAST[i].tag;
      who.style.color = CAST[i].c;
      clearInterval(typer);
      if (reduce) lineEl.textContent = text;
      else { let n = 0; lineEl.textContent = ""; typer = setInterval(() => { n += 2; lineEl.textContent = text.slice(0, n); if (n >= text.length) clearInterval(typer); }, 28); }
      k++;
      setTimeout(beat, talkMs + 1500);
    };
    setTimeout(beat, 900);
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
      ["flow", "map", "grid"].forEach(v => { const sec = $("#" + v + "View"); if (sec) sec.hidden = b.dataset.view !== v; });
    });
  }
})();

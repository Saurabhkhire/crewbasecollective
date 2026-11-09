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
      <div class="row"><a class="btn btn-sm" href="${s.url}" target="_blank" rel="noopener">Visit ${esc(s.name)} ↗</a>
      <a class="btn ghost btn-sm" href="/aim-hack-visual/sponsors.html">All sponsors</a></div>`;
    dlg.querySelector(".close").onclick = () => dlg.close();
    dlg.showModal();
  };

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

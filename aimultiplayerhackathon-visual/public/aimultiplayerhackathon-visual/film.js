/* TRACK 1 · Agent Animated Film: cast → story → live stage → ending */
window.Film = (function () {
  const { $, esc, rand, MOOD } = UI;
  const C = "#ff4fa3";
  const STEPS = ["Cast", "Story mode", "Action!", "Ending"];
  const S = {
    cast: PLAY.filmCast.map(c => ({ ...c })),
    selected: [0, 1, 3, 4],
    mode: 0,
    custom: { title: "My Story", setting: "", opening: "", place1: "the door", place2: "the shadows" },
    tone: 0, length: 0, plannedTwist: "",
    endings: (() => { try { return JSON.parse(localStorage.getItem("mpai_endings") || "[]"); } catch { return []; } })(),
    pendingTwist: null
  };
  const saveEndings = () => { try { localStorage.setItem("mpai_endings", JSON.stringify(S.endings.slice(-30))); } catch {} };

  /* ================= STEP 1 · CAST ================= */
  function castScreen() {
    UI.steps(STEPS, 0, C);
    const n = S.selected.length;
    UI.app().innerHTML = `
      <div class="screen-head">
        <div><span class="kicker" style="color:${C}">🎬 Track 01 · Step 1</span><h2>Choose your cast</h2>
        <p class="muted">Pick <b>3 to 5</b> characters. Each one becomes an independent agent with its own personality and a <b>secret goal</b> the others don't know. Click ✏️ to rewrite any character, or create your own.</p></div>
      </div>
      <div class="cast-grid">
        ${S.cast.map((c, i) => {
          const on = S.selected.includes(i);
          return `<div class="card char ${on ? "on" : ""}" data-i="${i}" tabindex="0" role="button" aria-pressed="${on}" style="--c:${C}">
            <button class="edit" data-edit="${i}" title="Edit character" aria-label="Edit ${esc(c.name)}">✏️</button>
            ${on ? `<span class="badge-n">${S.selected.indexOf(i) + 1}</span>` : ""}
            <div class="av">${c.avatar}</div>
            <h4>${esc(c.name)}</h4><span class="role">${esc(c.role)}${c.custom ? " · yours" : ""}</span>
            <p>${esc(c.personality)}</p>
            <p class="secret">🔒 ${esc(c.secret)}</p>
          </div>`;
        }).join("")}
        <button class="card char new" id="newChar"><div class="av">➕</div><h4>Create your own</h4><p>Write a name, personality and secret goal. The agent will play it.</p></button>
      </div>
      <div class="action-bar">
        <span class="muted"><b style="color:${n >= 3 ? "var(--grow)" : "var(--text)"}">${n}</b> / 5 selected ${n < 3 ? `· pick ${3 - n} more` : ""}</span>
        <button class="btn" id="toStory" ${n < 3 ? "disabled" : ""}>Next: story mode →</button>
      </div>`;

    UI.app().querySelectorAll(".char[data-i]").forEach(el => {
      const toggle = e => {
        if (e.target.closest("[data-edit]")) return;
        const i = +el.dataset.i, k = S.selected.indexOf(i);
        if (k >= 0) S.selected.splice(k, 1);
        else if (S.selected.length < 5) S.selected.push(i);
        castScreen();
      };
      el.addEventListener("click", toggle);
      el.addEventListener("keydown", e => e.key === "Enter" && toggle(e));
    });
    UI.app().querySelectorAll("[data-edit]").forEach(b => b.onclick = () => {
      const i = +b.dataset.edit;
      UI.editCharacter(S.cast[i], { kind: "film", onSave: c => { S.cast[i] = c; if (!S.selected.includes(i) && S.selected.length < 5) S.selected.push(i); castScreen(); } });
    });
    $("#newChar").onclick = () => UI.editCharacter(null, { kind: "film", onSave: c => {
      S.cast.push(c);
      if (S.selected.length < 5) S.selected.push(S.cast.length - 1);
      castScreen();
    } });
    $("#toStory").onclick = storyScreen;
  }

  /* ================= STEP 2 · STORY MODE ================= */
  function currentMode() {
    if (S.mode < PLAY.storyModes.length) return PLAY.storyModes[S.mode];
    const c = S.custom;
    return { id: "custom", icon: "✍️", title: c.title || "My Story", theme: "custom", setting: c.setting || "A place nobody expected to be trapped in.", opening: c.opening || "Something goes terribly wrong.",
      spots: [{ label: c.place2 || "the shadows", icon: "🌑", x: 10 }, { label: c.place1 || "the door", icon: "🚪", x: 88 }] };
  }
  function storyScreen() {
    UI.steps(STEPS, 1, C);
    const custom = S.mode === PLAY.storyModes.length;
    const m = currentMode();
    UI.app().innerHTML = `
      <div class="screen-head">
        <div><span class="kicker" style="color:${C}">🎬 Track 01 · Step 2</span><h2>Pick a story mode</h2>
        <p class="muted">You only set the world and the opening event. <b>Everything after that is decided by the agents.</b></p></div>
      </div>
      <div class="mode-grid">
        ${PLAY.storyModes.map((s, i) => `<button class="card mode ${S.mode === i ? "on" : ""}" data-m="${i}" style="--c:${C}">
          <span class="ico">${s.icon}</span><h4>${esc(s.title)}</h4><p>${esc(s.opening)}</p></button>`).join("")}
        <button class="card mode ${custom ? "on" : ""}" data-m="${PLAY.storyModes.length}" style="--c:${C}"><span class="ico">✍️</span><h4>Write your own</h4><p>Your world, your opening event, your key places.</p></button>
      </div>

      <div class="story-cfg">
        <div class="card">
          <h3 class="cfg-h">${m.icon} Scene setup <small>edit anything</small></h3>
          ${custom ? `<label>Story title</label><input id="cTitle" maxlength="40" value="${esc(S.custom.title)}">` : ""}
          <label>Setting</label>
          <textarea id="cSetting" rows="2" maxlength="300">${esc(custom ? S.custom.setting : m.setting)}</textarea>
          <label>Opening event <small>the spark that starts it all</small></label>
          <textarea id="cOpening" rows="2" maxlength="300">${esc(custom ? S.custom.opening : m.opening)}</textarea>
          ${custom ? `<div class="two"><div><label>Key place 1</label><input id="cP1" maxlength="30" value="${esc(S.custom.place1)}"></div><div><label>Key place 2</label><input id="cP2" maxlength="30" value="${esc(S.custom.place2)}"></div></div>` : ""}
        </div>
        <div class="card">
          <h3 class="cfg-h">🎨 Tone</h3>
          <div class="chips sel" id="tones">${PLAY.tones.map((t, i) => `<button class="chip ${S.tone === i ? "on" : ""}" data-t="${i}">${t}</button>`).join("")}</div>
          <h3 class="cfg-h">⏱️ Length</h3>
          <div class="chips sel" id="lens">${PLAY.lengths.map((l, i) => `<button class="chip ${S.length === i ? "on" : ""}" data-l="${i}">${l.label} · ${l.beats} beats</button>`).join("")}</div>
          <h3 class="cfg-h">🌀 Director's twist <small>optional, dropped in halfway</small></h3>
          <textarea id="cTwist" rows="2" maxlength="200" placeholder="e.g. The lights go out and someone screams.">${esc(S.plannedTwist)}</textarea>
        </div>
      </div>

      <div class="card cast-summary">
        <span class="muted">Your cast:</span>
        ${S.selected.map(i => `<span class="mini">${S.cast[i].avatar} ${esc(S.cast[i].name)}</span>`).join("")}
        <a href="#" id="backCast">change</a>
      </div>

      <div class="action-bar">
        <button class="btn ghost" id="back">← Cast</button>
        <button class="btn" id="go">🎬 Action! Let the agents decide</button>
      </div>`;

    const keep = () => {
      const setting = $("#cSetting").value.trim(), opening = $("#cOpening").value.trim();
      if (S.mode === PLAY.storyModes.length) {
        Object.assign(S.custom, { title: $("#cTitle").value.trim(), setting, opening, place1: $("#cP1").value.trim(), place2: $("#cP2").value.trim() });
      } else {
        S.overrides = S.overrides || {};
        S.overrides[S.mode] = { setting, opening };
      }
      S.plannedTwist = $("#cTwist").value.trim();
    };
    UI.app().querySelectorAll("[data-m]").forEach(b => b.onclick = () => { keep(); S.mode = +b.dataset.m; storyScreen(); });
    $("#tones").onclick = e => { const b = e.target.closest("[data-t]"); if (b) { keep(); S.tone = +b.dataset.t; storyScreen(); } };
    $("#lens").onclick = e => { const b = e.target.closest("[data-l]"); if (b) { keep(); S.length = +b.dataset.l; storyScreen(); } };
    $("#back").onclick = () => { keep(); castScreen(); };
    $("#backCast").onclick = e => { e.preventDefault(); keep(); castScreen(); };
    $("#go").onclick = () => { keep(); run(); };
    // restore edits of preset modes
    if (S.overrides && S.overrides[S.mode] && !custom) { $("#cSetting").value = S.overrides[S.mode].setting; $("#cOpening").value = S.overrides[S.mode].opening; }
  }

  /* ================= STEP 3 · STAGE ================= */
  function buildState() {
    const base = currentMode();
    const ov = S.overrides && S.overrides[S.mode];
    const mode = Object.assign({}, base, ov && S.mode < PLAY.storyModes.length ? ov : {});
    const cast = S.selected.map((i, k, arr) => ({
      ...S.cast[i], color: PLAY.colors[k % PLAY.colors.length], vi: k,
      x: 22 + (k * 56) / Math.max(1, arr.length - 1), y: 6 + (k % 2) * 7, mood: "neutral", exited: false
    }));
    return { mode, cast, tone: PLAY.tones[S.tone], beats: PLAY.lengths[S.length].beats, beat: 0, log: [], seed: rand(PLAY.inspiration), twist: null };
  }

  function stageHTML(st) {
    return `
      <div class="stage-wrap">
        <div class="stage theme-${st.mode.theme}" id="stage">
          <div class="stage-top">
            <span class="beat" id="beatLbl">🎬 ${esc(st.mode.title)}</span>
            <span class="src" id="srcLbl">${Brain.mode === "llm" ? "🧠 " + esc(Brain.model) : "🧪 offline agents"}</span>
          </div>
          ${st.mode.spots.map(s => `<div class="spot" style="left:${s.x}%"><span>${s.icon}</span><small>${esc(s.label)}</small></div>`).join("")}
          ${st.cast.map(c => `
            <div class="actor" id="act-${c.vi}" style="--c:${c.color};left:${c.x}%;bottom:${c.y}%">
              <div class="bubble"></div>
              <div class="mood">${MOOD.neutral}</div>
              <div class="head">${c.avatar}</div><div class="body"></div>
              <div class="tag">${esc(c.name)}</div>
            </div>`).join("")}
          <div class="caption" id="caption"></div>
          <div class="title-card" id="titleCard"><small>${esc(st.tone)} · ${st.beats} beats · ${st.cast.length} agents</small><h2>${st.mode.icon} ${esc(st.mode.title)}</h2><p>${esc(st.mode.opening)}</p></div>
          <div class="twist-flash" id="twistFlash"></div>
          <div class="ending" id="ending" hidden></div>
        </div>
        <aside class="stage-log">
          <div class="log-head mono"><span>AGENT DECISION LOG</span><label class="minds"><input type="checkbox" id="showMinds" checked> show thoughts</label></div>
          <ol id="beats"></ol>
        </aside>
      </div>
      <div class="controls">
        <button class="btn ghost btn-sm" id="pause">⏸ Pause</button>
        <button class="btn ghost btn-sm" id="speed">⏩ 1×</button>
        <button class="btn ghost btn-sm" id="voice">${UI.ctl.voice ? "🔊 Voices on" : "🔇 Voices off"}</button>
        <form class="twist-form" id="twistForm"><input id="twistIn" maxlength="160" placeholder="🌀 Throw in a plot twist, e.g. 'The pod has a second seat after all'"><button class="btn btn-sm">Drop it</button></form>
        <button class="btn ghost btn-sm" id="stop">■ Stop</button>
      </div>`;
  }

  async function run() {
    UI.steps(STEPS, 2, C);
    const st = buildState();
    const token = ++UI.ctl.token;
    UI.ctl.paused = false; S.pendingTwist = null;
    UI.app().innerHTML = stageHTML(st);
    bindControls(st);
    try {
      await UI.sleep(2600, token);
      $("#titleCard").classList.add("gone");
      let last = null, lastTarget = null;
      const midTwistAt = Math.floor(st.beats / 2);
      for (st.beat = 0; st.beat < st.beats; st.beat++) {
        await UI.waitWhilePaused(token);
        // twists: live ones from the user, or the planned one at mid-point
        const tw = S.pendingTwist || (st.beat === midTwistAt && S.plannedTwist ? S.plannedTwist : null);
        if (tw) { S.pendingTwist = null; st.twist = tw; st.log.push(`DIRECTOR'S TWIST: ${tw}`); flashTwist(tw); addLog({ twist: tw }); await UI.sleep(1800, token); }

        const alive = st.cast.filter(c => !c.exited);
        const pool = alive.filter(c => c !== last);
        if (!alive.length) break;
        const reactor = pool.find(c => c.name === lastTarget);
        const actor = reactor && Math.random() < 0.6 ? reactor : rand(pool.length ? pool : alive);
        $("#beatLbl").textContent = `🎬 Beat ${st.beat + 1} / ${st.beats}`;
        setMood(actor, "thinking"); el(actor).classList.add("thinking");

        const d = await Brain.filmTurn(actor, st);
        if (token !== UI.ctl.token) return;
        st.twist = null;
        el(actor).classList.remove("thinking");
        apply(st, actor, d);
        st.log.push(`${actor.name}: ${d.action}${d.say ? ` (says: "${d.say}")` : ""}`);
        addLog({ actor, d, beat: st.beat + 1 });
        UI.speak(d.say, actor.vi);
        last = actor; lastTarget = d.target;
        await UI.sleep(2400 + (d.say || "").length * 38, token);
      }
      $("#caption").textContent = "🎬 The narrator is deciding how it ends…";
      $("#caption").classList.add("on");
      const end = await Brain.filmEnding(st);
      if (token !== UI.ctl.token) return;
      showEnding(st, end);
    } catch (e) { if (e.message !== "aborted") console.error(e); }
  }

  const el = c => $("#act-" + c.vi);
  function setMood(c, m) { const e = el(c); if (e) e.querySelector(".mood").textContent = MOOD[m] || MOOD.neutral; }

  function apply(st, actor, d) {
    actor.mood = d.emotion;
    setMood(actor, d.emotion);
    const e = el(actor);
    const clamp = v => Math.max(6, Math.min(92, v));
    const spot = st.mode.spots.find(s => s.label === d.move_to);
    const tgt = st.cast.find(c => c.name === d.move_to);
    if (d.move_to === "exit") { actor.x = 104; actor.exited = true; e.classList.add("exited"); }
    else if (spot) actor.x = clamp(spot.x + (Math.random() * 8 - 4));
    else if (tgt) actor.x = clamp(tgt.x + (actor.x < tgt.x ? -9 : 9));
    else if (d.move_to === "center") actor.x = 44 + Math.random() * 12;
    spread(st, actor);
    e.classList.remove("acting"); void e.offsetWidth; e.classList.add("acting");
    // speech bubble
    st.cast.forEach(c => el(c).querySelector(".bubble").classList.remove("on"));
    if (d.say) { const b = e.querySelector(".bubble"); b.textContent = d.say; b.classList.add("on"); }
    // target reacts
    const t = st.cast.find(c => c.name === d.target);
    if (t && !t.exited) { const te = el(t); te.classList.remove("hit"); void te.offsetWidth; te.classList.add("hit"); }
    const cap = $("#caption"); cap.textContent = d.action; cap.classList.add("on");
  }

  /* keep characters from piling on top of each other: the mover keeps its spot, others shuffle aside */
  function spread(st, mover) {
    const GAP = 12;
    const vis = st.cast.filter(c => !c.exited).sort((a, b) => a.x - b.x || (a === mover ? -1 : 1));
    for (let i = 1; i < vis.length; i++) if (vis[i].x - vis[i - 1].x < GAP) vis[i].x = vis[i - 1].x + GAP;
    const over = vis.length ? vis[vis.length - 1].x - 92 : 0;
    if (over > 0) vis.forEach(c => (c.x -= over));
    for (let i = vis.length - 2; i >= 0; i--) if (vis[i + 1].x - vis[i].x < GAP) vis[i].x = vis[i + 1].x - GAP;
    st.cast.forEach(c => { const e = el(c); if (e) e.style.left = c.x + "%"; });
  }

  function addLog(x) {
    const ol = $("#beats"), li = document.createElement("li");
    if (x.twist) { li.className = "twist"; li.innerHTML = `<b>🌀 DIRECTOR'S TWIST</b><span>${esc(x.twist)}</span>`; }
    else {
      const { actor, d } = x;
      li.innerHTML = `<span class="ts">#${x.beat}</span><span><b style="color:${actor.color}">${actor.avatar} ${esc(actor.name)}</b> ${MOOD[d.emotion] || ""}
        ${d.move_to && d.move_to !== "stay" ? `<span class="mv">→ ${esc(d.move_to)}</span>` : ""}</span>
        <span class="act">${esc(d.action)}</span>
        ${d.say ? `<span class="say">“${esc(d.say)}”</span>` : ""}
        <span class="thought">🔒 ${esc(d.thought)}</span>
        ${d._src === "offline" && Brain.mode === "llm" ? `<span class="warn-s">⚠ LLM failed, used offline brain</span>` : ""}`;
    }
    ol.prepend(li);
  }
  function flashTwist(t) { const f = $("#twistFlash"); f.innerHTML = `<small>DIRECTOR'S TWIST</small>${esc(t)}`; f.classList.remove("on"); void f.offsetWidth; f.classList.add("on"); }

  function bindControls(st) {
    $("#pause").onclick = () => { UI.ctl.paused = !UI.ctl.paused; $("#pause").textContent = UI.ctl.paused ? "▶ Resume" : "⏸ Pause"; if (UI.ctl.paused) UI.stopVoice(); };
    $("#speed").onclick = () => { UI.ctl.speed = UI.ctl.speed === 1 ? 2 : UI.ctl.speed === 2 ? 3 : 1; $("#speed").textContent = `⏩ ${UI.ctl.speed}×`; };
    $("#voice").onclick = () => { UI.ctl.voice = !UI.ctl.voice; $("#voice").textContent = UI.ctl.voice ? "🔊 Voices on" : "🔇 Voices off"; if (!UI.ctl.voice) UI.stopVoice(); };
    $("#twistForm").onsubmit = e => { e.preventDefault(); const v = $("#twistIn").value.trim(); if (!v) return; S.pendingTwist = v; $("#twistIn").value = ""; $("#twistIn").placeholder = "✓ Queued. The agents will react next beat."; };
    $("#stop").onclick = () => { UI.ctl.token++; UI.stopVoice(); storyScreen(); };
    $("#showMinds").onchange = e => $("#beats").classList.toggle("hide-minds", !e.target.checked);
  }

  /* ================= STEP 4 · ENDING ================= */
  function showEnding(st, end) {
    UI.steps(STEPS, 3, C);
    $("#caption").classList.remove("on");
    const key = `${end.ending_type}: ${end.title}`;
    const isNew = !S.endings.some(e => e.key === key);
    S.endings.push({ key, type: end.ending_type, title: end.title, story: st.mode.title });
    saveEndings();
    const count = S.endings.length;
    const box = $("#ending");
    box.hidden = false;
    box.innerHTML = `
      <div class="end-card">
        <span class="end-type">${esc(end.ending_type || "Ending")}</span>
        <small>ENDING #${count}${isNew ? " · NEW ENDING DISCOVERED" : ""}</small>
        <h2>${esc(end.title || "The End")}</h2>
        <p>${esc(end.summary || "")}</p>
        <ul class="fates">${(end.fates || []).map(f => { const c = st.cast.find(x => x.name === f.name); return `<li><span>${c ? c.avatar : "🎭"}</span><b>${esc(f.name)}</b> ${esc(f.fate)}</li>`; }).join("")}</ul>
        ${end.moral ? `<p class="moral">“${esc(end.moral)}”</p>` : ""}
      </div>`;
    UI.speak(end.title + ". " + (end.summary || ""), 0);
    const ctr = UI.app().querySelector(".controls");
    ctr.outerHTML = `
      <div class="after">
        <div class="after-btns">
          <button class="btn" id="again">🔁 Same setup, new run</button>
          <button class="btn ghost" id="toCast">🎭 Change cast</button>
          <button class="btn ghost" id="toStory2">📖 Change story</button>
          <a class="btn ghost" href="#game">🎮 Try Track 2 →</a>
        </div>
        <div class="card collected">
          <h3 class="cfg-h">🏆 Endings collected <small>same agents, different choices, different endings</small></h3>
          <div class="chips">${S.endings.slice().reverse().slice(0, 14).map(e => `<span class="chip end-chip t-${esc(e.type)}">${esc(e.type)} · ${esc(e.title)}</span>`).join("")}</div>
        </div>
      </div>`;
    $("#again").onclick = run;
    $("#toCast").onclick = castScreen;
    $("#toStory2").onclick = storyScreen;
  }

  return { start: castScreen };
})();

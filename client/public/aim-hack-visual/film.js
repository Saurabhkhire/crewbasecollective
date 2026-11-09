/* =========================================================
   TRACK 1 · Agent Animated Film
   Story → Cast → Action! (cinematic stage) → Ending
   Routes: #film · #film/demo (auto-plays a preset) · #film/demo-tools (same, all sponsor tools on)
   Sponsor tools (PLAY.tools.film): band · adal · finch · bruin
   ========================================================= */
window.Film = (function () {
  const { $, esc, rand } = UI;
  const C = "#ff4fa3";
  const STEPS = ["Story", "Cast", "Action!", "Ending"];
  const TONES = ["Thriller", "Comedy", "Noir", "Heartfelt", "Absolute chaos"];
  const EMOTIONS = ["happy", "angry", "scared", "sad", "sly", "shocked", "calm", "determined"];
  const GESTURES = ["none", "point", "wave", "raise", "shrug", "slump", "jump", "nod", "cross", "out"];
  const SKILLS = [
    { id: "Persuade", icon: "🗣️", hint: "talk someone into doing what you want" },
    { id: "Deceive", icon: "🎭", hint: "tell a convincing lie" },
    { id: "Investigate", icon: "🔍", hint: "uncover a hidden clue or secret" },
    { id: "Inspire", icon: "✨", hint: "rally others to act bravely" },
    { id: "Sabotage", icon: "💣", hint: "secretly ruin someone's plan" }
  ];

  const PRESETS = [
    { icon: "🚀", title: "The Last Escape Pod", scenes: ["s-ship"], tone: 0, cast: ["vega", "rook", "imani", "bolt"],
      opening: "The hull breach alarm screams. Ten minutes of air left, and the only escape pod has ONE seat.",
      twist: "The ship's computer reveals that one of them sabotaged the engines on purpose." },
    { icon: "🕯️", title: "Dinner at the Manor", scenes: ["s-manor"], tone: 2, cast: ["marlowe", "ashford", "jax", "kit"],
      opening: "The host collapses face-first into dessert. The doors are locked from the outside.",
      twist: "The lights go out, and when they come back the will is missing." },
    { icon: "🏢", title: "Launch Day", scenes: ["s-office", "s-board"], tone: 1, cast: ["priya", "luna", "jax", "bolt"],
      opening: "Ten minutes before the big product launch, the demo crashes and the investor is already in the lobby.",
      twist: "The investor turns out to be someone's ex." },
    { icon: "🌲", title: "Lost in the Woods", scenes: ["s-forest", "s-snow"], tone: 3, cast: ["kit", "hale", "imani", "zorp"],
      opening: "The hiking guide vanished overnight, leaving only a map with one route circled in red.",
      twist: "Someone has been leaving fresh footprints ahead of them." }
  ];

  const S = {
    story: { title: PRESETS[0].title, opening: PRESETS[0].opening, twist: PRESETS[0].twist, tone: 0, beats: 12 },
    sceneIds: PRESETS[0].scenes.slice(),
    castIds: PRESETS[0].cast.slice(),
    tools: new Set(),
    endings: (() => { try { return JSON.parse(localStorage.getItem("mpai_endings") || "[]"); } catch { return []; } })(),
    pendingTwist: null,
    st: null
  };
  const saveEndings = () => { try { localStorage.setItem("mpai_endings", JSON.stringify(S.endings.slice(-40))); } catch {} };

  /* =========================================================
     STEP 1 · STORY
     ========================================================= */
  function keepStory() {
    const v = id => { const e = $(id); return e ? e.value.trim() : null; };
    if ($("#fTitle")) {
      S.story.title = v("#fTitle") || "Untitled";
      S.story.opening = v("#fOpening");
      S.story.twist = v("#fTwist");
      S.story.beats = +$("#fBeats").value;
    }
  }
  function storyScreen() {
    UI.steps(STEPS, 0, C);
    const s = S.story;
    UI.app().innerHTML = `
      <div class="screen-head"><div><span class="kicker" style="color:${C}">🎬 Track 01 · Step 1</span><h2>Create your story</h2>
        <p class="muted">You only set the stage: where it happens and what happens first. <b>Everything after that is decided by the agents.</b></p></div></div>

      <div class="fm-presets">${PRESETS.map((p, i) => `
        <button class="fm-preset" data-p="${i}" style="--c:${C}">
          <div class="fm-preset-bg">${Scenes.svg(UI.Lib.scene(p.scenes[0]))}</div>
          <span class="fm-preset-t"><b>${p.icon} ${esc(p.title)}</b><small>${esc(p.opening)}</small></span>
        </button>`).join("")}</div>

      <div class="card fm-ai">
        <h3 class="cfg-h">✨ Write it for me <small>one line is enough, an agent writes the setup</small></h3>
        <div class="ai-row"><input id="fIdea" maxlength="200" placeholder="e.g. Rival chefs stuck in a kitchen during a blackout"><button class="btn btn-sm ai" id="fWrite">✨ Write it</button></div>
        <div class="ex-chips">${["Astronauts find a stowaway on Mars", "A heist at a castle during a royal wedding", "Teachers locked in school overnight", "A pop band breaks up on stage", "A detective at a desert motel"].map(x => `<button data-ex="${esc(x)}">${esc(x)}</button>`).join("")}</div>
        <div id="fAiOut"></div>
      </div>

      <div class="fm-form">
        <div class="card">
          <label>Title</label><input id="fTitle" maxlength="60" value="${esc(s.title)}">
          <label>What happens first <small>the spark that starts it all</small></label>
          <textarea id="fOpening" rows="3" maxlength="300" placeholder="e.g. The power goes out and a scream echoes from upstairs.">${esc(s.opening)}</textarea>
          <label>Plot twist <small>optional, dropped in halfway</small></label>
          <input id="fTwist" maxlength="200" value="${esc(s.twist)}" placeholder="e.g. One of them isn't who they say they are.">
        </div>
        <div class="card">
          <label>Tone</label>
          <div class="chips sel" id="fTones">${TONES.map((t, i) => `<button class="chip ${s.tone === i ? "on" : ""}" data-t="${i}">${t}</button>`).join("")}</div>
          <label>Number of scenes <small>each scene is one decision by one agent</small></label>
          <div class="range-row"><input type="range" id="fBeats" min="10" max="20" value="${s.beats}"><output id="fBeatsOut">${s.beats}</output></div>
          <p class="muted fm-note">About ${Math.round(s.beats * 6 / 60)}–${Math.round(s.beats * 9 / 60)} minutes at normal speed.</p>
        </div>
      </div>

      <h3 class="cfg-h fm-h">📍 Where does it happen? <small>pick 1–3 locations, the story moves through them in order</small></h3>
      <div id="fScenes"></div>

      <div id="fTools"></div>
      <div class="action-bar">
        <a class="btn ghost" href="#">← Playground</a>
        <span class="muted">${S.sceneIds.length} location${S.sceneIds.length > 1 ? "s" : ""} · ${s.beats} scenes · ${TONES[s.tone]}</span>
        <button class="btn" id="fNext">Next: choose the cast →</button>
      </div>`;

    UI.scenePicker($("#fScenes"), { selected: S.sceneIds, max: 3, color: C, onChange: () => {} });
    UI.sponsorBar($("#fTools"), "film", S.tools);
    $("#fBeats").oninput = e => { $("#fBeatsOut").textContent = e.target.value; S.story.beats = +e.target.value; };
    $("#fTones").onclick = e => { const b = e.target.closest("[data-t]"); if (!b) return; S.story.tone = +b.dataset.t; $("#fTones").querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === b)); };
    UI.app().querySelectorAll("[data-p]").forEach(b => b.onclick = () => {
      const p = PRESETS[+b.dataset.p];
      Object.assign(S.story, { title: p.title, opening: p.opening, twist: p.twist, tone: p.tone });
      S.sceneIds.splice(0, S.sceneIds.length, ...p.scenes);
      S.castIds.splice(0, S.castIds.length, ...p.cast);
      storyScreen();
      $("#fTitle").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    UI.app().querySelectorAll("[data-ex]").forEach(b => b.onclick = () => { $("#fIdea").value = b.dataset.ex; });
    $("#fWrite").onclick = writeForMe;
    $("#fIdea").onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); writeForMe(); } };
    $("#fNext").onclick = () => { keepStory(); castScreen(); };
  }

  /* ---------- ✨ Write it for me ---------- */
  const BASE_WORDS = [
    ["space", /space|ship|star|mars|moon|planet|astronaut|alien|galax|orbit|rocket/i], ["forest", /forest|wood|camp|hik|tree|jungle/i],
    ["office", /office|startup|work|launch|company|job|boss/i], ["boardroom", /board|investor|ceo|meeting|deal/i],
    ["castle", /castle|king|queen|royal|throne|knight|prince|dragon/i], ["beach", /beach|island|sea|ocean|ship ?wreck|pirate/i],
    ["classroom", /school|class|teacher|student|exam/i], ["courtroom", /court|trial|judge|jury|lawyer/i],
    ["kitchen", /kitchen|chef|restaurant|cook|food|dinner service/i], ["desert", /desert|motel|dune|sand|cowboy|western/i],
    ["snow", /snow|mountain|ski|ice|winter|summit/i], ["stage", /concert|band|stage|singer|music|show/i],
    ["manor", /manor|murder|mansion|mystery|butler|will|inherit/i], ["lab", /lab|science|experiment|scientist|virus/i],
    ["city", /city|street|downtown|heist|bank|night ?club|cop/i], ["park", /park|picnic|pond/i]
  ];
  function guessBases(text) {
    const out = BASE_WORDS.filter(([, re]) => re.test(text)).map(([b]) => b);
    return out.length ? out.slice(0, 2) : ["office"];
  }
  async function writeForMe() {
    const idea = $("#fIdea").value.trim();
    if (!idea) { $("#fIdea").focus(); return; }
    keepStory();
    const sys = `You are a film-development agent. Turn a one-line idea into the SETUP of a short improvised animated film whose plot will be decided by AI characters.
You only write the setup: never the plot or the ending.
Available locations (use ids exactly): ${Scenes.BASES.map(b => `${b.id} (${b.name})`).join(", ")}.
Tones: ${TONES.join(", ")}.
Reply with JSON only: {"title":"max 6 words","opening":"the opening event, 1-2 vivid sentences, present tense","twist":"a mid-story twist, 1 sentence","tone":"one tone","scene_bases":["1 to 3 location ids, in story order"],"why":"one sentence on your choices"}`;
    const fallback = () => {
      const bases = guessBases(idea);
      const words = idea.replace(/^(a|an|the)\s+/i, "").split(/\s+/).slice(0, 5).map(w => w[0].toUpperCase() + w.slice(1));
      return {
        title: words.join(" "),
        opening: `It begins with ${idea.charAt(0).toLowerCase() + idea.slice(1).replace(/\.$/, "")}. Then the lights go out, and everyone realises they are trapped together.`,
        twist: rand(["One of them has been lying about who they are.", "Two of them were secretly working together all along.", "A stranger arrives with news that changes everything.", "The thing they were fighting over turns out to be fake."]),
        tone: /funny|comedy|silly|chaos/i.test(idea) ? "Comedy" : /murder|detective|crime/i.test(idea) ? "Noir" : rand(TONES),
        scene_bases: bases,
        why: `Picked ${bases.join(" and ")} because the idea mentions them; the twist adds a second layer of mistrust.`
      };
    };
    $("#fWrite").disabled = true;
    const out = await UI.aiRun($("#fAiOut"), ["Reading your idea", "Choosing locations", "Writing the opening event", "Planting a twist"],
      Brain.ask(sys, `IDEA: ${idea}`, 0.95, fallback), Brain.mode === "llm" ? "Story agent at work" : "Offline story agent at work");
    $("#fWrite").disabled = false;
    const bases = (Array.isArray(out.scene_bases) ? out.scene_bases : []).filter(b => Scenes.BASES.some(x => x.id === b)).slice(0, 3);
    const use = bases.length ? bases : guessBases(idea);
    const scenes = UI.Lib.scenes();
    const ids = use.map(b => (scenes.find(s => s.base === b) || UI.Lib.saveScene({ name: Scenes.BASES.find(x => x.id === b).name, base: b, time: "day", weather: "clear", desc: Scenes.BASES.find(x => x.id === b).desc })).id);
    Object.assign(S.story, {
      title: Brain.clip(out.title, 60) || "Untitled",
      opening: Brain.clip(out.opening, 300) || S.story.opening,
      twist: Brain.clip(out.twist, 200),
      tone: Math.max(0, TONES.findIndex(t => t.toLowerCase() === String(out.tone || "").toLowerCase()))
    });
    S.sceneIds.splice(0, S.sceneIds.length, ...ids);
    const why = Brain.clip(out.why, 220);
    storyScreen();
    $("#fIdea").value = idea;
    const w = UI.aiWork($("#fAiOut"), ["Reading your idea", "Choosing locations", "Writing the opening event", "Planting a twist"], "Done: the form below is filled in");
    w.done(why || "Setup written. Edit anything you like.");
    document.querySelector(".fm-form").classList.add("fm-glow");
  }

  /* =========================================================
     STEP 2 · CAST
     ========================================================= */
  function castScreen() {
    UI.steps(STEPS, 1, C);
    const n = S.castIds.length;
    UI.app().innerHTML = `
      <div class="screen-head"><div><span class="kicker" style="color:${C}">🎬 Track 01 · Step 2</span><h2>Choose your cast</h2>
        <p class="muted">Pick <b>2 to 5</b> characters. Each becomes an independent AI agent with its own personality and a <b>secret goal</b> nobody else knows.</p></div></div>
      <div id="fCast"></div>
      <div class="card fm-sum">
        <span class="muted">Your story:</span> <b>${esc(S.story.title)}</b>
        ${S.sceneIds.map(id => { const s = UI.Lib.scene(id); return s ? `<span class="mini">📍 ${esc(s.name)}</span>` : ""; }).join("")}
        <span class="mini">${S.story.beats} scenes</span><span class="mini">${TONES[S.story.tone]}</span> <a href="#" id="fBackStory">edit</a>
      </div>
      <div id="fTools"></div>
      <div class="action-bar">
        <button class="btn ghost" id="fBack">← Story</button>
        <span class="muted" id="fCount"><b>${n}</b> / 5 selected</span>
        <button class="btn" id="fGo" ${n < 2 ? "disabled" : ""}>🎬 Action! Let the agents decide</button>
      </div>`;
    const upd = () => { const k = S.castIds.length; $("#fCount").innerHTML = `<b>${k}</b> / 5 selected${k < 2 ? ` · pick ${2 - k} more` : ""}`; $("#fGo").disabled = k < 2; };
    UI.castPicker($("#fCast"), { selected: S.castIds, min: 2, max: 5, color: C, detail: "secret", onChange: upd });
    UI.sponsorBar($("#fTools"), "film", S.tools);
    upd();
    $("#fBack").onclick = storyScreen;
    $("#fBackStory").onclick = e => { e.preventDefault(); storyScreen(); };
    $("#fGo").onclick = run;
  }

  /* =========================================================
     STEP 3 · STAGE
     ========================================================= */
  function buildState() {
    const scenes = S.sceneIds.map(id => UI.Lib.scene(id)).filter(Boolean);
    if (!scenes.length) scenes.push(PLAY.scenes[0]);
    const chars = S.castIds.map(id => UI.Lib.char(id)).filter(Boolean);
    const n = chars.length;
    const skills = SKILLS.slice().sort(() => Math.random() - 0.5);
    const cast = chars.map((c, k) => ({
      ...c, vi: k, color: PLAY.colors[k % PLAY.colors.length], x: slotX(k, n), mood: "neutral", exited: false,
      skill: skills[k % skills.length], inbox: []
    }));
    return {
      title: S.story.title || "Untitled", opening: S.story.opening || "Something goes terribly wrong.", plannedTwist: S.story.twist,
      tone: TONES[S.story.tone], beats: S.story.beats, scenes, cast, beat: 0, act: -1, log: [], seed: rand(PLAY.inspiration), twist: null,
      stats: Object.fromEntries(chars.map(c => [c.name, { lines: 0, actions: 0, skills: 0, dms: 0 }])), moods: [], channel: [], poster: null
    };
  }
  const slotX = (k, n) => n === 1 ? 50 : 16 + (k * 68) / (n - 1);
  const loc = st => st.scenes[Math.max(0, st.act)];
  const tool = id => S.tools.has(id);

  function stageHTML(st) {
    return `
      <div id="fTools"></div>
      <div class="fm-wrap">
        <div class="fm-main">
          <div class="fm-screen" id="fScreen" style="--spd:1">
            <div class="fm-cam" id="fCam">
              <div class="fm-set" id="fSet"></div>
              <svg class="fm-links" id="fLinks" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
              <div class="fm-actors">${st.cast.map(c => `
                <div class="fm-actor" id="fa-${c.vi}" style="--c:${c.color};left:${c.x}%">
                  <div class="fm-bubble"></div>
                  <div class="fm-think">💭</div>
                  <div class="fm-pup"></div>
                  <div class="fm-name">${esc(c.name)}<span class="fm-skill" title="Finch skill: ${esc(c.skill.id)}">${c.skill.icon} ${esc(c.skill.id)}</span></div>
                </div>`).join("")}</div>
            </div>
            <div class="fm-bar top"></div><div class="fm-bar bot"></div>
            <div class="fm-hud"><span id="fBeatLbl">🎬 ${esc(st.title)}</span><span>${UI.srcLabel()}</span></div>
            <div class="fm-narr" id="fNarr"></div>
            <div class="fm-sub" id="fSub"></div>
            <div class="fm-fade" id="fFade"></div>
            <div class="fm-card on" id="fCard"></div>
            <div class="fm-flash" id="fFlash"></div>
            <div class="fm-end" id="fEnd" hidden></div>
          </div>
          <div class="controls">
            <button class="btn ghost btn-sm" id="fPause">⏸ Pause</button>
            <button class="btn ghost btn-sm" id="fSpeed">⏩ ${UI.ctl.speed}×</button>
            <button class="btn ghost btn-sm" id="fVoice">${UI.ctl.voice ? "🔊 Voices on" : "🔇 Voices off"}</button>
            <form class="twist-form" id="fTwistForm"><input id="fTwistIn" maxlength="160" placeholder="🌀 Throw in a plot twist, e.g. 'A second escape pod is found'"><button class="btn btn-sm">Drop it</button></form>
            <button class="btn ghost btn-sm" id="fStop">■ Stop</button>
          </div>
        </div>
        <aside class="fm-side">
          <div class="fm-tabs" id="fTabs"></div>
          <div class="fm-pane" data-pane="log"><div class="log-head mono"><span>AGENT DECISION LOG</span><label class="minds"><input type="checkbox" id="fMinds" checked> thoughts</label></div><ol id="fLog" class="fm-log"></ol></div>
          <div class="fm-pane" data-pane="band" hidden><div class="log-head mono"><span>#band-channel · private</span><span id="fChN">0</span></div><ol id="fChan" class="fm-chan"><li class="empty">Private agent-to-agent messages will appear here.</li></ol></div>
          <div class="fm-pane" data-pane="bruin" hidden><div id="fInsights"></div></div>
        </aside>
      </div>`;
  }

  function tabs() {
    const t = $("#fTabs"); if (!t) return;
    const list = [["log", "📜 Log"]].concat(tool("band") ? [["band", "📡 #band"]] : []).concat(tool("bruin") ? [["bruin", "📊 Insights"]] : []);
    const cur = t.dataset.cur && list.some(x => x[0] === t.dataset.cur) ? t.dataset.cur : "log";
    t.dataset.cur = cur;
    t.innerHTML = list.map(([k, l]) => `<button class="${k === cur ? "on" : ""}" data-k="${k}">${l}</button>`).join("");
    document.querySelectorAll(".fm-pane").forEach(p => (p.hidden = p.dataset.pane !== cur));
    t.onclick = e => { const b = e.target.closest("[data-k]"); if (b) { t.dataset.cur = b.dataset.k; tabs(); } };
  }
  function applyTools(st) {
    const sc = $("#fScreen"); if (!sc) return;
    sc.classList.toggle("finch-on", tool("finch"));
    sc.classList.toggle("band-on", tool("band"));
    tabs();
    if (tool("bruin")) insights(st);
  }

  async function run() {
    UI.steps(STEPS, 2, C);
    const st = (S.st = buildState());
    const token = ++UI.ctl.token;
    UI.ctl.paused = false; S.pendingTwist = null;
    UI.app().innerHTML = stageHTML(st);
    UI.sponsorBar($("#fTools"), "film", S.tools, () => applyTools(st));
    st.cast.forEach(c => { const e = el(c); Puppet.mount(e.querySelector(".fm-pup"), c); Puppet.face(e.querySelector(".fm-pup"), c.x > 50 ? -1 : 1); });
    bindControls(st);
    applyTools(st);
    try {
      // opening title card (+ AdaL poster)
      Scenes.mount($("#fSet"), st.scenes[0]);
      st.act = 0;
      showCard(`<small>${esc(st.tone)} · ${st.beats} scenes · ${st.cast.length} agents</small><h2>${esc(st.title)}</h2><p>${esc(st.opening)}</p>`, true);
      if (tool("adal")) {
        $("#fCard").insertAdjacentHTML("afterbegin", `<div class="fm-poster-slot" id="fPosterSlot"><div class="fm-poster-wait"><b>AdaL</b> is generating your poster<span class="dots3"><i></i><i></i><i></i></span></div></div>`);
        st.poster = await makePoster(st);
        if (token !== UI.ctl.token) return;
        $("#fPosterSlot").innerHTML = posterHTML(st.poster, st);
        await UI.sleep(2200, token);
      }
      await UI.sleep(2600, token);
      await cut(st, 0, token);

      let last = null, lastTarget = null;
      const midTwistAt = Math.floor(st.beats / 2);
      for (st.beat = 0; st.beat < st.beats; st.beat++) {
        await UI.waitWhilePaused(token);
        const act = Math.min(st.scenes.length - 1, Math.floor((st.beat * st.scenes.length) / st.beats));
        if (act !== st.act) await cut(st, act, token);

        const tw = S.pendingTwist || (st.beat === midTwistAt && st.plannedTwist ? st.plannedTwist : null);
        if (tw) { S.pendingTwist = null; st.twist = tw; st.log.push(`DIRECTOR'S TWIST: ${tw}`); flash(`<small>DIRECTOR'S TWIST</small>${esc(tw)}`); addLog({ twist: tw }); await UI.sleep(2200, token); }

        const alive = st.cast.filter(c => !c.exited);
        if (!alive.length) break;
        const pool = alive.filter(c => c !== last);
        const reactor = pool.find(c => c.name === lastTarget);
        const actor = reactor && Math.random() < 0.6 ? reactor : rand(pool.length ? pool : alive);
        $("#fBeatLbl").textContent = `🎬 Scene ${st.beat + 1} / ${st.beats} · ${loc(st).name}`;
        const ae = el(actor); ae.classList.add("thinking");
        Puppet.emotion(pupOf(actor), "thinking");

        const d = await filmTurn(actor, st);
        if (token !== UI.ctl.token) return;
        st.twist = null;
        ae.classList.remove("thinking");
        await perform(st, actor, d, token);
        last = actor; lastTarget = d.target;
      }
      camera(null);
      narr("🎬 The narrator is deciding how it ends…");
      const end = await filmEnding(st);
      if (token !== UI.ctl.token) return;
      if (tool("adal") && !st.poster) st.poster = await makePoster(st);
      if (token !== UI.ctl.token) return;
      showEnding(st, end);
    } catch (e) { if (e.message !== "aborted") console.error(e); }
  }

  const el = c => $("#fa-" + c.vi);
  const pupOf = c => el(c).querySelector(".fm-pup");

  /* location cut: fade to black, swap scene, title card, fade in */
  async function cut(st, act, token) {
    const fade = $("#fFade");
    fade.classList.add("on");
    await UI.sleep(650, token);
    st.act = act;
    const sc = loc(st);
    Scenes.mount($("#fSet"), sc);
    const alive = st.cast.filter(c => !c.exited);
    alive.forEach((c, k) => { c.x = slotX(k, alive.length); const e = el(c); e.style.transition = "none"; e.style.left = c.x + "%"; void e.offsetWidth; e.style.transition = ""; Puppet.face(pupOf(c), c.x > 50 ? -1 : 1); });
    camera(null);
    showCard(`<small>Scene ${st.beat + 1} of ${st.beats}${st.scenes.length > 1 ? ` · Act ${act + 1}` : ""}</small><h2>${esc(sc.name)}</h2><p>${esc(sc.desc || "")}</p>`);
    fade.classList.remove("on");
    await UI.sleep(2000, token);
    hideCard();
    await UI.sleep(500, token);
  }
  function showCard(html, keepPoster) {
    const c = $("#fCard");
    c.innerHTML = `<div class="fm-card-in">${html}</div>`;
    c.classList.add("on");
  }
  const hideCard = () => $("#fCard").classList.remove("on");
  function camera(c) {
    const cam = $("#fCam"); if (!cam) return;
    if (!c) { cam.style.transform = ""; return; }
    cam.style.transformOrigin = `${c.x}% 86%`;
    cam.style.transform = "scale(1.14)";
  }
  function narr(t) { const n = $("#fNarr"); if (!n) return; n.textContent = t; n.classList.toggle("on", !!t); }
  function sub(c, text) {
    const s = $("#fSub"); if (!s) return;
    s.innerHTML = text ? `<b style="color:${c.color}">${esc(c.name)}:</b> “${esc(text)}”` : "";
    s.classList.toggle("on", !!text);
  }
  function flash(html) { const f = $("#fFlash"); f.innerHTML = html; f.classList.remove("on"); void f.offsetWidth; f.classList.add("on"); }

  /* ---------- perform one agent decision on stage ---------- */
  async function perform(st, actor, d, token) {
    const e = el(actor), p = pupOf(actor);
    actor.mood = d.emotion;
    st.moods.push({ c: actor, emo: d.emotion });
    const stt = st.stats[actor.name]; stt.actions++; if (d.say) stt.lines++;

    // movement
    const clamp = v => Math.max(8, Math.min(92, v));
    const tgt = st.cast.find(c => c.name === d.move_to && !c.exited);
    const fromX = actor.x;
    if (d.move_to === "exit") { actor.x = fromX > 50 ? 112 : -12; actor.exited = true; }
    else if (tgt) actor.x = clamp(tgt.x + (actor.x < tgt.x ? -13 : 13));
    else if (d.move_to === "left") actor.x = 14 + Math.random() * 10;
    else if (d.move_to === "right") actor.x = 76 + Math.random() * 10;
    else if (d.move_to === "center") actor.x = 44 + Math.random() * 12;
    if (!actor.exited) spread(st, actor);
    const moved = Math.abs(actor.x - fromX) > 2;
    if (moved) {
      Puppet.face(p, actor.x < fromX ? -1 : 1);
      Puppet.walk(p, true);
    }
    st.cast.forEach(c => { el(c).style.left = c.x + "%"; });
    narr(d.action);
    if (moved) { await UI.sleep(1450, token); Puppet.walk(p, false); }
    if (actor.exited) { e.classList.add("exited"); }

    // face the target, emote, gesture
    const target = st.cast.find(c => c.name === d.target && !c.exited);
    if (target && !actor.exited) Puppet.face(p, target.x < actor.x ? -1 : 1);
    Puppet.emotion(p, d.emotion);
    if (d.gesture && d.gesture !== "none") Puppet.gesture(p, d.gesture, 2400);
    if (!actor.exited) camera(actor);

    // Finch skill
    if (d.skill_used && tool("finch")) {
      stt.skills++;
      e.classList.remove("skill"); void e.offsetWidth; e.classList.add("skill");
      flash(`<small>FINCH SKILL · ${esc(actor.name)}</small>${actor.skill.icon} ${esc(actor.skill.id)}`);
    }

    // speech
    st.cast.forEach(c => el(c).querySelector(".fm-bubble").classList.remove("on"));
    const talkMs = d.say ? 2200 + d.say.length * 45 : 1600;
    if (d.say && !actor.exited) {
      const b = e.querySelector(".fm-bubble"); b.textContent = d.say; b.classList.add("on");
      Puppet.talk(p, Math.min(talkMs, 6000) / UI.ctl.speed);
      sub(actor, d.say);
      UI.speak(d.say, actor.vi);
    } else sub(null, "");

    // target reacts
    if (target) {
      const te = el(target);
      te.classList.remove("hit"); void te.offsetWidth; te.classList.add("hit");
      const react = { angry: "scared", sly: "thinking", happy: "happy", sad: "sad", shocked: "shocked", determined: "determined", scared: "scared", calm: "calm" }[d.emotion] || "shocked";
      setTimeout(() => Puppet.emotion(pupOf(target), react), 500);
    }

    // BAND private message
    let dmLine = "";
    if (tool("band") && d.dm && d.dm_to) {
      const to = st.cast.find(c => c.name === d.dm_to);
      if (to && to !== actor) {
        stt.dms++;
        to.inbox.push(`${actor.name} (privately): ${d.dm}`);
        st.channel.push({ from: actor, to, text: d.dm, beat: st.beat + 1 });
        bandLink(actor, to);
        addChannel(actor, to, d.dm, st);
        dmLine = ` [privately told ${to.name}: "${d.dm}"]`;
      }
    }

    st.log.push(`${actor.name}: ${d.action}${d.say ? ` (says: "${d.say}")` : ""}${d.skill_used && tool("finch") ? ` [uses skill ${actor.skill.id}]` : ""}${dmLine}`);
    addLog({ actor, d, beat: st.beat + 1 });
    if (tool("bruin")) insights(st);
    await UI.sleep(talkMs, token);
    sub(null, ""); narr("");
    camera(null);
  }

  /* keep characters from piling up */
  function spread(st, mover) {
    const GAP = 13;
    const vis = st.cast.filter(c => !c.exited).sort((a, b) => a.x - b.x || (a === mover ? -1 : 1));
    for (let i = 1; i < vis.length; i++) if (vis[i].x - vis[i - 1].x < GAP) vis[i].x = vis[i - 1].x + GAP;
    const over = vis.length ? vis[vis.length - 1].x - 91 : 0;
    if (over > 0) vis.forEach(c => (c.x -= over));
    for (let i = vis.length - 2; i >= 0; i--) if (vis[i + 1].x - vis[i].x < GAP) vis[i].x = vis[i + 1].x - GAP;
  }

  /* BAND: glowing message line between two puppets */
  function bandLink(a, b) {
    const svg = $("#fLinks"); if (!svg) return;
    const y = 66, mid = (a.x + b.x) / 2, lift = 30 + Math.abs(a.x - b.x) * 0.15;
    const id = "bl" + Math.random().toString(36).slice(2, 7);
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "band-link");
    g.innerHTML = `<path id="${id}" d="M${a.x} ${y} Q${mid} ${y - lift} ${b.x} ${y}" fill="none" stroke="#5c8dff" stroke-width="7" stroke-opacity=".25" vector-effect="non-scaling-stroke"/>
      <path d="M${a.x} ${y} Q${mid} ${y - lift} ${b.x} ${y}" fill="none" stroke="#9fc0ff" stroke-width="2.5" stroke-dasharray="6 6" vector-effect="non-scaling-stroke" class="dash"/>
      <circle r="1.1" fill="#fff"><animateMotion dur="1.1s" repeatCount="3" path="M${a.x} ${y} Q${mid} ${y - lift} ${b.x} ${y}"/></circle>`;
    svg.appendChild(g);
    [a, b].forEach(c => { const e = el(c); e.classList.add("linked"); setTimeout(() => e.classList.remove("linked"), 4200 / UI.ctl.speed); });
    setTimeout(() => g.classList.add("gone"), 3800 / UI.ctl.speed);
    setTimeout(() => g.remove(), 4800 / UI.ctl.speed);
  }
  function addChannel(a, b, text, st) {
    const ol = $("#fChan"); if (!ol) return;
    ol.querySelector(".empty")?.remove();
    const li = document.createElement("li");
    li.innerHTML = `<span class="ts">scene ${st.beat + 1}</span><span><b style="color:${a.color}">${esc(a.name)}</b> → <b style="color:${b.color}">${esc(b.name)}</b></span><span class="say">${esc(text)}</span>`;
    ol.prepend(li);
    $("#fChN").textContent = st.channel.length + " msgs";
  }

  function addLog(x) {
    const ol = $("#fLog"); if (!ol) return;
    const li = document.createElement("li");
    if (x.twist) { li.className = "twist"; li.innerHTML = `<b>🌀 DIRECTOR'S TWIST</b><span>${esc(x.twist)}</span>`; }
    else {
      const { actor, d } = x;
      li.innerHTML = `<span class="ts">#${x.beat} · ${esc(loc(S.st).name)}</span>
        <span><b style="color:${actor.color}">${esc(actor.name)}</b> ${UI.MOOD[d.emotion] || ""}${d.move_to && d.move_to !== "stay" ? ` <span class="mv">→ ${esc(d.move_to)}</span>` : ""}
        ${d.skill_used && tool("finch") ? `<span class="sp-badge" style="--c:#ff9f43">${actor.skill.icon} ${esc(actor.skill.id)}</span>` : ""}
        ${d.dm && tool("band") && d.dm_to ? `<span class="sp-badge" style="--c:#5c8dff">📡 DM ${esc(d.dm_to)}</span>` : ""}</span>
        <span class="act">${esc(d.action)}</span>
        ${d.say ? `<span class="say">“${esc(d.say)}”</span>` : ""}
        <span class="thought">🔒 ${esc(d.thought)}</span>
        ${d._src === "offline" && Brain.mode === "llm" ? `<span class="warn-s">⚠ LLM failed, used offline brain</span>` : ""}`;
    }
    ol.prepend(li);
  }

  /* Bruin insights */
  function insights(st) {
    const box = $("#fInsights"); if (!box) return;
    const rows = st.cast.map(c => ({ c, s: st.stats[c.name] }));
    const max = Math.max(1, ...rows.map(r => r.s.actions));
    const types = {};
    S.endings.forEach(e => (types[e.type] = (types[e.type] || 0) + 1));
    const tmax = Math.max(1, ...Object.values(types));
    box.innerHTML = `
      <div class="log-head mono"><span>BRUIN · LIVE INSIGHTS</span><span>scene ${Math.min(st.beat + 1, st.beats)}/${st.beats}</span></div>
      <div class="bi-k">${[["Decisions", st.log.filter(l => !l.startsWith("DIRECTOR")).length], ["Lines", rows.reduce((a, r) => a + r.s.lines, 0)], ["Private DMs", st.channel.length], ["Skills used", rows.reduce((a, r) => a + r.s.skills, 0)]].map(([k, v]) => `<div><b>${v}</b><small>${k}</small></div>`).join("")}</div>
      <h4>Who drives the story</h4>
      <div class="bi-bars">${rows.map(r => `<div class="bi-row"><span>${esc(r.c.name)}</span><div class="bi-bar"><i style="width:${(r.s.actions / max) * 100}%;background:${r.c.color}"></i></div><em>${r.s.actions} acts · ${r.s.lines} lines</em></div>`).join("")}</div>
      <h4>Mood timeline</h4>
      <div class="bi-moods">${st.moods.map(m => `<span title="${esc(m.c.name)}: ${m.emo}" style="border-color:${m.c.color}">${UI.MOOD[m.emo] || "😐"}</span>`).join("") || `<span class="muted">waiting…</span>`}</div>
      <h4>Endings collected <small>${S.endings.length} runs</small></h4>
      <div class="bi-bars">${Object.keys(types).length ? Object.entries(types).sort((a, b) => b[1] - a[1]).map(([t, n]) => `<div class="bi-row"><span>${esc(t)}</span><div class="bi-bar"><i style="width:${(n / tmax) * 100}%"></i></div><em>${n}</em></div>`).join("") : `<p class="muted">Finish a run to start collecting endings.</p>`}</div>`;
  }

  function bindControls(st) {
    $("#fPause").onclick = () => { UI.ctl.paused = !UI.ctl.paused; $("#fPause").textContent = UI.ctl.paused ? "▶ Resume" : "⏸ Pause"; $("#fScreen").classList.toggle("paused", UI.ctl.paused); if (UI.ctl.paused) UI.stopVoice(); };
    $("#fSpeed").onclick = () => { UI.ctl.speed = UI.ctl.speed === 1 ? 2 : UI.ctl.speed === 2 ? 3 : 1; $("#fSpeed").textContent = `⏩ ${UI.ctl.speed}×`; $("#fScreen").style.setProperty("--spd", 1 / UI.ctl.speed); };
    $("#fVoice").onclick = () => { UI.ctl.voice = !UI.ctl.voice; $("#fVoice").textContent = UI.ctl.voice ? "🔊 Voices on" : "🔇 Voices off"; if (!UI.ctl.voice) UI.stopVoice(); };
    $("#fTwistForm").onsubmit = e => { e.preventDefault(); const v = $("#fTwistIn").value.trim(); if (!v) return; S.pendingTwist = v; $("#fTwistIn").value = ""; $("#fTwistIn").placeholder = "✓ Queued. The agents will react next scene."; };
    $("#fStop").onclick = () => { UI.ctl.token++; UI.stopVoice(); castScreen(); };
    $("#fMinds").onchange = e => $("#fLog").classList.toggle("hide-minds", !e.target.checked);
    $("#fScreen").style.setProperty("--spd", 1 / UI.ctl.speed);
  }

  /* =========================================================
     AGENT BRAIN (prompts + offline fallbacks)
     ========================================================= */
  async function filmTurn(actor, st) {
    const here = st.cast.filter(c => c !== actor && !c.exited);
    const others = st.cast.filter(c => c !== actor);
    const places = ["stay", "left", "center", "right", "exit", ...here.map(o => o.name)];
    const k = st.beat + 1, N = st.beats;
    const phase = k <= Math.ceil(N * 0.3) ? "EARLY: react to the situation, reveal who you are, test the others."
      : k < N - 1 ? "MIDDLE: escalate. Form alliances, make accusations, lie, reveal or betray. Pursue your secret goal."
      : "CLIMAX: make a decisive, irreversible move that will shape the ending.";
    const sc = loc(st);
    const band = tool("band"), finch = tool("finch");
    const system = `You are ${actor.name}, the ${actor.role}, an autonomous character in an improvised animated short film. Nobody scripts you: YOU decide what you do.
Personality: ${actor.personality}
Secret goal (private; reveal only if it is dramatically right): ${actor.secret || actor.goal || "survive and come out on top"}
Film tone: ${st.tone}. Current location: ${sc.name}: ${sc.desc || ""}
${finch ? `You have a special SKILL (via Finch): ${actor.skill.id}, the ability to ${actor.skill.hint}. Use it when it matters and set "skill_used": true.\n` : ""}${band ? `You can also send ONE private message through the BAND agent channel to another character ("dm_to" + "dm"). Nobody else sees it. Use it to plot, warn, bribe or confess. Leave both empty if not needed.\n` : ""}Make bold, specific, visual choices that move the plot. Stay in character. Keep it short and cinematic.
Reply with JSON only:
{"thought":"one sentence of private reasoning","action":"what you physically do, third person present tense, max 16 words","say":"your spoken line, max 22 words, may be empty","move_to":"one of: ${places.join(" | ")}","target":"name of the character you act on, or empty","emotion":"one of: ${EMOTIONS.join(", ")}","gesture":"one of: ${GESTURES.join(", ")}"${finch ? `,"skill_used":true|false` : ""}${band ? `,"dm_to":"character name or empty","dm":"private message, max 18 words, or empty"` : ""}}`;
    const user = `OPENING EVENT: ${st.opening}
CHARACTERS:
${st.cast.map(c => `- ${c.name} (${c.role})${c === actor ? " ← YOU" : ""}: mood ${c.mood || "neutral"}${c.exited ? ", has LEFT the story" : ""}`).join("\n")}
STORY SO FAR:
${st.log.length ? st.log.slice(-14).map((l, i) => `${i + 1}. ${l}`).join("\n") : "(nothing yet: you act first)"}
${band && actor.inbox.length ? `\nPRIVATE MESSAGES YOU RECEIVED:\n${actor.inbox.slice(-4).join("\n")}\n` : ""}${st.twist ? `\nDIRECTOR'S TWIST JUST HAPPENED: ${st.twist}\n` : ""}
This is scene ${k} of ${N}. ${phase}
Hidden theme for this run: ${st.seed}.`;
    const out = await Brain.ask(system, user, 1.05, () => mockTurn(actor, st, here.length ? here : others));
    out.thought = Brain.clip(out.thought, 220);
    out.action = Brain.clip(out.action, 160) || `${actor.name} hesitates.`;
    out.say = Brain.clip(out.say, 200);
    out.emotion = EMOTIONS.includes(out.emotion) ? out.emotion : "determined";
    out.gesture = GESTURES.includes(out.gesture) ? out.gesture : GESTURE_FOR[out.emotion] || "none";
    out.move_to = places.includes(out.move_to) ? out.move_to : "stay";
    if (out.move_to === "exit" && st.beat < 2) out.move_to = "stay";
    out.target = others.some(o => o.name === out.target) ? out.target : "";
    out.dm = Brain.clip(out.dm, 160);
    out.dm_to = others.some(o => o.name === out.dm_to) ? out.dm_to : "";
    out.skill_used = !!out.skill_used;
    return out;
  }
  const GESTURE_FOR = { angry: "point", happy: "wave", sad: "slump", scared: "raise", shocked: "raise", sly: "cross", determined: "point", calm: "nod" };

  const FILM_T = {
    early: [
      ["eyes {t} with suspicion", "Nobody move. Somebody here knows more than they're saying.", "sly"],
      ["checks {spot} and frowns", "This is worse than we thought.", "scared"],
      ["takes charge and raises a hand", "Listen to me. Panic gets us killed.", "determined"],
      ["laughs nervously", "Well, this is fine. Totally fine.", "scared"],
      ["quietly studies {t}", "", "calm"]
    ],
    middle: [
      ["accuses {t} in front of everyone", "You did this! I saw you!", "angry"],
      ["pulls {t} aside and whispers a deal", "Help me and you walk out of here. Deal?", "sly"],
      ["confesses part of the truth", "Fine. It's about {secretHint}.", "sad"],
      ["blocks the way to {spot}", "Nobody goes there until we decide together.", "determined"],
      ["secretly pockets something from {t}", "", "sly"],
      ["defends {t} against the others", "Back off. I trust them.", "determined"]
    ],
    climax: [
      ["sprints toward {spot}", "I'm sorry. I have to do this.", "determined"],
      ["sacrifices their chance for {t}", "Go. Someone has to make it out.", "sad"],
      ["reveals the secret to everyone", "The truth is, {secretHint}.", "shocked"],
      ["turns on {t} without warning", "You were never part of my plan.", "angry"],
      ["grabs {t} and refuses to let go", "We all go, or nobody does!", "angry"]
    ]
  };
  const DMS = ["Meet me when the others aren't looking.", "Don't trust {t}. I have proof.", "I know your secret. Help me and I'll keep quiet.", "Follow my lead, whatever happens next.", "If this goes wrong, we were never friends."];
  function mockTurn(actor, st, others) {
    const k = st.beat + 1, N = st.beats;
    const pool = k <= Math.ceil(N * 0.3) ? FILM_T.early : k < N - 1 ? FILM_T.middle : FILM_T.climax;
    const tgt = rand(others);
    const spot = rand(["the door", "the far corner", "the window", "the exit", "the shadows"]);
    const [a, s, emo] = rand(pool);
    const hint = String(actor.secret || actor.goal || "what I really want").split(/[.,]/)[0].toLowerCase();
    const fill = x => x.replace("{t}", tgt.name).replace("{spot}", spot).replace("{secretHint}", hint);
    const moving = /sprint|blocks|checks/.test(a) ? rand(["left", "right"]) : /accuses|pulls|grabs|turns|defends|sacrifices|pockets/.test(a) ? tgt.name : rand(["stay", "center"]);
    const dmT = rand(others);
    return {
      thought: rand([`If ${tgt.name} finds out what I want, I'm finished.`, `${tgt.name} is the weak link. Time to use that.`, `My secret goal matters more than anything right now.`, `I need an ally before this falls apart.`, `The others are scared. Fear is useful.`]),
      action: `${actor.name} ${fill(a)}`, say: fill(s), move_to: moving, target: tgt.name, emotion: emo, gesture: GESTURE_FOR[emo] || "none",
      skill_used: Math.random() < 0.3,
      dm_to: Math.random() < 0.45 ? dmT.name : "", dm: rand(DMS).replace("{t}", rand(others).name)
    };
  }

  async function filmEnding(st) {
    const system = `You are the narrator of an improvised animated short film. The characters were autonomous AI agents. Decide the ending ONLY from what they actually did. Do not invent a happy ending they didn't earn.
Tone: ${st.tone}.
Reply with JSON only:
{"title":"a punchy ending title, max 6 words","ending_type":"one of: Triumph, Tragedy, Betrayal, Bittersweet, Twist, Comedy","summary":"3-4 vivid sentences describing how it ends","fates":[{"name":"character name","fate":"max 14 words"}],"moral":"one-line tagline"}`;
    const user = `TITLE: ${st.title}
LOCATIONS: ${st.scenes.map(s => s.name).join(" → ")}
OPENING: ${st.opening}
CAST: ${st.cast.map(c => `${c.name} (${c.role}; secret: ${c.secret || c.goal || "none"})`).join("; ")}
WHAT THE AGENTS DID:
${st.log.map((l, i) => `${i + 1}. ${l}`).join("\n")}`;
    const out = await Brain.ask(system, user, 0.9, () => mockEnding(st));
    out.fates = Array.isArray(out.fates) ? out.fates.slice(0, 8) : [];
    if (!["Triumph", "Tragedy", "Betrayal", "Bittersweet", "Twist", "Comedy"].includes(out.ending_type)) out.ending_type = "Twist";
    return out;
  }
  const ENDINGS = [
    ["Triumph", "Against All Odds", "In a final desperate push, the survivors pull together. Old lies are forgiven, if not forgotten, and they make it out."],
    ["Tragedy", "Nobody Walks Away", "The arguing lasts one minute too long. By the time anyone acts, it is already over, and the silence says everything."],
    ["Betrayal", "The Knife in the Dark", "The alliance everyone relied on was a lie from the start. One of them walks away with everything, and doesn't look back."],
    ["Bittersweet", "One Seat, One Choice", "Someone chooses to stay behind so the others can go. The rest survive, carrying a debt they can never repay."],
    ["Twist", "It Was Never About Escape", "When the dust settles, the person everyone suspected turns out to be the only one telling the truth."],
    ["Comedy", "Well, That Went Sideways", "Every secret plan collides at once. Somehow, through pure accident, everyone makes it, mostly intact and deeply embarrassed."]
  ];
  const FATES = ["escapes, but at a terrible price", "is left behind, and makes peace with it", "walks away with the prize", "is exposed in front of everyone", "becomes the unlikely hero", "vanishes without a trace", "is forgiven, barely", "finally tells the truth"];
  function mockEnding(st) {
    const e = rand(ENDINGS);
    return { title: e[1], ending_type: e[0], summary: e[2], fates: st.cast.map(c => ({ name: c.name, fate: c.exited ? "left before the end, and never looked back" : rand(FATES) })), moral: rand(["Every secret has a seat on the escape pod.", "Trust is the rarest resource.", "The plan never survives the people."]) };
  }

  /* =========================================================
     AdaL poster
     ========================================================= */
  async function makePoster(st) {
    const sc = st.scenes[0];
    const prompt = `Cinematic poster for an animated short film titled "${st.title}". Stylized colourful 3D cartoon style, dramatic lighting, ${st.tone.toLowerCase()} mood.
Setting: ${sc.name}, ${sc.desc || ""}. Characters: ${st.cast.map(c => `${c.name} the ${c.role}`).join(", ")}.
Story hook: ${st.opening} Compose the characters together in the scene. Title text "${st.title}" at the top. No other text.`;
    const url = await Brain.image(prompt);
    return url ? { url, ai: true } : { url: null, ai: false };
  }
  function posterHTML(p, st) {
    if (p && p.url) return `<figure class="fm-poster"><img src="${p.url}" alt="AI-generated poster for ${esc(st.title)}"><figcaption>🤖 Poster generated by <b>AdaL</b></figcaption></figure>`;
    const n = st.cast.length;
    return `<figure class="fm-poster vec"><div class="fm-poster-art">${Scenes.svg(st.scenes[0])}
        <div class="fm-poster-cast">${st.cast.map((c, i) => `<div style="left:${n === 1 ? 50 : 12 + i * 76 / (n - 1)}%">${Puppet.svg(c)}</div>`).join("")}</div>
        <div class="fm-poster-title">${esc(st.title)}</div></div>
      <figcaption>🎨 Vector poster · AdaL image generation ${Brain.mode === "llm" ? "unavailable right now" : "needs the live AI server"}</figcaption></figure>`;
  }

  /* =========================================================
     STEP 4 · ENDING
     ========================================================= */
  function face(c) { return `<span class="fm-face" style="--c:${c.color}">${Puppet.svg(c)}</span>`; }
  function showEnding(st, end) {
    UI.steps(STEPS, 3, C);
    narr(""); sub(null, "");
    const key = `${end.ending_type}: ${end.title}`;
    const isNew = !S.endings.some(e => e.key === key);
    S.endings.push({ key, type: end.ending_type, title: end.title, story: st.title });
    saveEndings();
    if (tool("bruin")) insights(st);
    const box = $("#fEnd");
    box.hidden = false;
    box.innerHTML = `
      <div class="fm-end-in ${st.poster ? "with-poster" : ""}">
        ${st.poster ? `<div class="fm-end-poster">${posterHTML(st.poster, st)}</div>` : ""}
        <div class="end-card">
          <span class="end-type">${esc(end.ending_type || "Ending")}</span>
          <small>ENDING #${S.endings.length}${isNew ? " · NEW ENDING DISCOVERED" : ""}</small>
          <h2>${esc(end.title || "The End")}</h2>
          <p>${esc(end.summary || "")}</p>
          <ul class="fates">${(end.fates || []).map(f => { const c = st.cast.find(x => x.name === f.name); return `<li>${c ? face(c) : "🎭"}<span><b>${esc(f.name)}</b> ${esc(f.fate)}</span></li>`; }).join("")}</ul>
          ${end.moral ? `<p class="moral">“${esc(end.moral)}”</p>` : ""}
        </div>
      </div>`;
    UI.speak(end.title + ". " + (end.summary || ""), 0);
    const ctr = UI.app().querySelector(".controls");
    ctr.outerHTML = `
      <div class="after">
        <div class="after-btns">
          <button class="btn" id="fAgain">🔁 Same setup, new run</button>
          <button class="btn ghost" id="fToCast">🎭 Change cast</button>
          <button class="btn ghost" id="fToStory">📖 Change story</button>
          <a class="btn ghost" href="#game">🎮 Try Track 2 →</a>
        </div>
        <div class="card collected">
          <h3 class="cfg-h">🏆 Endings collected <small>same agents, different choices, different endings</small></h3>
          <div class="chips">${S.endings.slice().reverse().slice(0, 14).map(e => `<span class="chip end-chip t-${esc(e.type)}">${esc(e.type)} · ${esc(e.title)}</span>`).join("")}</div>
        </div>
      </div>`;
    $("#fAgain").onclick = run;
    $("#fToCast").onclick = castScreen;
    $("#fToStory").onclick = storyScreen;
  }

  /* ---------- entry ---------- */
  function start(sub) {
    if (sub === "demo" || sub === "demo-tools") {
      const p = PRESETS[0];
      Object.assign(S.story, { title: p.title, opening: p.opening, twist: p.twist, tone: p.tone, beats: 10 });
      S.sceneIds.splice(0, S.sceneIds.length, ...p.scenes);
      S.castIds.splice(0, S.castIds.length, ...p.cast);
      if (sub === "demo-tools") ["band", "finch", "bruin", "adal"].forEach(t => S.tools.add(t));
      return run();
    }
    storyScreen();
  }
  return { start };
})();

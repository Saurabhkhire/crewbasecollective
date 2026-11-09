/* =========================================================
   TRACK 2 · Play with Agents — game hub
   Picker → (optional) Create-your-own → Players setup → game engine.
   Engines register themselves (games/zombie.js, games/snakes.js, games/rps.js):
     Games.register({ id, title, icon, color, blurb, rules: [..], agents: "how agents play",
                      minAgents, maxAgents, needsScene, defaults: {...}, start(cfg, root) })
   cfg = { engine, title, agents: [characters], human: {name}, scene, tools: Set, skills: {name: skill},
           difficulty, enemy: {name, emoji}, waves, snakes, ladders, rounds, accent, demo }
   Shared helpers for engines: Games.shell(cfg, opts) builds the play screen with
   decision log, BAND radio, Bruin stats, sponsor bar, and returns an API.
   ========================================================= */
window.Games = (function () {
  const { $, esc } = UI;
  const C = "#3ee6ff";
  const ENGINES = {};
  const ORDER = ["zombie", "snakes", "rps"];
  const S = {
    agents: {},           // engine id → selected character ids
    scene: {},            // engine id → [scene id]
    human: (() => { try { return localStorage.getItem("aimp_player") || "You"; } catch { return "You"; } })(),
    tools: new Set(),
    draft: null
  };

  const loadGames = () => { try { return JSON.parse(localStorage.getItem("aimp_games") || "[]"); } catch { return []; } };
  const saveGames = g => { try { localStorage.setItem("aimp_games", JSON.stringify(g.slice(0, 20))); } catch {} };

  /* ---------- Finch skills per engine ---------- */
  const SKILLS = {
    zombie: [
      { id: "medic", icon: "💉", name: "Medic", does: "Slowly heals teammates nearby." },
      { id: "sharp", icon: "🎯", name: "Sharpshooter", does: "Fires 60% faster, longer range." },
      { id: "tank", icon: "🛡️", name: "Tank", does: "+60% max health." },
      { id: "scout", icon: "👟", name: "Scout", does: "Moves 35% faster, revives faster." }
    ],
    snakes: [
      { id: "lucky", icon: "🍀", name: "Lucky", does: "Rolls of 1 or 2 get +1." },
      { id: "climber", icon: "🧗", name: "Climber", does: "Ladders lift you 3 squares further." },
      { id: "slippery", icon: "🧈", name: "Slippery", does: "Snakes only drop you half the way." }
    ],
    rps: [
      { id: "psychic", icon: "🔮", name: "Psychic", does: "Reads your patterns much more accurately." },
      { id: "bluffer", icon: "🃏", name: "Bluffer", does: "Taunts hint at a throw it won't play." },
      { id: "stubborn", icon: "🪨", name: "Stubborn", does: "Repeats winning throws, never panics." }
    ]
  };
  function assignSkills(engine, agents) {
    const list = SKILLS[engine] || [];
    const out = {};
    agents.forEach((a, i) => { out[a.name] = list[i % list.length]; });
    return out;
  }

  /* =========================================================
     PICKER
     ========================================================= */
  function picker() {
    UI.steps(["Game", "Players", "Play"], 0, C);
    const mine = loadGames();
    UI.app().innerHTML = `
      <div class="screen-head"><div><span class="kicker" style="color:${C}">🎮 Track 02 · Play with Agents</span>
        <h2>Pick a game</h2>
        <p class="muted">Simple games where <b>AI agents are real players</b>: they make their own choices, talk to each other and to you, and remember what you did.</p></div></div>
      <div class="gm-pick">
        ${ORDER.filter(id => ENGINES[id]).map(id => { const e = ENGINES[id]; return `
          <div class="card gm-card" style="--c:${e.color}">
            <div class="gm-card-art art-${id}"><span>${e.icon}</span></div>
            <h3>${esc(e.title)}</h3>
            <p class="gm-one">${esc(e.blurb)}</p>
            <ul class="gm-rules">${e.rules.map(r => `<li>${esc(r)}</li>`).join("")}</ul>
            <p class="gm-how"><b>🤖 How agents play:</b> ${esc(e.agents)}</p>
            <a class="btn" href="#game/${id}">▶ Play</a>
          </div>`; }).join("")}
        <div class="card gm-card gm-new" style="--c:#c48bff">
          <div class="gm-card-art art-new"><span>➕</span></div>
          <h3>Create your own game</h3>
          <p class="gm-one">Pick an engine, name it, theme it, or just describe it and let an AI agent design it.</p>
          <ul class="gm-rules"><li>Shooter, board race or duel</li><li>Your enemies, your world, your rules</li><li>Saved here for next time</li></ul>
          <p class="gm-how"><b>🤖 How agents help:</b> an agent turns one sentence into a playable game.</p>
          <a class="btn" href="#game/custom">✨ Create a game</a>
        </div>
      </div>
      ${mine.length ? `<h3 class="gm-sub">🗂️ Your games</h3><div class="gm-mine">${mine.map(g => `
        <div class="card gm-mine-card" style="--c:${g.accent || "#c48bff"}">
          <div class="gm-cover" data-cover="${esc(g.id)}">${coverHTML(g)}</div>
          <div class="gm-mine-b"><b>${esc(g.title)}</b><small>${esc(ENGINES[g.engine] ? ENGINES[g.engine].title : g.engine)} · ${esc(g.difficulty || "normal")}</small>
          <p>${esc(g.desc || "")}</p>
          <div class="row"><button class="btn btn-sm" data-play="${esc(g.id)}">▶ Play</button><button class="btn ghost btn-sm" data-edit="${esc(g.id)}">✏️ Edit</button><button class="btn ghost btn-sm" data-del="${esc(g.id)}" aria-label="Delete">🗑</button></div></div>
        </div>`).join("")}</div>` : ""}`;
    UI.app().querySelectorAll("[data-play]").forEach(b => b.onclick = () => { const g = loadGames().find(x => x.id === b.dataset.play); if (g) setup(g.engine, g); });
    UI.app().querySelectorAll("[data-edit]").forEach(b => b.onclick = () => { const g = loadGames().find(x => x.id === b.dataset.edit); if (g) creator(g); });
    UI.app().querySelectorAll("[data-del]").forEach(b => b.onclick = () => { saveGames(loadGames().filter(x => x.id !== b.dataset.del)); picker(); });
    UI.app().querySelectorAll("[data-cover]").forEach(el => { const g = mine.find(x => x.id === el.dataset.cover); if (g && !g.cover) mountCoverPuppets(el, g); });
  }

  function coverHTML(g) {
    if (g.cover) return `<img src="${g.cover}" alt="">`;
    const sc = sceneOf(g);
    return `<div class="cv-bg">${Scenes.svg(sc)}</div><div class="cv-pups"></div><div class="cv-t"><span>${esc(g.enemy && g.enemy.emoji || ENGINES[g.engine]?.icon || "🎮")}</span>${esc(g.title)}</div>`;
  }
  function mountCoverPuppets(el, g) {
    const box = el.querySelector(".cv-pups"); if (!box) return;
    const ids = (g.agents && g.agents.length ? g.agents : ["kit", "bolt", "luna"]).slice(0, 3);
    ids.forEach(id => { const c = UI.Lib.char(id); if (!c) return; const d = document.createElement("div"); box.appendChild(d); Puppet.mount(d, c); });
  }
  function sceneOf(cfg) {
    if (cfg.scene && cfg.scene.base) return cfg.scene;
    if (cfg.sceneId) { const s = UI.Lib.scene(cfg.sceneId); if (s) return s; }
    const e = ENGINES[cfg.engine];
    return UI.Lib.scene((e && e.defaults.sceneId) || "s-city") || { base: "city", time: "night", weather: "clear" };
  }

  /* =========================================================
     PLAYERS SETUP (shared by all engines)
     ========================================================= */
  function setup(engineId, custom, demo) {
    const e = ENGINES[engineId];
    if (!e) return picker();
    const base = Object.assign({ engine: engineId }, e.defaults, custom || {});
    const key = custom ? custom.id : engineId;
    if (!S.agents[key]) S.agents[key] = (custom && custom.agents && custom.agents.length ? custom.agents : e.defaults.agents).slice(0, e.maxAgents);
    if (!S.scene[key]) S.scene[key] = [base.sceneId || e.defaults.sceneId || "s-city"];
    const sel = S.agents[key], scSel = S.scene[key];

    const go = () => {
      const agents = sel.map(id => UI.Lib.char(id)).filter(Boolean);
      if (agents.length < e.minAgents) return;
      try { localStorage.setItem("aimp_player", S.human); } catch {}
      const cfg = Object.assign({}, base, {
        title: base.title || e.title,
        agents, human: { name: S.human || "You" },
        scene: (custom && custom.scene && custom.scene.base && !scSel.length) ? custom.scene : (UI.Lib.scene(scSel[0]) || sceneOf(base)),
        tools: S.tools, skills: assignSkills(engineId, agents), demo: !!demo
      });
      UI.steps(["Game", "Players", "Play"], 2, C);
      UI.ctl.token++; UI.ctl.paused = false;
      e.start(cfg);
    };
    if (demo) return go();

    UI.steps(["Game", "Players", "Play"], 1, C);
    UI.app().innerHTML = `
      <div class="screen-head"><div><span class="kicker" style="color:${e.color}">${e.icon} ${esc(base.title || e.title)}</span>
        <h2>Who's playing?</h2>
        <p class="muted">Pick <b>${e.minAgents === e.maxAgents ? e.maxAgents : `${e.minAgents}–${e.maxAgents}`}</b> AI agents ${engineId === "zombie" ? "to fight beside you" : "to play against you"}. Each one plays from its own personality and goal. Characters you made in the Studio show up here too.</p></div></div>
      <div class="gm-setup">
        <div class="card gm-rulebox" style="--c:${e.color}">
          <h3 class="cfg-h">📜 Rules</h3><ul class="gm-rules">${(base.rulesOverride || e.rules).map(r => `<li>${esc(r)}</li>`).join("")}</ul>
          <label>Your name</label><input id="gmName" maxlength="18" value="${esc(S.human)}">
        </div>
        <div id="gmTools"></div>
      </div>
      <h3 class="cfg-h gm-h">🤖 Agent players <small id="gmCount"></small></h3>
      <div id="gmCast"></div>
      ${e.needsScene ? `<h3 class="cfg-h gm-h">🗺️ Arena <small>the world you play in</small></h3><div id="gmScene"></div>` : ""}
      <div class="action-bar"><a class="btn ghost" href="#game">← Games</a><span class="muted" id="gmReady"></span><button class="btn" id="gmGo">▶ Start</button></div>`;
    const count = () => {
      $("#gmCount").textContent = `${sel.length} selected (${e.minAgents}–${e.maxAgents})`;
      $("#gmGo").disabled = sel.length < e.minAgents;
      $("#gmReady").textContent = sel.length < e.minAgents ? `Pick ${e.minAgents - sel.length} more` : `${sel.length} agents + you`;
    };
    UI.castPicker($("#gmCast"), { selected: sel, min: e.minAgents, max: e.maxAgents, color: e.color, detail: "goal", onChange: count });
    if (e.needsScene) UI.scenePicker($("#gmScene"), { selected: scSel, max: 1, color: e.color });
    UI.sponsorBar($("#gmTools"), "game", S.tools);
    $("#gmName").oninput = ev => { S.human = ev.target.value.trim().slice(0, 18) || "You"; };
    $("#gmGo").onclick = go;
    count();
  }

  /* =========================================================
     CREATE YOUR OWN
     ========================================================= */
  const EMOJI = [["zombie", "🧟"], ["alien", "👽"], ["robot", "🤖"], ["ghost", "👻"], ["monster", "👾"], ["spider", "🕷️"], ["dragon", "🐉"], ["bug", "🐛"], ["slime", "🦠"], ["vampire", "🧛"], ["skeleton", "💀"], ["pirate", "🏴‍☠️"], ["ninja", "🥷"], ["shark", "🦈"], ["bee", "🐝"], ["virus", "🦠"], ["goblin", "👺"], ["clown", "🤡"], ["snowman", "⛄"], ["rat", "🐀"], ["bat", "🦇"], ["wolf", "🐺"], ["dinosaur", "🦖"], ["cat", "🐈"], ["boss", "😈"]];
  const SCENE_WORDS = [["space", "space"], ["star", "space"], ["planet", "space"], ["forest", "forest"], ["wood", "forest"], ["jungle", "forest"], ["city", "city"], ["street", "city"], ["neon", "city"], ["castle", "castle"], ["medieval", "castle"], ["beach", "beach"], ["island", "beach"], ["ocean", "beach"], ["school", "classroom"], ["class", "classroom"], ["court", "courtroom"], ["kitchen", "kitchen"], ["restaurant", "kitchen"], ["desert", "desert"], ["snow", "snow"], ["mountain", "snow"], ["ice", "snow"], ["concert", "stage"], ["stage", "stage"], ["manor", "manor"], ["haunted", "manor"], ["lab", "lab"], ["science", "lab"], ["office", "office"], ["park", "park"]];

  function offlineDesign(text) {
    const t = text.toLowerCase();
    const engine = /rock|paper|scissor|duel|guess|hand|mind|predict/.test(t) ? "rps"
      : /board|race|ladder|snake|dice|roll|climb|slide/.test(t) ? "snakes" : "zombie";
    const em = EMOJI.find(([w]) => t.includes(w));
    const sw = SCENE_WORDS.find(([w]) => t.includes(w));
    const words = text.replace(/[^\w\s'-]/g, " ").split(/\s+/).filter(w => w.length > 3 && !/game|where|with|that|they|have|from|into|your|about|make|some/i.test(w)).slice(0, 3);
    const title = words.length ? words.map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ") : "My Game";
    const hard = /hard|brutal|nightmare|insane/.test(t), easy = /easy|kid|chill|cozy|relax/.test(t);
    return {
      title: engine === "zombie" ? `${title} Survival` : engine === "snakes" ? `${title} Race` : `${title} Duel`,
      engine, enemy_name: em ? em[0] : "zombie", enemy_emoji: em ? em[1] : "🧟",
      scene: sw ? sw[1] : engine === "zombie" ? "city" : engine === "snakes" ? "park" : "stage",
      time: /night|dark|haunt|spooky/.test(t) ? "night" : /sunset|dusk/.test(t) ? "sunset" : "day",
      weather: /rain|storm/.test(t) ? "rain" : /snow|ice/.test(t) ? "snow" : /fog|mist/.test(t) ? "fog" : "clear",
      difficulty: hard ? "hard" : easy ? "easy" : "normal",
      waves: hard ? 7 : easy ? 3 : 5, snakes: hard ? 10 : easy ? 5 : 8, ladders: hard ? 5 : easy ? 9 : 7, rounds: hard ? 7 : 5,
      desc: text.slice(0, 140),
      design_notes: `Read the idea as a ${engine === "zombie" ? "survival shooter" : engine === "snakes" ? "board race" : "mind-game duel"}${em ? ` with ${em[0]}s` : ""}${sw ? ` set in a ${sw[1]}` : ""}.`
    };
  }

  function creator(existing) {
    UI.steps(["Design", "Players", "Play"], 0, "#c48bff");
    const d = S.draft = Object.assign({
      id: UI.uid("g"), title: "My Game", engine: "zombie", enemy: { name: "zombie", emoji: "🧟" }, sceneId: "s-city",
      difficulty: "normal", waves: 5, snakes: 6, ladders: 6, rounds: 5, accent: "#c48bff", desc: "", agents: [], cover: ""
    }, existing ? JSON.parse(JSON.stringify(existing)) : {});
    const scSel = [d.sceneId || "s-city"];
    const EX = ["Robots invade a neon city at night, survive 6 waves", "A cozy jungle board race with lots of ladders", "A psychic duel on a concert stage against mind-reading aliens", "Ghosts haunt the manor and the team must survive until dawn"];

    UI.app().innerHTML = `
      <div class="screen-head"><div><span class="kicker" style="color:#c48bff">➕ Track 02 · Create your own game</span>
        <h2>Design a game</h2><p class="muted">Describe it in one sentence and an AI agent will design it, or set everything yourself below.</p></div></div>
      <div class="card gm-describe">
        <h3 class="cfg-h">✨ Describe your game</h3>
        <div class="ai-row"><textarea id="gmIdea" rows="2" maxlength="300" placeholder="e.g. Space pirates attack a starship and we have to survive 5 waves"></textarea><button class="btn ai" id="gmDesign">✨ Design it</button></div>
        <div class="ex-chips">${EX.map(x => `<button data-ex="${esc(x)}">${esc(x)}</button>`).join("")}</div>
        <div id="gmWork" style="margin-top:12px"></div>
      </div>
      <h3 class="cfg-h gm-h">⚙️ Engine</h3>
      <div class="gm-engines">${ORDER.map(id => `<button class="card gm-eng ${d.engine === id ? "on" : ""}" data-eng="${id}" style="--c:${ENGINES[id].color}"><span>${ENGINES[id].icon}</span><b>${id === "zombie" ? "Survival shooter" : id === "snakes" ? "Board race" : "Mind-game duel"}</b><small>${esc(ENGINES[id].blurb)}</small></button>`).join("")}</div>
      <div class="gm-form card">
        <div class="two"><div><label>Game name</label><input id="gTitle" maxlength="40"></div><div><label>One-line description</label><input id="gDesc" maxlength="140"></div></div>
        <div class="two" id="gEnemyRow"><div><label>Enemy name</label><input id="gEnemy" maxlength="20"></div><div><label>Enemy emoji</label><div class="gm-emo" id="gEmo">${EMOJI.slice(0, 18).map(([n, e]) => `<button type="button" data-emo="${e}" data-n="${n}">${e}</button>`).join("")}</div></div></div>
        <div class="two"><div><label>Difficulty</label><div class="chips sel" id="gDiff">${["easy", "normal", "hard"].map(x => `<button class="chip" data-d="${x}">${x}</button>`).join("")}</div></div>
          <div id="gRule"></div></div>
        <label>Accent colour</label><div class="gm-colors" id="gCol">${PLAY.colors.map(c => `<button type="button" data-col="${c}" style="background:${c}" aria-label="${c}"></button>`).join("")}</div>
      </div>
      <h3 class="cfg-h gm-h">🗺️ World <small>backdrop for your game</small></h3><div id="gScene"></div>
      <div id="gTools"></div>
      <div class="card gm-preview"><div class="gm-cover big" id="gCover"></div><div><b id="pvTitle"></b><p class="muted" id="pvDesc"></p><p class="muted" id="pvRules"></p><button class="btn ghost btn-sm" id="gArt">🎨 Generate cover art (AdaL)</button></div></div>
      <div class="action-bar"><a class="btn ghost" href="#game">← Games</a><button class="btn" id="gSave">💾 Save & choose players →</button></div>`;

    const fill = () => {
      $("#gTitle").value = d.title; $("#gDesc").value = d.desc || ""; $("#gEnemy").value = d.enemy.name;
      UI.app().querySelectorAll("[data-eng]").forEach(b => b.classList.toggle("on", b.dataset.eng === d.engine));
      UI.app().querySelectorAll("[data-emo]").forEach(b => b.classList.toggle("on", b.dataset.emo === d.enemy.emoji));
      UI.app().querySelectorAll("[data-d]").forEach(b => b.classList.toggle("on", b.dataset.d === d.difficulty));
      UI.app().querySelectorAll("[data-col]").forEach(b => b.classList.toggle("on", b.dataset.col === d.accent));
      $("#gEnemyRow").style.display = d.engine === "zombie" ? "" : "none";
      $("#gRule").innerHTML = d.engine === "zombie" ? `<label>Waves</label><div class="range-row"><input type="range" id="rA" min="3" max="8" value="${d.waves}"><output>${d.waves}</output></div>`
        : d.engine === "snakes" ? `<label>Snakes / ladders</label><div class="range-row"><input type="range" id="rA" min="3" max="12" value="${d.snakes}"><output>${d.snakes}</output>🐍 <input type="range" id="rB" min="3" max="12" value="${d.ladders}"><output>${d.ladders}</output>🪜</div>`
        : `<label>Rounds per opponent</label><div class="chips sel" id="rR">${[3, 5, 7].map(n => `<button class="chip ${d.rounds === n ? "on" : ""}" data-r="${n}">Best of ${n}</button>`).join("")}</div>`;
      const rA = $("#rA"), rB = $("#rB"), rR = $("#rR");
      if (rA) rA.oninput = () => { rA.nextElementSibling.textContent = rA.value; if (d.engine === "zombie") d.waves = +rA.value; else d.snakes = +rA.value; preview(); };
      if (rB) rB.oninput = () => { rB.nextElementSibling.textContent = rB.value; d.ladders = +rB.value; preview(); };
      if (rR) rR.onclick = ev => { const b = ev.target.closest("[data-r]"); if (b) { d.rounds = +b.dataset.r; fill(); preview(); } };
      preview();
    };
    const preview = () => {
      d.sceneId = scSel[0];
      $("#pvTitle").textContent = `${ENGINES[d.engine].icon} ${d.title || "My Game"}`;
      $("#pvDesc").textContent = d.desc || ENGINES[d.engine].blurb;
      $("#pvRules").textContent = d.engine === "zombie" ? `Survive ${d.waves} waves of ${d.enemy.name}s ${d.enemy.emoji} · ${d.difficulty}` : d.engine === "snakes" ? `${d.snakes} snakes, ${d.ladders} ladders · first to 100 wins · ${d.difficulty}` : `Best of ${d.rounds} against each agent · ${d.difficulty}`;
      const cv = $("#gCover"); cv.style.setProperty("--c", d.accent);
      cv.innerHTML = coverHTML(d); if (!d.cover) mountCoverPuppets(cv, d);
    };
    const read = () => { d.title = $("#gTitle").value.trim() || "My Game"; d.desc = $("#gDesc").value.trim(); d.enemy.name = $("#gEnemy").value.trim() || "zombie"; };
    ["#gTitle", "#gDesc", "#gEnemy"].forEach(s => $(s).oninput = () => { read(); preview(); });
    UI.app().querySelectorAll("[data-eng]").forEach(b => b.onclick = () => { read(); d.engine = b.dataset.eng; fill(); });
    $("#gEmo").onclick = ev => { const b = ev.target.closest("[data-emo]"); if (!b) return; read(); d.enemy = { name: b.dataset.n, emoji: b.dataset.emo }; fill(); };
    $("#gDiff").onclick = ev => { const b = ev.target.closest("[data-d]"); if (!b) return; read(); d.difficulty = b.dataset.d; fill(); };
    $("#gCol").onclick = ev => { const b = ev.target.closest("[data-col]"); if (!b) return; read(); d.accent = b.dataset.col; fill(); };
    UI.scenePicker($("#gScene"), { selected: scSel, max: 1, color: "#c48bff", onChange: () => { d.cover = ""; preview(); } });
    UI.sponsorBar($("#gTools"), "game", S.tools);
    UI.app().querySelectorAll("[data-ex]").forEach(b => b.onclick = () => { $("#gmIdea").value = b.dataset.ex; });

    $("#gmDesign").onclick = async () => {
      const idea = $("#gmIdea").value.trim(); if (!idea) { $("#gmIdea").focus(); return; }
      $("#gmDesign").disabled = true;
      const sys = `You are a game designer agent. Turn the player's idea into a config for ONE of three simple engines:
- "zombie": co-op top-down survival shooter, waves of enemies (any enemy type, not only zombies)
- "snakes": snakes & ladders board race
- "rps": rock-paper-scissors mind-game duel
Scene bases: ${Scenes.BASES.map(b => b.id).join(", ")}.
Reply with JSON only: {"title":"max 5 words","engine":"zombie|snakes|rps","enemy_name":"singular noun","enemy_emoji":"one emoji","scene":"scene base id","time":"day|sunset|night","weather":"${Scenes.WEATHER.join("|")}","difficulty":"easy|normal|hard","waves":3-8,"snakes":3-12,"ladders":3-12,"rounds":3|5|7,"desc":"one fun sentence","design_notes":"one sentence on why you chose this design"}`;
      const out = await UI.aiRun($("#gmWork"), ["Reading your idea", "Choosing the best engine", "Picking enemies and the world", "Tuning the rules"],
        Brain.ask(sys, `IDEA: ${idea}`, 0.9, () => offlineDesign(idea)), Brain.mode === "llm" ? "Game-designer agent at work" : "Offline designer at work");
      const eng = ENGINES[out.engine] ? out.engine : "zombie";
      const base = Scenes.BASES.find(b => b.id === out.scene) ? out.scene : "city";
      const sc = UI.Lib.saveScene({ name: `${Brain.clip(out.title, 30) || "Game"} world`, base, time: Scenes.TIMES.includes(out.time) ? out.time : "day", weather: Scenes.WEATHER.includes(out.weather) ? out.weather : "clear", desc: Brain.clip(out.desc, 140) });
      const n = (v, lo, hi, def) => { v = Math.round(+v); return v >= lo && v <= hi ? v : def; };
      Object.assign(d, {
        title: Brain.clip(out.title, 40) || "My Game", engine: eng, desc: Brain.clip(out.desc, 140),
        enemy: { name: Brain.clip(out.enemy_name, 20) || "zombie", emoji: Brain.clip(out.enemy_emoji, 8) || "🧟" },
        difficulty: ["easy", "normal", "hard"].includes(out.difficulty) ? out.difficulty : "normal",
        waves: n(out.waves, 3, 8, 5), snakes: n(out.snakes, 3, 12, 8), ladders: n(out.ladders, 3, 12, 7), rounds: [3, 5, 7].includes(+out.rounds) ? +out.rounds : 5, cover: ""
      });
      scSel.splice(0, 1, sc.id);
      $("#gmWork").querySelectorAll("li").forEach(li => { li.className = "done"; li.querySelector("i").textContent = "✓"; });
      $("#gmWork").querySelector(".why").textContent = "“" + (Brain.clip(out.design_notes, 220) || "Designed from your idea.") + "”";
      UI.scenePicker($("#gScene"), { selected: scSel, max: 1, color: "#c48bff", onChange: () => { d.cover = ""; preview(); } });
      $("#gmDesign").disabled = false;
      fill();
      if (S.tools.has("adal")) art();
    };

    const art = async () => {
      read();
      const btn = $("#gArt"); btn.disabled = true; btn.textContent = "🎨 AdaL is painting…";
      const sc = UI.Lib.scene(scSel[0]) || {};
      const url = await Brain.image(`Vibrant video game cover art, no text. Game: "${d.title}". ${d.desc || ""} ${d.engine === "zombie" ? `A small team of heroes fighting waves of ${d.enemy.name}s` : d.engine === "snakes" ? "A giant snakes and ladders board with playful characters" : "Two rivals in a dramatic rock-paper-scissors standoff"}, set in ${sc.desc || sc.name || "a colourful world"}. Stylised 3D cartoon, dramatic lighting, accent colour ${d.accent}.`);
      btn.disabled = false;
      if (url) { d.cover = url; btn.textContent = "🎨 Regenerate cover art"; }
      else { btn.textContent = Brain.mode === "llm" ? "🎨 Image failed, using a scene cover" : "🎨 Offline: using a scene cover"; }
      preview();
    };
    $("#gArt").onclick = art;

    $("#gSave").onclick = () => {
      read(); d.sceneId = scSel[0];
      const all = loadGames().filter(g => g.id !== d.id);
      let stored = Object.assign({}, d);
      all.unshift(stored);
      try { saveGames(all); } catch { stored.cover = ""; saveGames(all); }
      if (!loadGames().some(g => g.id === d.id)) { stored.cover = ""; saveGames([stored].concat(all.slice(1))); }
      setup(d.engine, stored);
    };
    fill();
  }

  /* =========================================================
     PLAY SHELL shared by engines
     ========================================================= */
  function shell(cfg, o) {
    const e = ENGINES[cfg.engine];
    const color = cfg.accent && cfg.engine !== "rps" ? cfg.accent : e.color;
    UI.app().innerHTML = `
      <div class="gm-top" style="--c:${color}">
        <div><span class="kicker" style="color:${color}">${e.icon} ${esc(cfg.title || e.title)}</span><h2 id="gmStatus">${esc(o.status || "")}</h2></div>
        <div class="gm-ctrl"><span class="src">${UI.srcLabel()}</span>
          ${o.pause ? `<button class="btn ghost btn-sm" id="gmPause">⏸ Pause</button>` : ""}
          <button class="btn ghost btn-sm" id="gmVoice">${UI.ctl.voice ? "🔊" : "🔇"} Voices</button>
          <a class="btn ghost btn-sm" href="#game">✕ Quit</a></div>
      </div>
      <div id="gmBar"></div>
      <div class="gm-grid">
        <div class="gm-main" id="gmMain">${o.main || ""}</div>
        <aside class="gm-side">
          <div class="card gm-panel gm-radio" id="gmRadio" hidden><div class="log-head mono"><span>📡 BAND · TEAM RADIO</span><span class="sp-badge" style="--c:#5c8dff">live channel</span></div><ol id="gmRadioL"></ol></div>
          <div class="card gm-panel" id="gmStats" hidden><div class="log-head mono"><span>📊 BRUIN · LIVE STATS</span></div><div id="gmStatsB"></div></div>
          <div class="card gm-panel"><div class="log-head mono"><span>DECISION LOG</span><label class="minds"><input type="checkbox" id="gmMinds" checked> agent thinking</label></div><ol id="gmLog" class="gm-log"></ol></div>
        </aside>
      </div>`;
    const api = {
      root: UI.app(), main: $("#gmMain"), token: UI.ctl.token, color,
      alive: () => api.token === UI.ctl.token && document.body.contains(api.main),
      status: t => { const s = $("#gmStatus"); if (s) s.textContent = t; },
      log(html, cls) { const l = $("#gmLog"); if (!l) return; const li = document.createElement("li"); if (cls) li.className = cls; li.innerHTML = html; l.prepend(li); while (l.children.length > 60) l.lastChild.remove(); },
      think(who, color2, text, src) { api.log(`<b style="color:${color2}">${esc(who)}</b> <span class="thought">🔒 ${esc(text)}</span>${src === "offline" && Brain.mode === "llm" ? ` <span class="warn-s">⚠ LLM failed, offline brain used</span>` : ""}`, "think"); },
      radio(from, to, text, color2) {
        if (!cfg.tools.has("band")) return false;
        const l = $("#gmRadioL"); if (!l) return false;
        const li = document.createElement("li");
        li.innerHTML = `<b style="color:${color2 || "#5c8dff"}">${esc(from)}</b>${to ? ` <span class="to">→ ${esc(to)}</span>` : ` <span class="to">→ #team</span>`}<span>${esc(text)}</span>`;
        l.prepend(li); while (l.children.length > 30) l.lastChild.remove();
        o.onRadio && o.onRadio(from, to, text);
        return true;
      },
      stats(rows) {
        if (!cfg.tools.has("bruin")) return;
        const b = $("#gmStatsB"); if (!b) return;
        b.innerHTML = rows.map(sec => `<div class="st-sec"><small>${esc(sec.title)}</small>${sec.rows.map(r => { const max = Math.max(1, ...sec.rows.map(x => x.v)); return `<div class="st-row"><span>${esc(r.k)}</span><i style="--w:${(r.v / max) * 100}%;--c:${r.c || "#ffc857"}"></i><b>${typeof r.v === "number" && r.v % 1 ? r.v.toFixed(1) : r.v}${r.u || ""}</b></div>`; }).join("")}</div>`).join("");
      },
      refreshTools() {
        $("#gmRadio").hidden = !cfg.tools.has("band");
        $("#gmStats").hidden = !cfg.tools.has("bruin");
        o.onTools && o.onTools(cfg.tools);
      },
      skill: name => (cfg.tools.has("finch") ? cfg.skills[name] : null),
      skillBadge(name) { const s = api.skill(name); return s ? `<span class="sp-badge" style="--c:#ff9f43" title="${esc(s.does)}">${s.icon} ${esc(s.name)}</span>` : ""; }
    };
    UI.sponsorBar($("#gmBar"), "game", cfg.tools, () => api.refreshTools());
    $("#gmMinds").onchange = ev => $("#gmLog").classList.toggle("hide-minds", !ev.target.checked);
    $("#gmVoice").onclick = () => { UI.ctl.voice = !UI.ctl.voice; $("#gmVoice").textContent = `${UI.ctl.voice ? "🔊" : "🔇"} Voices`; if (!UI.ctl.voice) UI.stopVoice(); };
    if (o.pause) $("#gmPause").onclick = () => { UI.ctl.paused = !UI.ctl.paused; $("#gmPause").textContent = UI.ctl.paused ? "▶ Resume" : "⏸ Pause"; o.onPause && o.onPause(UI.ctl.paused); };
    api.refreshTools();
    return api;
  }

  /* final results card (shared) */
  function results(api, o) {
    const ov = document.createElement("div");
    ov.className = "gm-over";
    ov.innerHTML = `<div class="gm-over-card" style="--c:${o.color || api.color}">
      <small>${esc(o.kicker || "GAME OVER")}</small><div class="gm-big">${o.icon || "🏆"}</div><h2>${esc(o.title)}</h2><p>${esc(o.text || "")}</p>
      ${o.rows ? `<ol class="gm-podium">${o.rows.map(r => `<li style="--c:${r.color || "#3ee6ff"}"><span class="pod-fig"></span><b>${esc(r.name)}</b><small>${esc(r.sub || "")}</small><em>${esc(r.score)}</em></li>`).join("")}</ol>` : ""}
      <div class="after-btns"><button class="btn" data-again>🔁 Play again</button><a class="btn ghost" href="#game">🎮 Other games</a><a class="btn ghost" href="#grow">🎓 Try Track 3</a></div></div>`;
    (o.into || api.main).appendChild(ov);
    if (o.rows) ov.querySelectorAll(".pod-fig").forEach((el, i) => { const r = o.rows[i]; if (r.char) { Puppet.mount(el, r.char); Puppet.gesture(el, i === 0 ? "jump" : "nod", 2400); } else el.textContent = r.icon || "🧑"; });
    ov.querySelector("[data-again]").onclick = () => o.again();
  }

  /* speak with a character-specific voice index */
  const voiceIdx = name => [...String(name)].reduce((a, ch) => a + ch.charCodeAt(0), 0);

  return {
    register(e) { ENGINES[e.id] = e; },
    engines: ENGINES, SKILLS, shell, results, sceneOf, voiceIdx,
    start(sub) {
      const [id, q] = String(sub || "").split("?");
      if (id === "custom") return creator(null);
      if (ENGINES[id]) return setup(id, null, /demo/.test(q || ""));
      picker();
    },
    restart(cfg) { UI.ctl.token++; UI.ctl.paused = false; ENGINES[cfg.engine].start(Object.assign({}, cfg, { demo: false })); }
  };
})();

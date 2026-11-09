/* TRACK 2 · Co-op Multiplayer Game: setup → rounds (humans + agents) → world events → results */
window.Game = (function () {
  const { $, esc, rand } = UI;
  const C = "#3ee6ff";
  const STEPS = ["World", "Players", "Play", "Results"];
  const A = PLAY.actions;
  const S = {
    world: 0,
    custom: { title: "My World", desc: "", locations: "Castle, Forest, Harbor, Mines" },
    agents: PLAY.gameAgents.map(a => ({ ...a })),
    picked: [0, 1, 2],
    humans: [{ name: "You", avatar: "🤠" }],
    rounds: 5
  };

  /* ================= SETUP ================= */
  function getWorld() {
    if (S.world < PLAY.gameWorlds.length) return { ...PLAY.gameWorlds[S.world] };
    const c = S.custom;
    const locs = c.locations.split(",").map(s => s.trim()).filter(Boolean).slice(0, 4);
    while (locs.length < 4) locs.push(["North", "South", "East", "West"][locs.length]);
    return { id: "custom", icon: "🗺️", title: c.title || "My World", theme: "custom", desc: c.desc || "A strange land where humans and agents compete.", locations: locs, events: PLAY.customEvents };
  }

  function setup() {
    UI.steps(STEPS, 0, C);
    const custom = S.world === PLAY.gameWorlds.length;
    UI.app().innerHTML = `
      <div class="screen-head"><div><span class="kicker" style="color:${C}">🎮 Track 02 · Step 1</span><h2>Choose a world</h2>
      <p class="muted">Humans and AI agents share this world as <b>equal players</b>. The agents act on their own goals, whether or not you talk to them.</p></div></div>
      <div class="mode-grid">
        ${PLAY.gameWorlds.map((w, i) => `<button class="card mode ${S.world === i ? "on" : ""}" data-w="${i}" style="--c:${C}"><span class="ico">${w.icon}</span><h4>${esc(w.title)}</h4><p>${esc(w.desc)}</p><small class="locs">📍 ${w.locations.join(" · ")}</small></button>`).join("")}
        <button class="card mode ${custom ? "on" : ""}" data-w="${PLAY.gameWorlds.length}" style="--c:${C}"><span class="ico">✍️</span><h4>Build your own</h4><p>Name it, describe it, and pick 4 locations.</p></button>
      </div>
      ${custom ? `<div class="card story-cfg-one">
        <div class="two"><div><label>World name</label><input id="wTitle" maxlength="40" value="${esc(S.custom.title)}"></div>
        <div><label>4 locations (comma separated)</label><input id="wLocs" maxlength="120" value="${esc(S.custom.locations)}"></div></div>
        <label>Describe the world</label><textarea id="wDesc" rows="2" maxlength="300" placeholder="e.g. A floating sky-city where guilds fight over wind crystals.">${esc(S.custom.desc)}</textarea>
      </div>` : ""}
      <div class="action-bar"><a class="btn ghost" href="#">← Tracks</a><button class="btn" id="next">Next: players →</button></div>`;
    const keep = () => { if ($("#wTitle")) Object.assign(S.custom, { title: $("#wTitle").value.trim(), locations: $("#wLocs").value, desc: $("#wDesc").value.trim() }); };
    UI.app().querySelectorAll("[data-w]").forEach(b => b.onclick = () => { keep(); S.world = +b.dataset.w; setup(); });
    $("#next").onclick = () => { keep(); players(); };
  }

  function players() {
    UI.steps(STEPS, 1, C);
    const n = S.picked.length;
    UI.app().innerHTML = `
      <div class="screen-head"><div><span class="kicker" style="color:${C}">🎮 Track 02 · Step 2</span><h2>Pick the agent players</h2>
      <p class="muted">Choose <b>3 or 4</b> AI agents. Each has its own goal, personality and memory, and they'll ally with you, trade with you, or betray you. Click ✏️ to rewrite one.</p></div></div>
      <div class="cast-grid">
        ${S.agents.map((a, i) => { const on = S.picked.includes(i); return `
          <div class="card char ${on ? "on" : ""}" data-i="${i}" tabindex="0" role="button" aria-pressed="${on}" style="--c:${C}">
            <button class="edit" data-edit="${i}" aria-label="Edit ${esc(a.name)}">✏️</button>
            <div class="av">${a.avatar}</div><h4>${esc(a.name)}</h4><span class="role">${esc(a.role)}${a.custom ? " · yours" : ""}</span>
            <p>${esc(a.personality)}</p><p class="secret">🎯 ${esc(a.goal)}</p>
          </div>`; }).join("")}
        <button class="card char new" id="newAgent"><div class="av">➕</div><h4>Create an agent</h4><p>Give it a personality and a goal.</p></button>
      </div>

      <div class="card humans-cfg">
        <h3 class="cfg-h">🧑 Human players <small>1 or 2 on the same screen (hot-seat)</small></h3>
        <div class="humans">${S.humans.map((h, i) => `
          <div class="human-row"><select data-ha="${i}">${PLAY.avatars.map(a => `<option ${a === h.avatar ? "selected" : ""}>${a}</option>`).join("")}</select>
          <input data-hn="${i}" maxlength="18" value="${esc(h.name)}" placeholder="Player ${i + 1} name">
          ${i > 0 ? `<button class="btn ghost btn-sm" data-rm="${i}">Remove</button>` : ""}</div>`).join("")}</div>
        ${S.humans.length < 2 ? `<button class="btn ghost btn-sm" id="addHuman">➕ Add Player 2 (friend on the same screen)</button>` : ""}
        <h3 class="cfg-h">🔁 Rounds</h3>
        <div class="chips sel" id="rounds">${[4, 5, 6, 8].map(r => `<button class="chip ${S.rounds === r ? "on" : ""}" data-r="${r}">${r} rounds</button>`).join("")}</div>
      </div>

      <div class="action-bar"><button class="btn ghost" id="back">← World</button>
        <span class="muted"><b>${n}</b> agents · ${S.humans.length} human${S.humans.length > 1 ? "s" : ""}</span>
        <button class="btn" id="start" ${n < 3 ? "disabled" : ""}>▶ Start game</button></div>`;

    const keepHumans = () => UI.app().querySelectorAll("[data-hn]").forEach(inp => {
      const i = +inp.dataset.hn;
      S.humans[i].name = inp.value.trim() || `Player ${i + 1}`;
      S.humans[i].avatar = UI.app().querySelector(`[data-ha="${i}"]`).value;
    });
    UI.app().querySelectorAll(".char[data-i]").forEach(el => {
      const t = e => { if (e.target.closest("[data-edit]")) return; keepHumans(); const i = +el.dataset.i, k = S.picked.indexOf(i);
        if (k >= 0) S.picked.splice(k, 1); else if (S.picked.length < 4) S.picked.push(i); players(); };
      el.addEventListener("click", t); el.addEventListener("keydown", e => e.key === "Enter" && t(e));
    });
    UI.app().querySelectorAll("[data-edit]").forEach(b => b.onclick = () => { keepHumans(); const i = +b.dataset.edit;
      UI.editCharacter(S.agents[i], { kind: "game", onSave: a => { S.agents[i] = a; players(); } }); });
    $("#newAgent").onclick = () => { keepHumans(); UI.editCharacter(null, { kind: "game", onSave: a => { S.agents.push(a); if (S.picked.length < 4) S.picked.push(S.agents.length - 1); players(); } }); };
    const add = $("#addHuman"); if (add) add.onclick = () => { keepHumans(); S.humans.push({ name: "Player 2", avatar: "🐱" }); players(); };
    UI.app().querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { keepHumans(); S.humans.splice(+b.dataset.rm, 1); players(); });
    $("#rounds").onclick = e => { const b = e.target.closest("[data-r]"); if (b) { keepHumans(); S.rounds = +b.dataset.r; players(); } };
    $("#back").onclick = () => { keepHumans(); setup(); };
    $("#start").onclick = () => { keepHumans(); if (new Set(S.humans.map(h => h.name)).size < S.humans.length) S.humans[1].name += " 2"; play(); };
  }

  /* ================= GAME STATE ================= */
  function newGame() {
    const world = getWorld();
    const ps = [];
    S.humans.forEach((h, i) => ps.push({ ...h, role: "Human player", human: true, color: i ? "#ffc857" : "#f2f2f2" }));
    S.picked.forEach((i, k) => {
      let a = { ...S.agents[i] };
      if (ps.some(p => p.name === a.name)) a.name += "*";
      ps.push({ ...a, human: false, color: PLAY.colors[(k + 1) % PLAY.colors.length] });
    });
    ps.forEach((p, i) => Object.assign(p, { id: i, coins: 5, health: 10, influence: 0, loc: world.locations[i % world.locations.length], trust: {}, memory: [], aggression: 0 }));
    return { world, events: world.events, players: ps, round: 1, rounds: S.rounds, lastRound: [], history: [], humanChatter: [], eventHappened: false };
  }
  const score = p => p.coins + p.health + 2 * p.influence;
  const byName = (g, n) => g.players.find(p => p.name === n);
  const trust = (from, to, d) => { from.trust[to.name] = (from.trust[to.name] || 0) + d; };
  const remember = (p, txt) => { if (!p.human) p.memory.push(txt); };

  /* resolve one decision → returns a log line */
  function resolve(g, p, d) {
    const t = byName(g, d.target), R = `R${g.round}`;
    if (p.health <= 0) { p.health = 3; return `💤 ${p.name} is knocked out and recovers (+3 health).`; }
    switch (d.action) {
      case "move": p.loc = d.target; return `🚶 ${p.name} moves to ${d.target}.`;
      case "gather": p.coins += 2; return `⛏️ ${p.name} works hard (+2 coins).`;
      case "trade": p.coins++; t.coins++; trust(p, t, 1); trust(t, p, 1); remember(t, `${R}: ${p.name} traded fairly with me.`); return `🤝 ${p.name} trades with ${t.name} (+1 coin each).`;
      case "ally": trust(p, t, 2); trust(t, p, 2); p.influence++; remember(t, `${R}: ${p.name} offered me an alliance.`); return `🛡️ ${p.name} forms an alliance with ${t.name}.`;
      case "talk": trust(t, p, 1); remember(t, `${R}: ${p.name} told me: "${d.say}"`); return `💬 ${p.name} talks to ${t.name}.`;
      case "steal": { const n = Math.min(3, t.coins); t.coins -= n; p.coins += n; trust(t, p, -3); p.aggression += 1; remember(t, `${R}: ${p.name} STOLE ${n} coins from me!`); return `🫳 ${p.name} steals ${n} coins from ${t.name}!`; }
      case "attack": t.health = Math.max(0, t.health - 3); p.health = Math.max(0, p.health - 1); trust(t, p, -3); p.aggression += 2; remember(t, `${R}: ${p.name} ATTACKED me.`); return `⚔️ ${p.name} attacks ${t.name} (-3 health)!`;
      case "betray": {
        if ((t.trust[p.name] || 0) >= 2) { const n = Math.min(5, t.coins); t.coins -= n; p.coins += n; t.trust[p.name] = -5; p.aggression += 2; remember(t, `${R}: ${p.name} BETRAYED me and took ${n} coins. Never again.`); return `🗡️ ${p.name} BETRAYS ${t.name} and takes ${n} coins!`; }
        trust(t, p, -1); return `🗡️ ${p.name} tries to betray ${t.name}, but ${t.name} never trusted them.`;
      }
    }
    return `${p.name} hesitates.`;
  }
  function applyEvent(g, we) {
    const fx = we.ev.fx, targets = fx.who === "all" ? g.players : fx.who === "humans" ? g.players.filter(p => p.human) : [we.by];
    targets.forEach(p => {
      if (fx.coinsPct) p.coins = Math.max(0, Math.round(p.coins * (1 + fx.coinsPct / 100)));
      if (fx.coins) p.coins = Math.max(0, p.coins + fx.coins);
      if (fx.health) p.health = Math.max(0, p.health + fx.health);
      if (fx.influence) p.influence = Math.max(0, p.influence + fx.influence);
    });
    if (fx.causerInfluence) we.by.influence += fx.causerInfluence;
    g.players.forEach(p => remember(p, `R${g.round}: WORLD EVENT "${we.ev.title}" caused by ${we.by.name}.`));
  }

  /* ================= BOARD ================= */
  let G;
  function play() {
    G = newGame();
    UI.ctl.token++;
    UI.steps(STEPS, 2, C);
    UI.app().innerHTML = `
      <div class="game-top">
        <div><span class="kicker" style="color:${C}">${G.world.icon} ${esc(G.world.title)}</span><h2 id="roundLbl">Round 1 / ${G.rounds}</h2></div>
        <div class="game-top-r"><span class="src">${Brain.mode === "llm" ? "🧠 " + esc(Brain.model) : "🧪 offline agents"}</span>
        <button class="btn ghost btn-sm" id="voiceG">${UI.ctl.voice ? "🔊 Voices on" : "🔇 Voices off"}</button></div>
      </div>
      <div class="game-grid">
        <div>
          <div class="board theme-${G.world.theme}" id="board">${G.world.locations.map((l, i) => `<div class="loc" data-loc="${esc(l)}"><span class="loc-n">📍 ${esc(l)}</span><div class="tokens"></div></div>`).join("")}
            <div class="event-pop" id="eventPop" hidden></div></div>
          <div class="card turn" id="turn"></div>
        </div>
        <aside>
          <div class="card score" id="score"></div>
          <div class="card glog"><div class="log-head mono"><span>DECISION LOG</span><label class="minds"><input type="checkbox" id="showMindsG" checked> agent thoughts</label></div><ol id="glog"></ol></div>
        </aside>
      </div>`;
    $("#voiceG").onclick = () => { UI.ctl.voice = !UI.ctl.voice; $("#voiceG").textContent = UI.ctl.voice ? "🔊 Voices on" : "🔇 Voices off"; };
    $("#showMindsG").onchange = e => $("#glog").classList.toggle("hide-minds", !e.target.checked);
    renderBoard(); renderScore();
    gLog(`<b>🎲 The game begins.</b> ${esc(G.world.desc)}`, "sys");
    nextRound();
  }

  function renderBoard() {
    $("#board").querySelectorAll(".loc").forEach(l => {
      l.querySelector(".tokens").innerHTML = G.players.filter(p => p.loc === l.dataset.loc).map(p => `
        <div class="token ${p.human ? "human" : ""} ${p.health <= 0 ? "ko" : ""}" id="tok-${p.id}" style="--c:${p.color}">
          <div class="bubble"></div><span class="t-av">${p.avatar}</span><span class="t-n">${esc(p.name)}</span></div>`).join("");
    });
  }
  function renderScore() {
    const humans = G.players.filter(p => p.human), agents = G.players.filter(p => !p.human);
    const sorted = G.players.slice().sort((a, b) => score(b) - score(a));
    $("#score").innerHTML = `
      <div class="log-head mono"><span>STANDINGS</span><span>score = 💰+❤️+2⭐</span></div>
      <table><tbody>${sorted.map((p, i) => `<tr style="--c:${p.color}"><td>${i + 1}</td><td><b>${p.avatar} ${esc(p.name)}</b><small>${p.human ? "human" : esc(p.role)}</small></td>
        <td>💰${p.coins}</td><td>❤️${p.health}</td><td>⭐${p.influence}</td><td class="sc">${score(p)}</td></tr>`).join("")}</tbody></table>
      <div class="log-head mono" style="margin-top:14px"><span>WHAT AGENTS THINK OF YOU</span></div>
      <div class="trust">${agents.map(a => `<div><span>${a.avatar} ${esc(a.name)}</span>${humans.map(h => { const v = a.trust[h.name] || 0; return `<span class="tv ${v > 0 ? "pos" : v < 0 ? "neg" : ""}" title="${esc(a.name)}'s trust in ${esc(h.name)}">${h.avatar} ${v > 0 ? "+" : ""}${v} ${v >= 2 ? "💚" : v <= -2 ? "💢" : ""}</span>`; }).join("")}</div>`).join("")}</div>`;
  }
  function gLog(html, cls) { const li = document.createElement("li"); if (cls) li.className = cls; li.innerHTML = html; $("#glog").prepend(li); }
  function bubble(p, text) {
    const t = $("#tok-" + p.id); if (!t || !text) return;
    const b = t.querySelector(".bubble"); b.textContent = text; b.classList.add("on");
    setTimeout(() => b.classList.remove("on"), 4200 / UI.ctl.speed);
  }

  /* ---------- human turn UI ---------- */
  function humanTurn(h) {
    return new Promise(resolveTurn => {
      let action = "gather";
      const others = G.players.filter(p => p !== h);
      const draw = () => {
        const need = A[action].needs;
        $("#turn").innerHTML = `
          <div class="turn-h"><span class="t-av big">${h.avatar}</span><div><b>${esc(h.name)}'s turn</b><small>You're at 📍 ${esc(h.loc)} · 💰${h.coins} ❤️${h.health} ⭐${h.influence}${S.humans.length > 1 ? " · others look away 🙈" : ""}</small></div></div>
          <div class="acts">${Object.entries(A).map(([k, v]) => `<button class="act-b ${k === action ? "on" : ""}" data-a="${k}" title="${esc(v.help)}"><span>${v.icon}</span>${v.label}</button>`).join("")}</div>
          <p class="muted act-help">${A[action].icon} ${esc(A[action].help)}</p>
          <div class="turn-row">
            ${need === "location" ? `<select id="tgt">${G.world.locations.filter(l => l !== h.loc).map(l => `<option>${esc(l)}</option>`).join("")}</select>` : ""}
            ${need === "player" ? `<select id="tgt">${others.map(o => `<option value="${esc(o.name)}">${o.avatar} ${esc(o.name)}${o.human ? " (human)" : ""}</option>`).join("")}</select>` : ""}
            <input id="sayIn" maxlength="120" placeholder="Say something to the table (agents will hear it)…">
            <button class="btn btn-sm" id="lock">Lock in ✓</button>
          </div>`;
        $("#turn").querySelectorAll("[data-a]").forEach(b => b.onclick = () => { action = b.dataset.a; const s = $("#sayIn").value; draw(); $("#sayIn").value = s; });
        $("#lock").onclick = () => {
          const tg = $("#tgt") ? $("#tgt").value : "";
          resolveTurn({ action, target: tg, say: $("#sayIn").value.trim() });
        };
      };
      draw();
    });
  }

  async function nextRound() {
    const token = UI.ctl.token;
    try {
      $("#roundLbl").textContent = `Round ${G.round} / ${G.rounds}`;
      G.humanChatter = [];
      const decisions = [];
      for (const h of G.players.filter(p => p.human)) {
        const d = await humanTurn(h);
        if (token !== UI.ctl.token) return;
        decisions.push({ p: h, d });
        if (d.say) G.humanChatter.push(`${h.name}${d.target && byName(G, d.target) ? ` (to ${d.target})` : ""}: "${d.say}"`);
      }
      const agents = G.players.filter(p => !p.human);
      $("#turn").innerHTML = `<div class="thinking-row">${agents.map(a => `<span class="think-chip" style="--c:${a.color}">${a.avatar} ${esc(a.name)} is deciding<span class="dots3"><i></i><i></i><i></i></span></span>`).join("")}</div>`;
      agents.forEach(a => { const t = $("#tok-" + a.id); t && t.classList.add("thinking"); });

      const ad = await Promise.all(agents.map(a => Brain.gameTurn(a, G)));
      if (token !== UI.ctl.token) return;
      agents.forEach((a, i) => { decisions.push({ p: a, d: ad[i] }); if (ad[i].memory_note) a.memory.push(`R${G.round} note: ${ad[i].memory_note}`); });

      // resolve simultaneously, random order
      decisions.sort(() => Math.random() - 0.5);
      const results = [];
      for (const { p, d } of decisions) {
        const line = resolve(G, p, d);
        results.push(line + (d.say ? ` ${p.name} says: "${d.say}"` : ""));
        gLog(`<span class="ts">R${G.round}</span><b style="color:${p.color}">${p.avatar} ${esc(p.name)}</b>${p.human ? ' <span class="hb">human</span>' : ""}
          <span class="act">${esc(line)}</span>${d.say ? `<span class="say">“${esc(d.say)}”</span>` : ""}
          ${!p.human ? `<span class="thought">🔒 ${esc(d.thought || "")}</span>` : ""}`);
      }
      renderBoard(); renderScore();
      decisions.forEach(({ p, d }) => d.say && bubble(p, d.say));
      const firstAgentSay = decisions.find(x => !x.p.human && x.d.say);
      if (firstAgentSay) UI.speak(firstAgentSay.d.say, firstAgentSay.p.id);

      // game master: narration + agent-caused world event
      $("#turn").innerHTML = `<div class="thinking-row"><span class="think-chip">🎲 The game master is reading the table<span class="dots3"><i></i><i></i><i></i></span></span></div>`;
      const mustEvent = !G.eventHappened && G.round >= Math.ceil(G.rounds / 2);
      const nar = await Brain.gameNarrate(G, results, mustEvent);
      if (token !== UI.ctl.token) return;
      gLog(`<b>📜 Round ${G.round}</b> <span class="act">${esc(nar.narration)}</span>`, "sys");
      if (nar.world_event) {
        G.eventHappened = true;
        applyEvent(G, nar.world_event);
        const we = nar.world_event;
        results.push(`WORLD EVENT: ${we.ev.title}, caused by ${we.by.name}`);
        gLog(`<b>🌍 WORLD EVENT: ${we.ev.icon} ${esc(we.ev.title)}</b><span class="act">Caused by agent <b>${esc(we.by.name)}</b>. ${esc(we.why || "")} ${esc(we.ev.text)}</span>`, "event");
        const pop = $("#eventPop");
        pop.innerHTML = `<small>WORLD EVENT · CAUSED BY AN AGENT</small><div class="e-ico">${we.ev.icon}</div><h3>${esc(we.ev.title)}</h3><p>${we.by.avatar} <b>${esc(we.by.name)}</b>: ${esc(we.why || "")}</p><p class="muted">${esc(we.ev.text)}</p><button class="btn btn-sm" id="okEv">Continue</button>`;
        $("#board").querySelectorAll(".bubble.on").forEach(b => b.classList.remove("on"));
        pop.hidden = false;
        UI.speak(`World event: ${we.ev.title}`, we.by.id);
        await new Promise(r => ($("#okEv").onclick = r));
        pop.hidden = true;
        renderBoard(); renderScore();
      }
      G.lastRound = results;
      G.history.push(...results.map(r => `R${G.round}: ${r}`));
      G.round++;
      if (G.round > G.rounds) return finish();
      nextRound();
    } catch (e) { console.error(e); }
  }

  /* ================= RESULTS ================= */
  async function finish() {
    UI.steps(STEPS, 3, C);
    const st = G.players.map(p => ({ ...p, score: score(p) })).sort((a, b) => b.score - a.score);
    $("#turn").innerHTML = `<div class="thinking-row"><span class="think-chip">📰 Writing the epilogue<span class="dots3"><i></i><i></i><i></i></span></span></div>`;
    const ep = await Brain.gameEpilogue(G, st);
    const w = st[0];
    $("#turn").innerHTML = `
      <div class="results">
        <small class="kicker">FINAL RESULTS</small>
        <h2>${w.avatar} ${esc(w.name)} ${w.name === "You" ? "win" : "wins"}!</h2>
        <p class="winner-type">${w.human ? "🧑 A human beat the machines." : "🤖 An AI agent won. The humans got outplayed."}</p>
        <div class="headline">📰 ${esc(ep.headline || "")}</div>
        <p>${esc(ep.epilogue || "")}</p>
        <ol class="podium">${st.map(p => `<li style="--c:${p.color}"><span>${p.avatar}</span><b>${esc(p.name)}</b><small>${p.human ? "human" : "agent"}</small><em>${p.score}</em></li>`).join("")}</ol>
        <div class="after-btns">
          <button class="btn" id="again">🔁 Rematch (agents keep no memory)</button>
          <button class="btn ghost" id="cfg">⚙️ Change setup</button>
          <a class="btn ghost" href="#film">🎬 Try Track 1</a>
        </div>
      </div>`;
    UI.speak(ep.headline, 0);
    $("#again").onclick = play;
    $("#cfg").onclick = players;
  }

  return { start: setup };
})();

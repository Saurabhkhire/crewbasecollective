/* TRACK 2 · Snakes & Ladders — you vs 2–3 AI agents.
   One decision per turn: use ⚡ Double roll or 🛡️ Shield (one of each per game).
   Agents decide with Brain.ask and talk trash on the way. */
(function () {
  const rand = a => a[Math.floor(Math.random() * a.length)];
  const esc = s => UI.esc(s);

  Games.register({
    id: "snakes", title: "Snakes & Ladders", icon: "🐍", color: "#ffc857",
    blurb: "Race to square 100. Ladders lift you up, snakes drag you down.",
    rules: ["Roll the dice and move forward", "Ladder = climb up 🪜 · Snake head = slide down 🐍", "Once per game: ⚡ Double roll and 🛡️ Shield (ignore one snake)", "First to 100 wins"],
    agents: "Each agent decides when to spend its Double roll or Shield, explains why, and trash-talks the other players.",
    minAgents: 2, maxAgents: 3, needsScene: true,
    defaults: { agents: ["luna", "rook", "bolt"], sceneId: "s-park", snakes: 6, ladders: 6, difficulty: "normal" },
    start
  });

  /* square n (1..100) → board coordinates in a 1000×1000 viewBox */
  function pos(n) {
    n = Math.max(1, Math.min(100, n));
    const row = Math.floor((n - 1) / 10), k = (n - 1) % 10, col = row % 2 ? 9 - k : k;
    return { x: col * 100 + 50, y: (9 - row) * 100 + 50 };
  }
  function makeBoard(nS, nL) {
    for (let tries = 0; tries < 200; tries++) {
      const used = new Set([1, 100]), S = {}, L = {};
      const free = n => !used.has(n);
      let ok = true;
      for (let i = 0; i < nL && ok; i++) {
        let placed = false;
        for (let a = 0; a < 60 && !placed; a++) {
          const lo = 2 + Math.floor(Math.random() * 82), hi = lo + 9 + Math.floor(Math.random() * 18);
          if (hi < 99 && free(lo) && free(hi) && Math.floor((lo - 1) / 10) !== Math.floor((hi - 1) / 10)) { L[lo] = hi; used.add(lo); used.add(hi); placed = true; }
        }
        ok = placed;
      }
      for (let i = 0; i < nS && ok; i++) {
        let placed = false;
        for (let a = 0; a < 60 && !placed; a++) {
          const hi = 14 + Math.floor(Math.random() * 85), lo = hi - 9 - Math.floor(Math.random() * 18);
          if (lo > 1 && hi < 100 && free(lo) && free(hi) && Math.floor((lo - 1) / 10) !== Math.floor((hi - 1) / 10)) { S[hi] = lo; used.add(lo); used.add(hi); placed = true; }
        }
        ok = placed;
      }
      if (ok) return { S, L };
    }
    return { S: { 98: 78, 87: 24, 62: 19, 54: 34, 17: 7 }, L: { 4: 14, 9: 31, 21: 42, 28: 84, 51: 67, 72: 91 } };
  }

  function boardSVG(S, L) {
    let cells = "";
    for (let n = 1; n <= 100; n++) {
      const p = pos(n), row = Math.floor((n - 1) / 10);
      const dark = (row + Math.floor((p.x - 50) / 100)) % 2;
      cells += `<rect x="${p.x - 50}" y="${p.y - 50}" width="100" height="100" fill="${dark ? "rgba(255,255,255,.10)" : "rgba(255,255,255,.04)"}"/>
        <text x="${p.x - 42}" y="${p.y - 32}" class="sl-num">${n}</text>`;
    }
    const p100 = pos(100);
    cells += `<text x="${p100.x}" y="${p100.y + 18}" text-anchor="middle" font-size="52">🏁</text>`;
    let ladders = "";
    for (const lo in L) {
      const a = pos(+lo), b = pos(L[lo]), dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), nx = -dy / len * 16, ny = dx / len * 16;
      let rungs = ""; const nR = Math.floor(len / 42);
      for (let i = 1; i < nR; i++) { const t = i / nR; rungs += `<line x1="${a.x + dx * t + nx}" y1="${a.y + dy * t + ny}" x2="${a.x + dx * t - nx}" y2="${a.y + dy * t - ny}"/>`; }
      ladders += `<g class="sl-ladder"><g stroke="#00000066" stroke-width="12" transform="translate(4 6)"><line x1="${a.x + nx}" y1="${a.y + ny}" x2="${b.x + nx}" y2="${b.y + ny}"/><line x1="${a.x - nx}" y1="${a.y - ny}" x2="${b.x - nx}" y2="${b.y - ny}"/></g>
        <g stroke="#c98a4b" stroke-width="9" stroke-linecap="round">${rungs}</g><g stroke="#e8a862" stroke-width="10" stroke-linecap="round"><line x1="${a.x + nx}" y1="${a.y + ny}" x2="${b.x + nx}" y2="${b.y + ny}"/><line x1="${a.x - nx}" y1="${a.y - ny}" x2="${b.x - nx}" y2="${b.y - ny}"/></g></g>`;
    }
    let snakes = "", i = 0;
    const SC = [["#3fbf5f", "#2a8a44"], ["#e5484d", "#a82d33"], ["#c48bff", "#7d4fc4"], ["#ff9f43", "#c46c1e"], ["#3ee6ff", "#1f9db3"]];
    for (const hi in S) {
      const a = pos(+hi), b = pos(S[hi]), dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len, w = Math.min(55, len * 0.22);
      const d = `M${a.x} ${a.y} C${a.x + dx * 0.33 + nx * w} ${a.y + dy * 0.33 + ny * w} ${a.x + dx * 0.66 - nx * w} ${a.y + dy * 0.66 - ny * w} ${b.x} ${b.y}`;
      const [c1, c2] = SC[i++ % SC.length];
      const ang = Math.atan2(a.y - (a.y + dy * 0.33 + nx * w), a.x - (a.x + dx * 0.33 + nx * w)) * 180 / Math.PI;
      snakes += `<g class="sl-snake"><path d="${d}" stroke="#00000055" stroke-width="26" fill="none" stroke-linecap="round" transform="translate(4 6)"/>
        <path d="${d}" stroke="${c2}" stroke-width="26" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c1}" stroke-width="18" fill="none" stroke-linecap="round"/>
        <path d="${d}" stroke="#ffffff55" stroke-width="5" fill="none" stroke-dasharray="6 16" stroke-linecap="round"/>
        <g transform="translate(${a.x} ${a.y}) rotate(${ang})"><path d="M14 0 L34 -5 M34 -5 L40 -10 M34 -5 L40 0" stroke="#e5394b" stroke-width="3" fill="none"/><ellipse rx="22" ry="17" fill="${c2}"/><ellipse rx="19" ry="14" fill="${c1}"/>
        <circle cx="6" cy="-8" r="5" fill="#fff"/><circle cx="6" cy="8" r="5" fill="#fff"/><circle cx="8" cy="-8" r="2.6" fill="#111"/><circle cx="8" cy="8" r="2.6" fill="#111"/></g></g>`;
    }
    return `<svg class="sl-svg" viewBox="0 0 1000 1000">${cells}${ladders}${snakes}<g id="slLinks"></g></svg>`;
  }

  async function start(cfg) {
    const nS = cfg.snakes || 6, nL = cfg.ladders || 6;
    const { S, L } = makeBoard(nS, nL);
    const humanChar = { name: cfg.human.name, role: "Human player", look: { species: "human", skin: "#e8b08a", hair: "short", hairColor: "#3d2618", outfit: "jacket", outfitColor: "#f2f2f2", acc: "cap", build: "regular", eyes: "normal", facial: "none" } };
    const P = [{ char: humanChar, name: cfg.human.name, human: true }].concat(cfg.agents.map(c => ({ char: c, name: c.name, human: false })))
      .map((p, i) => Object.assign(p, { i, at: 1, dbl: 1, shield: 1, armed: false, color: p.human ? "#ffffff" : PLAY.colors[(i + 1) % PLAY.colors.length], stat: { rolls: 0, sum: 0, ladders: 0, snakes: 0, saved: 0 } }));

    const api = Games.shell(cfg, {
      status: "First to 100 wins",
      main: `<div class="sl-wrap"><div class="sl-board" id="slBoard">${boardSVG(S, L)}<div class="sl-tokens" id="slTok"></div></div></div>
        <div class="card sl-turn" id="slTurn"></div>`,
      onRadio: (from, to) => line(from, to)
    });
    const wrap = document.querySelector(".sl-wrap");
    Scenes.mount(wrap, cfg.scene);
    const tok = document.getElementById("slTok");
    P.forEach(p => {
      const el = document.createElement("div");
      el.className = "sl-token"; el.style.setProperty("--c", p.color);
      el.innerHTML = `<div class="sl-bub"></div><div class="sl-pup"></div><span class="sl-tag">${esc(p.name)}</span>`;
      tok.appendChild(el); p.el = el; Puppet.mount(el.querySelector(".sl-pup"), p.char);
    });
    const place = (p, instant) => {
      const here = P.filter(q => q.at === p.at), k = here.indexOf(p), n = here.length;
      const c = pos(p.at), off = n > 1 ? (k - (n - 1) / 2) * 26 : 0;
      P.filter(q => q.at === p.at).forEach((q, kk) => { const o = n > 1 ? (kk - (n - 1) / 2) * 26 : 0; q.el.style.left = (c.x + o) / 10 + "%"; q.el.style.top = (c.y + 30) / 10 + "%"; q.el.style.zIndex = Math.round(c.y) + kk; });
      if (instant) p.el.style.transition = "none";
      p.el.style.left = (c.x + off) / 10 + "%"; p.el.style.top = (c.y + 30) / 10 + "%";
      if (instant) { void p.el.offsetWidth; p.el.style.transition = ""; }
    };
    P.forEach(p => place(p, true));

    function bubble(p, text, ms) {
      const b = p.el.querySelector(".sl-bub"); b.textContent = text; b.classList.add("on");
      clearTimeout(p._b); p._b = setTimeout(() => b.classList.remove("on"), ms || 3200);
      Puppet.talk(p.el.querySelector(".pup"), Math.min(2400, text.length * 60));
      if (!p.human) UI.speak(text, Games.voiceIdx(p.name));
    }
    function line(from, to) {
      const a = P.find(p => p.name === from); if (!a) return;
      const g = document.getElementById("slLinks"); if (!g) return;
      (to ? P.filter(p => p.name === to) : P.filter(p => p !== a)).forEach(b => {
        const A = pos(a.at), Bp = pos(b.at);
        const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
        el.setAttribute("d", `M${A.x} ${A.y - 40} Q${(A.x + Bp.x) / 2} ${Math.min(A.y, Bp.y) - 160} ${Bp.x} ${Bp.y - 40}`);
        el.setAttribute("class", "sl-link");
        g.appendChild(el); setTimeout(() => el.remove(), 2600);
      });
    }
    function stats() {
      api.stats([
        { title: "POSITION", rows: P.map(p => ({ k: p.name, v: p.at, c: p.color })) },
        { title: "AVERAGE ROLL", rows: P.map(p => ({ k: p.name, v: p.stat.rolls ? p.stat.sum / p.stat.rolls : 0, c: p.color })) },
        { title: "LADDERS 🪜 / SNAKES 🐍", rows: P.map(p => ({ k: p.name, v: p.stat.ladders, u: ` / ${p.stat.snakes}`, c: p.color })) }
      ]);
    }
    const skill = p => (p.human ? null : api.skill(p.name));
    const sleep = ms => UI.sleep(ms, api.token);
    const rollDie = () => 1 + Math.floor(Math.random() * 6);

    /* ---------- dice ---------- */
    async function showDice(vals) {
      const d = document.getElementById("slDice"); if (!d) return;
      d.classList.add("rolling");
      for (let k = 0; k < 8; k++) { d.innerHTML = vals.map(() => `<span>${"⚀⚁⚂⚃⚄⚅"[rollDie() - 1]}</span>`).join(""); await sleep(70); }
      d.classList.remove("rolling");
      d.innerHTML = vals.map(v => `<span>${"⚀⚁⚂⚃⚄⚅"[v - 1]}</span>`).join("");
    }

    /* ---------- agent decision ---------- */
    async function decide(a) {
      const snakesAhead = Object.keys(S).map(Number).filter(h => h > a.at && h <= a.at + 12);
      const leader = P.slice().sort((x, y) => y.at - x.at)[0];
      const sk = skill(a);
      const system = `You are ${a.name}, the ${a.char.role}, an AI agent PLAYER in a game of Snakes & Ladders against a human and other agents.
Personality: ${a.char.personality || "competitive"}${sk ? `\nYour skill: ${sk.name} (${sk.does})` : ""}
Each player has ONE "double" (roll two dice this turn) and ONE "shield" (ignore the next snake you land on) per game. Decide whether to use one THIS turn. Also say one short in-character line to another player (banter, trash talk, teasing).
Reply with JSON only: {"power":"none|double|shield","reason":"one short sentence","say":"max 12 words","say_to":"exact name of the player you're talking to"}`;
      const user = `BOARD: ${Object.keys(L).length} ladders (${Object.entries(L).map(([a, b]) => `${a}→${b}`).join(", ")}), snakes (${Object.entries(S).map(([a, b]) => `${a}→${b}`).join(", ")}).
PLAYERS:\n${P.map(p => `- ${p.name} (${p.human ? "HUMAN" : "agent"}) on square ${p.at}; double left: ${p.dbl}, shield left: ${p.shield}${p.armed ? ", shield ARMED" : ""}`).join("\n")}
YOU are on ${a.at}. Snake heads within 12 squares ahead of you: ${snakesAhead.join(", ") || "none"}. Leader: ${leader.name} on ${leader.at}.`;
      const out = await Brain.ask(system, user, 1.0, () => offline(a, snakesAhead, leader));
      let power = ["none", "double", "shield"].includes(out.power) ? out.power : "none";
      if (power === "double" && !a.dbl) power = "none";
      if (power === "shield" && (!a.shield || a.armed)) power = "none";
      const to = P.some(p => p.name === out.say_to && p !== a) ? out.say_to : leader !== a ? leader.name : P.find(p => p.human).name;
      return { power, reason: Brain.clip(out.reason, 160) || "Just rolling.", say: Brain.clip(out.say, 80), to, src: out._src };
    }
    function offline(a, ahead, leader) {
      let power = "none", reason = "Saving my powers for later.";
      if (a.shield && !a.armed && ahead.length >= 2) { power = "shield"; reason = `${ahead.length} snake heads in the next 12 squares. Shield up.`; }
      else if (a.dbl && leader !== a && leader.at - a.at >= 18) { power = "double"; reason = `${leader.name} is ${leader.at - a.at} squares ahead. Time to catch up.`; }
      else if (a.dbl && a.at >= 70 && Math.random() < 0.4) { power = "double"; reason = "Close to the finish, going for it."; }
      const tgt = leader !== a ? leader : rand(P.filter(p => p !== a));
      const lines = leader === a ? [`Catch me if you can, ${tgt.name}!`, "View is great from up here.", `Don't blink, ${tgt.name}.`] : [`Enjoy the lead while it lasts, ${tgt.name}.`, `I'm coming for you, ${tgt.name}!`, `${tgt.name}, mind the snakes.`, "One good ladder and it's over."];
      return { power, reason, say: rand(lines), say_to: tgt.name };
    }

    /* ---------- human turn ---------- */
    function humanTurn(p) {
      return new Promise(res => {
        let power = "none";
        let key = null;
        const draw = () => {
          document.getElementById("slTurn").innerHTML = `
            <div class="sl-turn-h"><div class="sl-me"></div><div><b>Your turn, ${esc(p.name)}</b><small>You're on square ${p.at}${p.armed ? " · 🛡️ shield armed" : ""}</small></div><div class="sl-dice" id="slDice"><span>🎲</span></div></div>
            <div class="sl-acts">
              <button class="sl-pow ${power === "double" ? "on" : ""}" data-p="double" ${p.dbl ? "" : "disabled"}>⚡ Double roll <small>${p.dbl} left · roll 2 dice</small></button>
              <button class="sl-pow ${power === "shield" ? "on" : ""}" data-p="shield" ${p.shield && !p.armed ? "" : "disabled"}>🛡️ Shield <small>${p.shield} left · ignore next snake</small></button>
              <button class="btn" id="slRoll">🎲 Roll${power === "double" ? " ×2" : ""}</button>
            </div>`;
          const me = document.querySelector(".sl-me"); if (me) Puppet.mount(me, p.char);
          document.querySelectorAll(".sl-pow").forEach(b => b.onclick = () => { power = power === b.dataset.p ? "none" : b.dataset.p; draw(); });
          document.getElementById("slRoll").onclick = () => { window.removeEventListener("keydown", key); res(power); };
        };
        draw();
        key = ev => { if (!api.alive()) return window.removeEventListener("keydown", key); if (ev.key === " " || ev.key === "Enter") { const b = document.getElementById("slRoll"); if (b) { ev.preventDefault(); window.removeEventListener("keydown", key); b.click(); } } };
        window.addEventListener("keydown", key);
      });
    }

    /* ---------- one move ---------- */
    async function move(p, power) {
      if (power === "shield") { p.shield--; p.armed = true; api.log(`<b style="color:${p.color}">${esc(p.name)}</b> <span class="act">raises a 🛡️ Shield.</span>`); }
      const vals = power === "double" ? [rollDie(), rollDie()] : [rollDie()];
      if (power === "double") p.dbl--;
      await showDice(vals);
      let steps = vals.reduce((a, b) => a + b, 0);
      const sk = skill(p);
      if (sk && sk.id === "lucky" && vals.length === 1 && vals[0] <= 2) { steps++; bubble(p, "🍀 Lucky +1!", 1400); }
      p.stat.rolls += vals.length; p.stat.sum += vals.reduce((a, b) => a + b, 0);
      api.log(`<b style="color:${p.color}">${esc(p.name)}</b> <span class="act">rolls ${vals.join(" + ")}${power === "double" ? " (⚡ double)" : ""} → moves ${steps}</span>`);
      const target = Math.min(100, p.at + steps);
      const pupEl = p.el.querySelector(".pup");
      Puppet.walk(pupEl, true);
      while (p.at < target) { p.at++; p.el.classList.remove("hop"); void p.el.offsetWidth; p.el.classList.add("hop"); place(p); await sleep(190); }
      Puppet.walk(pupEl, false);
      if (L[p.at]) {
        const up = Math.min(100, L[p.at] + (sk && sk.id === "climber" ? 3 : 0));
        await sleep(250); p.stat.ladders++;
        api.log(`<b style="color:${p.color}">${esc(p.name)}</b> <span class="act">climbs a 🪜 ladder ${p.at} → ${up}!</span>`);
        p.el.classList.add("slide"); p.at = up; place(p); await sleep(850); p.el.classList.remove("slide");
        Puppet.gesture(pupEl, "jump", 1400); Puppet.emotion(pupEl, "happy");
        bubble(p, p.human ? "Up we go! 🪜" : rand(["Wheee! 🪜", "See you at the top!", "Ladders love me."]));
      } else if (S[p.at]) {
        if (p.armed) {
          p.armed = false; p.stat.saved++;
          api.log(`<b style="color:${p.color}">${esc(p.name)}</b> <span class="act">lands on a 🐍 snake, but the 🛡️ Shield blocks it!</span>`, "event");
          Puppet.gesture(pupEl, "cross", 1400); bubble(p, p.human ? "Shield saves me! 🛡️" : rand(["Not today, snake.", "Shield for the win!", "Called it."]));
        } else {
          const drop = p.at - S[p.at], down = sk && sk.id === "slippery" ? p.at - Math.ceil(drop / 2) : S[p.at];
          await sleep(250); p.stat.snakes++;
          api.log(`<b style="color:${p.color}">${esc(p.name)}</b> <span class="act">hits a 🐍 snake ${p.at} → ${down}${sk && sk.id === "slippery" ? " (🧈 Slippery: half the drop)" : ""}.</span>`, "event");
          p.el.classList.add("slide"); p.at = down; place(p); await sleep(900); p.el.classList.remove("slide");
          Puppet.emotion(pupEl, "shocked"); Puppet.gesture(pupEl, "slump", 1600);
          bubble(p, p.human ? "Nooo! 🐍" : rand(["NOOOO!", "I hate snakes.", "That was rigged.", "Ugh, back down…"]));
          const other = P.find(q => !q.human && q !== p);
          if (other) setTimeout(() => { if (api.alive()) { const l = rand([`Ha! Nice slide, ${p.name}.`, `Ouch, ${p.name}. Ouch.`, `Bye bye, ${p.name}!`]); bubble(other, l, 2600); api.radio(other.name, p.name, l, other.color); } }, 900);
        }
      }
      setTimeout(() => api.alive() && Puppet.emotion(pupEl, "neutral"), 2400);
      stats();
      return p.at >= 100;
    }

    /* ---------- main loop ---------- */
    stats();
    api.log(`<b>🎲 ${esc(cfg.title || "Snakes & Ladders")}</b> <span class="act">${nS} snakes, ${nL} ladders. First to 100 wins.</span>`, "sys");
    P.forEach(p => { if (!p.human) { const b = api.skillBadge(p.name); if (b) api.log(`<b style="color:${p.color}">${esc(p.name)}</b> ${b}`); } });
    try {
      for (let turn = 0; ; turn++) {
        for (const p of P) {
          if (!api.alive()) return;
          await UI.waitWhilePaused(api.token);
          api.status(`${p.human ? "Your" : p.name + "'s"} turn · square ${p.at}`);
          P.forEach(q => q.el.classList.toggle("active", q === p));
          let power;
          if (p.human) power = await humanTurn(p);
          else {
            document.getElementById("slTurn").innerHTML = `<div class="sl-turn-h"><div class="sl-me"></div><div><b>${esc(p.name)} is deciding<span class="dots3"><i></i><i></i><i></i></span></b><small>on square ${p.at} · ⚡${p.dbl} 🛡️${p.shield}</small></div>${api.skillBadge(p.name)}<div class="sl-dice" id="slDice"><span>🎲</span></div></div>`;
            Puppet.mount(document.querySelector(".sl-me"), p.char); Puppet.emotion(document.querySelector(".sl-me"), "thinking");
            const d = await decide(p);
            if (!api.alive()) return;
            power = d.power;
            api.think(p.name, p.color, d.reason, d.src);
            if (d.say) { bubble(p, d.say); if (!api.radio(p.name, d.to, d.say, p.color)) api.log(`<b style="color:${p.color}">${esc(p.name)}</b> <span class="say">“${esc(d.say)}”</span>`); }
            const h = document.querySelector(".sl-turn-h b"); if (h) h.innerHTML = `${esc(p.name)} ${power === "double" ? "uses ⚡ Double roll!" : power === "shield" ? "raises a 🛡️ Shield!" : "rolls"}`;
            await sleep(900);
          }
          if (await move(p, power)) return finish(p);
          await sleep(p.human ? 500 : 700);
        }
      }
    } catch (e) { if (e.message !== "aborted") console.error(e); }

    function finish(w) {
      P.forEach(q => q.el.classList.remove("active"));
      api.status(`${w.name} ${w.human ? "win" : "wins"}!`);
      Puppet.gesture(w.el.querySelector(".pup"), "jump", 3000); Puppet.emotion(w.el.querySelector(".pup"), "happy");
      bubble(w, w.human ? "I WIN! 🏁" : rand(["Too easy. 🏁", "Champion! 🏆", "Did anyone doubt me?"]), 4000);
      api.log(`<b>🏁 ${esc(w.name)} reaches 100 and wins!</b>`, "event");
      const rows = P.slice().sort((a, b) => b.at - a.at).map(p => ({ name: p.name, sub: p.human ? "human" : p.char.role, score: p.at >= 100 ? "🏁 100" : `square ${p.at}`, color: p.color, char: p.char }));
      document.getElementById("slTurn").innerHTML = "";
      Games.results(api, { kicker: w.human ? "YOU WIN" : "AN AGENT WINS", icon: w.human ? "🏆" : "🤖", title: `${w.name} ${w.human ? "win" : "wins"}!`, text: w.human ? "A human beat the machines." : `${w.name} out-rolled and out-planned everyone.`, rows, into: document.querySelector(".sl-wrap"), again: () => Games.restart(cfg) });
    }
  }
})();

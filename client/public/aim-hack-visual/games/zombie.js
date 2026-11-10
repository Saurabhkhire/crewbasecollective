/* TRACK 2 · Zombie Survival — co-op top-down shooter.
   You + 2–3 AI agent teammates survive waves. Everyone auto-fires at the nearest enemy.
   Between waves each agent picks its own plan (hunt / guard / medic / hold a side) via Brain.ask. */
(function () {
  const W = 960, H = 600;
  const DIFF = { easy: { hp: 0.8, spd: 0.85, n: 0.7, dmg: 0.7 }, normal: { hp: 1, spd: 1, n: 1, dmg: 1 }, hard: { hp: 1.3, spd: 1.15, n: 1.35, dmg: 1.3 } };
  const SIDES = { north: [W / 2, 110], south: [W / 2, H - 100], east: [W - 130, H / 2], west: [130, H / 2] };
  const PLANS = ["hunt", "guard", "medic", "hold"];
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rand = a => a[Math.floor(Math.random() * a.length)];

  Games.register({
    id: "zombie", title: "Zombie Survival", icon: "🧟", color: "#b6ff5c",
    blurb: "You and your AI squad survive 5 waves of zombies.",
    rules: ["Move with WASD / arrow keys (or drag on the screen)", "Everyone shoots the nearest enemy automatically", "Grab ➕ medkits · stand next to a downed teammate to revive them", "Survive every wave to win"],
    agents: "Before each wave every agent picks its own plan (hunt, guard someone, be the medic or hold a side) and shouts it to the team.",
    minAgents: 2, maxAgents: 3, needsScene: true,
    defaults: { agents: ["hale", "imani", "kit"], sceneId: "s-city", waves: 5, difficulty: "normal", enemy: { name: "zombie", emoji: "🧟" } },
    start
  });

  async function start(cfg) {
    const D = DIFF[cfg.difficulty] || DIFF.normal;
    const enemy = cfg.enemy || { name: "zombie", emoji: "🧟" };
    const WAVES = cfg.waves || 5;
    let api;
    const pauseOverlay = p => { const o = document.getElementById("zPaused"); if (o) o.hidden = !p; };
    api = Games.shell(cfg, {
      status: "Getting ready…", pause: true, onPause: pauseOverlay,
      main: `<div class="z-wrap"><canvas id="zc" width="${W}" height="${H}"></canvas>
        <div class="z-paused" id="zPaused" hidden><b>⏸ Paused</b><small>Press Resume (or click here) to continue</small></div>
        <div class="z-help">🕹️ <b>WASD / arrows</b> or drag to move · shooting is automatic · stand on a downed teammate to revive</div></div>
        <div class="z-team" id="zTeam"></div>`,
      ownLines: true,
      onRadio: (from, to) => { const a = P.find(p => p.name === from); if (!a) return; const tgts = to ? P.filter(p => p.name === to) : P.filter(p => p !== a); tgts.forEach(b => links.push({ a, b, t: 1.8 })); }
    });
    document.getElementById("zPaused").onclick = () => { UI.ctl.paused = false; const b = document.getElementById("gmPause"); if (b) b.textContent = "⏸ Pause"; pauseOverlay(false); };

    const cv = document.getElementById("zc"), ctx = cv.getContext("2d");
    api.stage(document.querySelector(".z-wrap"), () => null);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);

    /* ---------- players ---------- */
    const humanChar = { name: cfg.human.name, role: "Human player", look: { species: "human", skin: "#e8b08a", hair: "short", hairColor: "#3d2618", outfit: "jacket", outfitColor: "#f2f2f2", acc: "cap", build: "regular", eyes: "normal", facial: "none" } };
    const mk = (c, i, human) => {
      const sk = human ? null : api.skill(c.name);
      const maxHp = sk && sk.id === "tank" ? 160 : 100;
      return { char: c, name: c.name, human, i, x: W / 2 + (i - 1.5) * 110, y: H / 2 + 40 + (i % 2) * 50, hp: maxHp, maxHp, down: false, revive: 0, cd: Math.random() * 0.3, face: 1, moving: false,
        color: human ? "#ffffff" : PLAY.colors[(i + 1) % PLAY.colors.length], plan: { plan: "hunt", target: "" }, say: null, callCd: 0,
        stat: { kills: 0, dmg: 0, taken: 0, revives: 0 }, img: null };
    };
    const P = [mk(humanChar, 0, true)].concat(cfg.agents.map((c, i) => mk(c, i + 1, false)));
    const me = P[0];
    await Promise.all(P.map(async p => { p.img = await Puppet.toImage(p.char, 172); }));
    const bg = await Scenes.toImage(cfg.scene, W, H);
    if (!api.alive()) return;

    let E = [], B = [], K = [], links = [], floats = [];
    let wave = 0, state = "plan", banner = null, toSpawn = 0, spawnT = 0, medT = 6, t = 0, ended = false;
    const team = () => P.filter(p => !p.down);
    const skillOf = p => (p.human ? null : api.skill(p.name));

    /* ---------- input ---------- */
    const keys = new Set();
    let touch = null;
    const onKey = ev => {
      if (!api.alive()) return cleanup();
      const k = ev.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "].includes(k)) {
        if (ev.target && /input|textarea/i.test(ev.target.tagName)) return;
        ev.preventDefault();
        ev.type === "keydown" ? keys.add(k) : keys.delete(k);
      }
    };
    const toLocal = ev => { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) / r.width * W, y: (ev.clientY - r.top) / r.height * H }; };
    cv.addEventListener("pointerdown", ev => { touch = toLocal(ev); cv.setPointerCapture(ev.pointerId); });
    cv.addEventListener("pointermove", ev => { if (touch) touch = toLocal(ev); });
    cv.addEventListener("pointerup", () => { touch = null; });
    cv.addEventListener("pointercancel", () => { touch = null; });
    const onBlur = () => { if (!api.alive()) return cleanup(); if (state !== "won" && state !== "lost") { UI.ctl.paused = true; const b = document.getElementById("gmPause"); if (b) b.textContent = "▶ Resume"; pauseOverlay(true); } keys.clear(); };
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKey); window.addEventListener("blur", onBlur);
    function cleanup() { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); window.removeEventListener("blur", onBlur); }

    /* ---------- talking ---------- */
    function say(p, text, to) {
      if (!text) return;
      p.say = { text, t: 3.2 };
      api.radio(p.name, to || "", text, p.color);
      if (!p.human) UI.speak(text, Games.voiceIdx(p.name));
    }

    /* ---------- agent planning (between waves) ---------- */
    async function planWave() {
      state = "plan";
      api.status(`Wave ${wave + 1} of ${WAVES} · agents are planning`);
      const agents = P.filter(p => !p.human);
      const teamTxt = P.map(p => `- ${p.name} (${p.human ? "HUMAN" : p.char.role}): health ${Math.round(p.hp)}/${p.maxHp}${p.down ? " DOWN" : ""}, kills ${p.stat.kills}`).join("\n");
      const jobs = agents.map(a => {
        const sk = skillOf(a);
        const system = `You are ${a.name}, the ${a.char.role}, an AI teammate (an equal player, not an NPC) in a co-op top-down survival game against ${enemy.name}s.
Personality: ${a.char.personality || "brave"}
Your goal: ${a.char.goal || "help the team survive"}${sk ? `\nYour skill: ${sk.name} (${sk.does})` : ""}
Pick YOUR plan for the next wave, in character. Plans: "hunt" (chase enemies), "guard" (protect a teammate; target = their exact name), "medic" (stay with the most hurt teammate and revive), "hold" (defend one side; target = north|south|east|west).
Reply with JSON only: {"plan":"hunt|guard|medic|hold","target":"name or side or empty","shout":"what you shout to the team, max 9 words","why":"one short sentence of private reasoning"}`;
        const user = `WAVE ${wave + 1} of ${WAVES} is coming (${Math.round((8 + (wave + 1) * 5) * D.n)} ${enemy.name}s${wave >= 1 ? ", some fast ones" : ""}${wave >= 2 ? ", some big ones" : ""}).
TEAM:\n${teamTxt}
${wave ? `LAST WAVE: team kills ${P.reduce((s, p) => s + p.stat.kills, 0)}, revives ${P.reduce((s, p) => s + p.stat.revives, 0)}.` : "This is the first wave."}`;
        const timeout = new Promise(r => setTimeout(() => r(null), 9000));
        return Promise.race([Brain.ask(system, user, 1.0, () => offlinePlan(a)), timeout]).then(o => o || { ...offlinePlan(a), _src: "offline" });
      });
      const outs = await Promise.all(jobs);
      if (!api.alive()) return;
      outs.forEach((o, i) => {
        const a = agents[i];
        let plan = PLANS.includes(o.plan) ? o.plan : "hunt", target = String(o.target || "");
        if (plan === "guard" && !P.some(p => p.name === target && p !== a)) target = me.name;
        if (plan === "hold" && !SIDES[target]) target = rand(Object.keys(SIDES));
        a.plan = { plan, target };
        const shout = Brain.clip(o.shout, 70) || "Let's go!";
        say(a, shout, plan === "guard" ? target : "");
        api.log(`<span class="ts">W${wave + 1}</span><b style="color:${a.color}">${UI.esc(a.name)}</b> ${planLabel(a)} <span class="say">“${UI.esc(shout)}”</span>`);
        api.think(a.name, a.color, Brain.clip(o.why, 160) || "Sticking to my style.", o._src);
      });
      renderTeam();
      wave++;
      banner = { text: `WAVE ${wave}`, sub: `${Math.round((8 + wave * 5) * D.n)} ${enemy.name}s ${enemy.emoji}`, t: 2.4 };
      toSpawn = Math.round((8 + wave * 5) * D.n); spawnT = 0.5;
      state = "fight";
      api.status(`Wave ${wave} of ${WAVES}`);
    }
    function offlinePlan(a) {
      const txt = `${a.char.personality} ${a.char.goal} ${a.char.role}`.toLowerCase();
      const hurt = P.filter(p => p.hp < p.maxHp * 0.5 || p.down);
      const sk = skillOf(a);
      let plan;
      if ((sk && sk.id === "medic") || /heal|doctor|medic|compassion|kind|nurse/.test(txt) || hurt.length >= 2) plan = "medic";
      else if (/aggress|fear|warlord|soldier|strength|fight|brave|reckless/.test(txt)) plan = "hunt";
      else if (/protect|loyal|friend|together|help/.test(txt)) plan = "guard";
      else plan = rand(["hunt", "hold", "guard"]);
      const target = plan === "guard" ? (hurt.find(p => p !== a) || me).name : plan === "hold" ? rand(Object.keys(SIDES)) : "";
      const shouts = { hunt: ["I'll thin them out!", "Leave the big ones to me!", "Hunting time."], guard: [`I've got you, ${target}!`, `Sticking to ${target}.`, `Nobody touches ${target}.`], medic: ["I'll keep everyone standing.", "Medic on duty!", "Shout if you're hurt!"], hold: [`Holding the ${target} side!`, `${target} is mine.`, `Watching ${target}.`] };
      return { plan, target, shout: rand(shouts[plan]), why: plan === "medic" ? "The team is hurt, someone has to keep them up." : plan === "hunt" ? "Best defence is a good offence." : plan === "guard" ? `${target} needs cover the most.` : `Nobody is covering the ${target} side.` };
    }
    const planLabel = a => ({ hunt: "🎯 hunts", guard: `🛡️ guards ${UI.esc(a.plan.target)}`, medic: "💉 plays medic", hold: `🚩 holds the ${UI.esc(a.plan.target)}` }[a.plan.plan]);

    function renderTeam() {
      const el = document.getElementById("zTeam"); if (!el) return;
      el.innerHTML = P.map(p => `<div class="z-mate ${p.down ? "down" : ""}" style="--c:${p.color}"><b>${UI.esc(p.name)}</b>${p.human ? `<small>you</small>` : `<small>${planLabel(p)}</small>`}
        <div class="z-hp"><i style="width:${Math.max(0, p.hp / p.maxHp * 100)}%"></i></div>${p.human ? "" : api.skillBadge(p.name)}</div>`).join("");
    }

    /* ---------- spawning ---------- */
    function spawn() {
      const side = Math.floor(Math.random() * 4);
      const x = side === 0 ? -20 : side === 1 ? W + 20 : Math.random() * W, y = side === 2 ? -20 : side === 3 ? H + 20 : Math.random() * H;
      const roll = Math.random();
      const type = wave >= 3 && roll < 0.12 ? "big" : wave >= 2 && roll < 0.32 ? "fast" : "norm";
      const T = { norm: { r: 15, hp: 5, sp: 78, dps: 15 }, fast: { r: 12, hp: 3, sp: 138, dps: 12 }, big: { r: 25, hp: 22, sp: 46, dps: 28 } }[type];
      const e = { x, y, type, r: T.r, hp: Math.ceil(T.hp * D.hp * (1 + (wave - 1) * 0.12)), max: Math.ceil(T.hp * D.hp * (1 + (wave - 1) * 0.12)), sp: T.sp * D.spd * (1 + wave * 0.04), dps: T.dps * D.dmg, flash: 0, wob: Math.random() * 6 };
      E.push(e);
      if (type === "big") { const a = P.filter(p => !p.human && !p.down); if (a.length) { const s = rand(a); if (s.callCd <= 0) { s.callCd = 6; say(s, rand([`Big ${enemy.name} incoming!`, "Focus the big one!", "Heavy one coming!"])); } } }
    }

    /* ---------- update ---------- */
    function nearestEnemy(p, range) { let best = null, bd = range; for (const e of E) { const d = dist(p, e); if (d < bd) { bd = d; best = e; } } return best; }
    function moveTo(p, tx, ty, speed, dt) {
      const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
      if (d < 6) { p.moving = false; return; }
      const s = Math.min(d, speed * dt);
      p.x += dx / d * s; p.y += dy / d * s; p.moving = true;
      if (Math.abs(dx) > 2) p.face = dx < 0 ? -1 : 1;
    }
    function agentGoal(a) {
      const downed = P.filter(p => p.down && p !== a);
      const claimed = d => api && cfg.tools.has("band") && P.some(o => o !== a && !o.down && o.reviving === d);
      const nearDown = downed.filter(d => (a.plan.plan === "medic" || dist(a, d) < 240) && !claimed(d)).sort((x, y) => dist(a, x) - dist(a, y))[0];
      a.reviving = null;
      if (nearDown) {
        a.reviving = nearDown;
        if (a.callCd <= 0) { a.callCd = 7; say(a, rand([`Covering ${nearDown.name}!`, `Hang on ${nearDown.name}!`, `Getting ${nearDown.name} up!`]), nearDown.name); }
        return [nearDown.x + 14, nearDown.y];
      }
      if (a.hp < a.maxHp * 0.35 && K.length) {
        if (a.callCd <= 0) { a.callCd = 8; say(a, rand(["I need a medkit!", "Running low!", "I'm hurt, cover me!"])); }
        const k = K.slice().sort((x, y) => dist(a, x) - dist(a, y))[0]; return [k.x, k.y];
      }
      const pl = a.plan;
      if (pl.plan === "guard" || pl.plan === "medic") {
        const tgt = pl.plan === "guard" ? P.find(p => p.name === pl.target && !p.down) : P.filter(p => p !== a && !p.down).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
        if (tgt) { const ang = a.i * 2.1 + t * 0.4; return [tgt.x + Math.cos(ang) * 62, tgt.y + Math.sin(ang) * 46]; }
      }
      if (pl.plan === "hold") { const s = SIDES[pl.target] || SIDES.north; return [s[0] + Math.cos(t * 0.7 + a.i) * 40, s[1] + Math.sin(t * 0.9 + a.i) * 24]; }
      const e = nearestEnemy(a, 2000);
      if (e) { const d = dist(a, e) || 1, keep = 150; return [e.x + (a.x - e.x) / d * keep, e.y + (a.y - e.y) / d * keep]; }
      return [W / 2 + Math.cos(t * 0.5 + a.i * 2) * 120, H / 2 + Math.sin(t * 0.5 + a.i * 2) * 80];
    }

    function update(dt) {
      t += dt;
      if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
      links.forEach(l => (l.t -= dt)); links = links.filter(l => l.t > 0);
      floats.forEach(f => { f.t -= dt; f.y -= 30 * dt; }); floats = floats.filter(f => f.t > 0);
      P.forEach(p => { if (p.say) { p.say.t -= dt; if (p.say.t <= 0) p.say = null; } p.callCd -= dt; });
      if (state !== "fight") return;

      // spawns
      if (toSpawn > 0) { spawnT -= dt; if (spawnT <= 0 && !banner) { const burst = Math.min(toSpawn, wave >= 2 && Math.random() < 0.5 ? 3 : Math.random() < 0.6 ? 2 : 1); for (let k = 0; k < burst; k++) spawn(); toSpawn -= burst; spawnT = Math.max(0.45, 1.35 - wave * 0.15) * (0.6 + Math.random() * 0.8); } }
      medT -= dt; if (medT <= 0 && K.length < 3) { K.push({ x: 80 + Math.random() * (W - 160), y: 80 + Math.random() * (H - 160), t: 0 }); medT = 11 + Math.random() * 6; }
      K.forEach(k => (k.t += dt));

      // human
      if (!me.down) {
        let dx = 0, dy = 0;
        if (keys.has("a") || keys.has("arrowleft")) dx--; if (keys.has("d") || keys.has("arrowright")) dx++;
        if (keys.has("w") || keys.has("arrowup")) dy--; if (keys.has("s") || keys.has("arrowdown")) dy++;
        if (dx || dy) { const d = Math.hypot(dx, dy); me.x += dx / d * 175 * dt; me.y += dy / d * 175 * dt; me.moving = true; if (dx) me.face = dx; }
        else if (touch) moveTo(me, touch.x, touch.y, 175, dt);
        else me.moving = false;
      }
      // agents
      for (const a of P) {
        if (a.human || a.down) continue;
        const sk = skillOf(a);
        const [gx, gy] = agentGoal(a);
        moveTo(a, gx, gy, 150 * (sk && sk.id === "scout" ? 1.35 : 1), dt);
        // dodge enemies that get too close
        for (const e of E) { const d = dist(a, e); if (d < e.r + 34 && d > 0) { a.x += (a.x - e.x) / d * 90 * dt; a.y += (a.y - e.y) / d * 90 * dt; } }
        if (sk && sk.id === "medic") for (const m of P) if (!m.down && dist(m, a) < 95 && m.hp < m.maxHp) { m.hp = Math.min(m.maxHp, m.hp + 5 * dt); if (m !== a) { a.skT = 0.6; api.skillUsed(a.name, `healing ${m.name}`); } }
      }
      // keep apart + in bounds
      for (const p of P) {
        for (const q of P) if (p !== q && !p.down && !q.down) { const d = dist(p, q); if (d < 30 && d > 0) { p.x += (p.x - q.x) / d * 40 * dt; p.y += (p.y - q.y) / d * 40 * dt; } }
        p.x = clamp(p.x, 24, W - 24); p.y = clamp(p.y, 50, H - 20);
      }
      // shooting
      for (const p of P) {
        if (p.down) continue;
        const sk = skillOf(p);
        p.cd -= dt;
        const range = sk && sk.id === "sharp" ? 290 : 220;
        const e = nearestEnemy(p, range);
        if (e && p.cd <= 0) {
          p.cd = (sk && sk.id === "sharp" ? 0.36 : 0.55) * (p.human ? 0.9 : 1);
          if (sk && sk.id === "sharp" && dist(p, e) > 220) { p.skT = 0.5; api.skillUsed(p.name, "long-range shot only a Sharpshooter can make"); }
          const d = dist(p, e) || 1;
          B.push({ x: p.x, y: p.y - 26, vx: (e.x - p.x) / d * 640, vy: (e.y - p.y + 26) / d * 640, owner: p, life: 0.7 });
          p.face = e.x < p.x ? -1 : 1;
        }
      }
      // bullets
      for (const b of B) {
        b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
        for (const e of E) if (e.hp > 0 && Math.hypot(b.x - e.x, b.y - e.y) < e.r + 4) {
          e.hp--; e.flash = 0.12; b.life = 0; b.owner.stat.dmg++;
          if (e.hp <= 0) { b.owner.stat.kills++; floats.push({ x: e.x, y: e.y - 10, text: "💥", t: 0.6 }); }
          break;
        }
      }
      B = B.filter(b => b.life > 0); E = E.filter(e => e.hp > 0);
      // enemies
      for (const e of E) {
        e.flash -= dt; e.wob += dt * 8;
        const alive = P.filter(p => !p.down);
        if (!alive.length) break;
        const tgt = alive.reduce((a, b) => (dist(e, a) < dist(e, b) ? a : b));
        const d = dist(e, tgt) || 1;
        if (d > e.r + 14) { e.x += (tgt.x - e.x) / d * e.sp * dt; e.y += (tgt.y - e.y) / d * e.sp * dt; }
        else { tgt.hp -= e.dps * dt; tgt.stat.taken += e.dps * dt; }
        for (const o of E) if (o !== e) { const dd = Math.hypot(e.x - o.x, e.y - o.y); if (dd < e.r + o.r - 4 && dd > 0) { e.x += (e.x - o.x) / dd * 30 * dt; e.y += (e.y - o.y) / dd * 30 * dt; } }
      }
      // downs & revives
      for (const p of P) {
        if (!p.down && p.hp <= 0) {
          p.down = true; p.hp = 0; p.revive = 0;
          floats.push({ x: p.x, y: p.y - 60, text: "DOWN!", t: 1.4, c: "#ff6b6b" });
          api.log(`<span class="ts">W${wave}</span><b style="color:${p.color}">${UI.esc(p.name)}</b> <span class="act">is down! Stand next to them to revive.</span>`, "event");
          if (p.human) say(P.find(a => !a.human && !a.down) || p, rand([`${p.name} is down! I'm coming!`, `Hold on ${p.name}!`]), p.name);
          renderTeam();
        }
        if (p.down) {
          const helper = P.find(h => !h.down && dist(h, p) < 40);
          if (helper) {
            const sk = skillOf(helper);
            p.revive += dt * (sk && sk.id === "scout" ? 1.6 : 1);
            if (sk && sk.id === "scout") { helper.skT = 0.6; api.skillUsed(helper.name, `fast revive on ${p.name}`); }
            if (p.revive >= 2.4) { p.down = false; p.hp = p.maxHp * 0.45; helper.stat.revives++; floats.push({ x: p.x, y: p.y - 60, text: "REVIVED", t: 1.2, c: "#b6ff5c" }); api.log(`<b style="color:${helper.color}">${UI.esc(helper.name)}</b> <span class="act">revived ${UI.esc(p.name)} 💚</span>`); renderTeam(); }
          } else p.revive = Math.max(0, p.revive - dt * 0.5);
        }
      }
      // medkits
      for (const k of K) for (const p of P) if (!p.down && !k.used && dist(p, k) < 26) { k.used = true; const h = Math.min(35, p.maxHp - p.hp); p.hp += h; floats.push({ x: k.x, y: k.y - 10, text: "+" + Math.round(h), t: 1, c: "#b6ff5c" }); }
      K = K.filter(k => !k.used && k.t < 20);

      if (!P.some(p => !p.down)) return finish(false);
      if (toSpawn === 0 && !E.length && !banner) {
        P.forEach(p => { if (!p.down) p.hp = Math.min(p.maxHp, p.hp + 30); });
        api.log(`<b>✅ Wave ${wave} cleared!</b> <span class="act">Everyone standing heals a little.</span>`, "sys");
        if (wave >= WAVES) return finish(true);
        P.forEach(p => { if (p.down) { p.down = false; p.hp = p.maxHp * 0.3; } });
        state = "plan"; planWave();
      }
    }

    /* ---------- draw ---------- */
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function draw() {
      if (bg) ctx.drawImage(bg, 0, 0, W, H); else { ctx.fillStyle = "#101626"; ctx.fillRect(0, 0, W, H); }
      ctx.fillStyle = "rgba(6,9,20,.55)"; ctx.fillRect(0, 0, W, H);
      const vg = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 620); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.55)"); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      // medkits
      for (const k of K) {
        const pulse = 1 + Math.sin(t * 5) * 0.08;
        ctx.save(); ctx.translate(k.x, k.y); ctx.scale(pulse, pulse);
        ctx.shadowColor = "#b6ff5c"; ctx.shadowBlur = 16; ctx.fillStyle = "#f4f7ff"; rr(-13, -13, 26, 26, 6); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = "#e5394b"; ctx.fillRect(-3.5, -9, 7, 18); ctx.fillRect(-9, -3.5, 18, 7); ctx.restore();
      }
      // BAND links
      for (const l of links) {
        if (l.a.down && l.b.down) continue;
        ctx.save(); ctx.globalAlpha = Math.min(1, l.t); ctx.strokeStyle = "#5c8dff"; ctx.lineWidth = 3; ctx.shadowColor = "#5c8dff"; ctx.shadowBlur = 14;
        ctx.setLineDash([8, 8]); ctx.lineDashOffset = -t * 60;
        ctx.beginPath(); ctx.moveTo(l.a.x, l.a.y - 30); ctx.quadraticCurveTo((l.a.x + l.b.x) / 2, Math.min(l.a.y, l.b.y) - 90, l.b.x, l.b.y - 30); ctx.stroke(); ctx.restore();
        { const k = 1 - ((l.t * 1.4) % 1), cx = (l.a.x + l.b.x) / 2, cy = Math.min(l.a.y, l.b.y) - 90, ax = l.a.x, ay = l.a.y - 30, bx = l.b.x, by = l.b.y - 30;
          const px = (1 - k) * (1 - k) * ax + 2 * (1 - k) * k * cx + k * k * bx, py = (1 - k) * (1 - k) * ay + 2 * (1 - k) * k * cy + k * k * by;
          ctx.save(); ctx.globalAlpha = Math.min(1, l.t); ctx.fillStyle = "#fff"; ctx.shadowColor = "#5c8dff"; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(px, py, 5, 0, 7); ctx.fill(); ctx.restore(); }
      }
      // entities sorted by y
      const ents = E.map(e => ({ y: e.y, e })).concat(P.map(p => ({ y: p.y, p }))).sort((a, b) => a.y - b.y);
      for (const it of ents) it.e ? drawEnemy(it.e) : drawPlayer(it.p);
      // bullets
      ctx.lineCap = "round";
      for (const b of B) { ctx.strokeStyle = b.owner.human ? "#ffffff" : b.owner.color; ctx.lineWidth = 3; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 8; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.018, b.y - b.vy * 0.018); ctx.stroke(); }
      ctx.shadowBlur = 0;
      // speech bubbles
      const placed = [];
      for (const p of P.filter(q => q.say).sort((a, b) => a.y - b.y)) {
        let y = p.y - 104;
        ctx.font = "600 13px 'Space Grotesk', sans-serif";
        const w = Math.min(230, ctx.measureText(p.say.text).width + 20);
        const x = clamp(p.x, w / 2 + 6, W - w / 2 - 6);
        for (let k = 0; k < 6 && placed.some(r => Math.abs(r.x - x) < (r.w + w) / 2 && Math.abs(r.y - y) < 30); k++) y -= 30;
        placed.push({ x, y, w });
        bubble(x, y, p.say.text, p.color, Math.min(1, p.say.t * 2));
      }
      // floats
      ctx.textAlign = "center";
      for (const f of floats) { ctx.globalAlpha = Math.min(1, f.t * 2); ctx.font = "700 16px 'Space Grotesk', sans-serif"; ctx.fillStyle = f.c || "#fff"; ctx.fillText(f.text, f.x, f.y); }
      ctx.globalAlpha = 1;
      // HUD
      ctx.textAlign = "left"; ctx.font = "700 15px 'JetBrains Mono', monospace"; ctx.fillStyle = "rgba(0,0,0,.5)"; rr(12, 12, 250, 30, 15); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillText(`WAVE ${Math.max(1, wave)}/${WAVES}   ${enemy.emoji} ${E.length + toSpawn} left`, 26, 32);
      if (state === "plan" && !ended) { ctx.textAlign = "center"; ctx.font = "700 20px 'Space Grotesk', sans-serif"; ctx.fillStyle = "rgba(0,0,0,.55)"; rr(W / 2 - 230, H / 2 - 26, 460, 52, 26); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillText(`🧠 Agents are planning wave ${wave + 1}…`, W / 2, H / 2 + 7); }
      if (banner) {
        const a = Math.min(1, banner.t, (2.4 - banner.t) * 3);
        ctx.globalAlpha = a; ctx.textAlign = "center"; ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(0, H / 2 - 70, W, 120);
        ctx.font = "700 64px 'Space Grotesk', sans-serif"; ctx.fillStyle = "#b6ff5c"; ctx.fillText(banner.text, W / 2, H / 2 + 6);
        ctx.font = "500 20px 'Space Grotesk', sans-serif"; ctx.fillStyle = "#fff"; ctx.fillText(banner.sub, W / 2, H / 2 + 38); ctx.globalAlpha = 1;
      }
    }
    function drawEnemy(e) {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.beginPath(); ctx.ellipse(e.x, e.y + e.r * 0.8, e.r, e.r * 0.35, 0, 0, 7); ctx.fill();
      if (e.type === "big") { ctx.fillStyle = "rgba(255,80,80,.18)"; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 6, 0, 7); ctx.fill(); }
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(Math.sin(e.wob) * 0.12);
      ctx.font = `${Math.round(e.r * 2.3)}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (e.type === "fast") ctx.filter = "hue-rotate(60deg) saturate(1.4)";
      ctx.fillText(enemy.emoji, 0, 0); ctx.filter = "none";
      if (e.flash > 0) { ctx.globalAlpha = 0.6; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, e.r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.restore(); ctx.textBaseline = "alphabetic";
      if (e.max > 3) { ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(e.x - 20, e.y - e.r - 12, 40, 5); ctx.fillStyle = "#ff6b6b"; ctx.fillRect(e.x - 20, e.y - e.r - 12, 40 * e.hp / e.max, 5); }
    }
    function drawPlayer(p) {
      const h = 86, w = h * 120 / 218;
      ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 20, 7, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = p.color; ctx.lineWidth = p.human ? 3 : 2; ctx.setLineDash(p.human ? [] : [4, 4]); ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 24, 9, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      const skA = !p.human && !p.down && skillOf(p);
      if (skA) {
        p.skT = Math.max(0, (p.skT || 0) - 1 / 60);
        const glow = 0.35 + (p.skT || 0) * 1.1 + Math.sin(t * 4 + p.i) * 0.1;
        ctx.save(); ctx.globalAlpha = Math.min(1, glow); ctx.strokeStyle = skA.color || "#ff9f43"; ctx.lineWidth = 3; ctx.shadowColor = skA.color || "#ff9f43"; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 30 + (p.skT || 0) * 14, 11 + (p.skT || 0) * 5, 0, 0, 7); ctx.stroke(); ctx.restore();
        ctx.font = "15px sans-serif"; ctx.textAlign = "center"; ctx.fillText(skA.icon, p.x + 24, p.y - 70);
      }
      ctx.save(); ctx.translate(p.x, p.y + 6);
      if (p.down) { ctx.rotate(Math.PI / 2 * 0.95); ctx.globalAlpha = 0.55; ctx.filter = "grayscale(1)"; }
      else { const bob = p.moving ? Math.abs(Math.sin(t * 12)) * 4 : Math.sin(t * 2 + p.i) * 1.2; ctx.translate(0, -bob); ctx.scale(p.face < 0 ? -1 : 1, 1); }
      if (p.img) ctx.drawImage(p.img, -w / 2, -h, w, h); else { ctx.fillStyle = p.color; ctx.fillRect(-12, -50, 24, 50); }
      ctx.restore(); ctx.filter = "none"; ctx.globalAlpha = 1;
      if (p.down) {
        ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(p.x, p.y - 20, 22, 0, 7); ctx.stroke();
        ctx.strokeStyle = "#b6ff5c"; ctx.beginPath(); ctx.arc(p.x, p.y - 20, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.revive / 2.4); ctx.stroke();
        ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#b6ff5c"; ctx.fillText("REVIVE", p.x, p.y - 52);
      } else {
        ctx.fillStyle = "rgba(0,0,0,.6)"; rr(p.x - 20, p.y - h - 6, 40, 6, 3); ctx.fill();
        ctx.fillStyle = p.hp / p.maxHp > 0.5 ? "#b6ff5c" : p.hp / p.maxHp > 0.25 ? "#ffc857" : "#ff6b6b"; rr(p.x - 20, p.y - h - 6, 40 * clamp(p.hp / p.maxHp, 0, 1), 6, 3); ctx.fill();
      }
      ctx.font = "700 11px 'Space Grotesk', sans-serif"; ctx.textAlign = "center";
      const tw = ctx.measureText(p.name).width + 12;
      ctx.fillStyle = "rgba(0,0,0,.6)"; rr(p.x - tw / 2, p.y + 12, tw, 16, 8); ctx.fill(); ctx.fillStyle = p.human ? "#fff" : p.color; ctx.fillText(p.name, p.x, p.y + 24);
    }
    function bubble(x, y, text, color, a) {
      ctx.save(); ctx.globalAlpha = a; ctx.font = "600 13px 'Space Grotesk', sans-serif";
      const w = Math.min(230, ctx.measureText(text).width + 20);
      x = clamp(x, w / 2 + 6, W - w / 2 - 6); y = Math.max(28, y);
      ctx.fillStyle = "#f4f6ff"; ctx.strokeStyle = color; ctx.lineWidth = 2; rr(x - w / 2, y - 22, w, 26, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#14182a"; ctx.textAlign = "center"; ctx.fillText(text.length > 34 ? text.slice(0, 33) + "…" : text, x, y - 4); ctx.restore();
    }

    /* ---------- loop ---------- */
    let last = performance.now(), statT = 0, teamT = 0;
    function frame(now) {
      if (!api.alive()) { cleanup(); return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!UI.ctl.paused && !ended) {
        update(dt * Math.min(UI.ctl.speed, 1.5));
        statT -= dt; teamT -= dt;
        if (statT <= 0) { statT = 0.6; stats(); }
        if (teamT <= 0) { teamT = 0.4; renderTeam(); }
      }
      draw();
      if (!ended || banner) requestAnimationFrame(frame);
    }
    function stats() {
      api.stats([
        { title: "KILLS", rows: P.map(p => ({ k: p.name, v: p.stat.kills, c: p.color })) },
        { title: "DAMAGE TAKEN", rows: P.map(p => ({ k: p.name, v: Math.round(p.stat.taken), c: p.color })) },
        { title: "REVIVES", rows: P.map(p => ({ k: p.name, v: p.stat.revives, c: p.color })) }
      ]);
    }
    function finish(won) {
      if (ended) return; ended = true; state = won ? "won" : "lost"; cleanup(); stats();
      const rows = P.slice().sort((a, b) => b.stat.kills - a.stat.kills).map(p => ({ name: p.name, sub: p.human ? "human" : p.char.role, score: `${p.stat.kills} kills`, color: p.color, char: p.char }));
      const mvp = rows[0];
      api.status(won ? "Victory!" : "Overrun…");
      api.log(`<b>${won ? "🏆 The squad survived!" : "💀 The squad was overrun."}</b> <span class="act">MVP: ${UI.esc(mvp.name)}</span>`, "event");
      const closer = P.find(p => !p.human && !p.down) || P.find(p => !p.human);
      if (closer) say(closer, won ? rand(["We actually made it!", "Best squad ever.", "Same time tomorrow?"]) : rand(["We'll get them next time.", "Too many of them…"]));
      draw();
      Games.results(api, {
        kicker: won ? "VICTORY" : "GAME OVER", icon: won ? "🏆" : "💀", color: won ? "#b6ff5c" : "#ff6b6b",
        title: won ? `You survived ${WAVES} waves!` : `Overrun in wave ${wave}`,
        text: `MVP: ${mvp.name} with ${P.find(p => p.name === mvp.name).stat.kills} kills. Revives: ${P.reduce((s, p) => s + p.stat.revives, 0)}.`,
        rows, into: document.querySelector(".z-wrap"), again: () => Games.restart(cfg)
      });
    }

    renderTeam(); stats();
    api.log(`<b>🎮 ${UI.esc(cfg.title || "Zombie Survival")}</b> <span class="act">${UI.esc(cfg.desc || `Survive ${WAVES} waves of ${enemy.name}s.`)}</span>`, "sys");
    requestAnimationFrame(frame);
    planWave();
  }
})();

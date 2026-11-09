/* TRACK 2 · Rock-Paper-Scissors Showdown — you vs each agent, best of N.
   Agents remember your throws and try to predict you, then explain their reasoning.
   With BAND on, agents share notes about you between matches. */
(function () {
  const MOVES = ["rock", "paper", "scissors"];
  const ICON = { rock: "✊", paper: "✋", scissors: "✌️" };
  const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };
  const COUNTER = { rock: "paper", paper: "scissors", scissors: "rock" };
  const rand = a => a[Math.floor(Math.random() * a.length)];
  const esc = s => UI.esc(s);

  Games.register({
    id: "rps", title: "Rock-Paper-Scissors Showdown", icon: "✊", color: "#ff4fa3",
    blurb: "Beat every agent at Rock-Paper-Scissors. They study your habits.",
    rules: ["Pick ✊ rock, ✋ paper or ✌️ scissors (or press 1 / 2 / 3)", "Rock beats scissors, scissors beat paper, paper beats rock", "Best of 5 against each agent", "Beat them all to be champion"],
    agents: "Every agent remembers your past throws, tries to predict your next one, and tells you its reasoning after each round.",
    minAgents: 1, maxAgents: 3, needsScene: false,
    defaults: { agents: ["marlowe", "zorp", "nyx"], sceneId: "s-stage", rounds: 5, difficulty: "normal" },
    start
  });

  function predictOffline(hist, noise) {
    const mv = hist.map(h => h.you);
    if (mv.length < 2 || Math.random() < noise) {
      const t = rand(MOVES); return { throw: t, reasoning: mv.length < 2 ? "Not enough data on you yet, so I'm going random." : "Mixing it up so you can't read me." };
    }
    const last = mv[mv.length - 1], trans = {}, freq = {};
    for (let i = 0; i < mv.length; i++) { freq[mv[i]] = (freq[mv[i]] || 0) + 1; if (i && mv[i - 1] === last) trans[mv[i]] = (trans[mv[i]] || 0) + 1; }
    const top = o => Object.entries(o).sort((a, b) => b[1] - a[1])[0];
    const t = top(trans), f = top(freq);
    if (t && t[1] >= 2) return { throw: COUNTER[t[0]], reasoning: `After ${last} you usually throw ${t[0]} (${t[1]} times), so I chose ${COUNTER[t[0]]}.` };
    if (f && f[1] >= 2) return { throw: COUNTER[f[0]], reasoning: `You've thrown ${f[0]} ${f[1]} times out of ${mv.length}, so ${COUNTER[f[0]]} it is.` };
    if (hist.length && hist[hist.length - 1].result === "you") return { throw: COUNTER[last], reasoning: `People repeat a throw that just won. You won with ${last}, so I picked ${COUNTER[last]}.` };
    return { throw: COUNTER[COUNTER[last]], reasoning: `People rarely repeat after a loss; you'll likely switch from ${last}.` };
  }

  async function start(cfg) {
    const rounds = cfg.rounds || 5, need = Math.ceil(rounds / 2);
    const opps = cfg.agents.map((c, i) => ({ char: c, name: c.name, color: PLAY.colors[(i + 2) % PLAY.colors.length], w: 0, l: 0, d: 0, done: false, won: null }));
    const history = [];
    const stat = { you: { rock: 0, paper: 0, scissors: 0 }, predicted: 0, rounds: 0 };

    const api = Games.shell(cfg, {
      status: "Pick your throw",
      main: `<div class="rps-wrap">
        <div class="rps-line" id="rpsLine"></div>
        <div class="rps-arena" id="rpsArena">
          <div class="rps-side you"><div class="rps-name">${esc(cfg.human.name)} <small>you</small></div><div class="rps-hand" id="hYou">✊</div><div class="rps-score" id="sYou">0</div></div>
          <div class="rps-vs" id="rpsVs">VS</div>
          <div class="rps-side ag"><div class="rps-name" id="nAg"></div><div class="rps-fig"><div class="rps-bub" id="bAg"></div><div class="rps-pup" id="pAg"></div></div><div class="rps-hand" id="hAg">✊</div><div class="rps-score" id="sAg">0</div></div>
        </div>
        <div class="rps-why" id="rpsWhy"></div>
        <div class="rps-pick" id="rpsPick">${MOVES.map((m, i) => `<button data-m="${m}"><span>${ICON[m]}</span>${m}<small>${i + 1}</small></button>`).join("")}</div>
      </div>`,
      onRadio: (from, to) => {
        const a = document.querySelector(`.rps-op[data-n="${CSS.escape(from)}"]`), b = to && document.querySelector(`.rps-op[data-n="${CSS.escape(to)}"]`);
        if (a && b) { a.classList.add("tx"); b.classList.add("rx"); const ln = document.getElementById("rpsLine"); ln.classList.add("link"); setTimeout(() => { a.classList.remove("tx"); b.classList.remove("rx"); ln.classList.remove("link"); }, 2600); }
      }
    });
    const lineup = () => {
      document.getElementById("rpsLine").innerHTML = opps.map((o, i) => `<div class="rps-op ${o === cur ? "now" : ""} ${o.done ? (o.won ? "beat" : "lost") : ""}" data-n="${esc(o.name)}" style="--c:${o.color}"><div class="op-fig"></div><b>${esc(o.name)}</b><small>${o.done ? (o.won ? "beaten ✓" : "beat you ✗") : o === cur ? `${o.w}–${o.l}` : "waiting"}</small>${api.skillBadge(o.name)}</div>${i < opps.length - 1 ? `<i class="rps-chain"></i>` : ""}`).join("");
      document.querySelectorAll(".rps-op .op-fig").forEach((el, i) => Puppet.mount(el, opps[i].char));
    };
    const sleep = ms => UI.sleep(ms, api.token);
    const pAg = document.getElementById("pAg");
    const say = (o, text, ms) => {
      const b = document.getElementById("bAg"); if (!b) return;
      b.textContent = text; b.classList.add("on"); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove("on"), ms || 3200);
      Puppet.talk(pAg, Math.min(2600, text.length * 60)); UI.speak(text, Games.voiceIdx(o.name));
    };
    const skill = o => api.skill(o.name);
    function stats() {
      api.stats([
        { title: "YOUR THROWS", rows: MOVES.map(m => ({ k: `${ICON[m]} ${m}`, v: stat.you[m], c: "#ff4fa3" })) },
        { title: "HOW PREDICTABLE YOU ARE", rows: [{ k: "agents guessed you", v: stat.rounds ? Math.round(stat.predicted / stat.rounds * 100) : 0, u: "%", c: "#ffc857" }] },
        { title: "AGENT WIN RATE VS YOU", rows: opps.map(o => ({ k: o.name, v: o.w + o.l + o.d ? Math.round(o.l / (o.w + o.l + o.d) * 100) : 0, u: "%", c: o.color })) }
      ]);
    }

    /* agent decides its throw (hidden) */
    async function decide(o) {
      const sk = skill(o);
      const band = cfg.tools.has("band");
      const seen = band ? history : history.filter(h => h.opp === o.name);
      const last = history.filter(h => h.opp === o.name).slice(-1)[0];
      const noise = sk && sk.id === "psychic" ? 0.08 : cfg.difficulty === "hard" ? 0.15 : cfg.difficulty === "easy" ? 0.55 : 0.3;
      const fallback = () => {
        if (sk && sk.id === "stubborn" && last && last.result === "agent") return { throw: last.agent, reasoning: `${ICON[last.agent]} just won me a round. Never change a winning throw.`, taunt: "Same again. Try and stop it." };
        const p = predictOffline(seen, noise);
        const fake = MOVES.filter(m => m !== p.throw);
        const taunt = sk && sk.id === "bluffer" ? `I'm definitely throwing ${rand(fake)}. Promise.` : rand(["I can read you like a book.", "You're more predictable than you think.", "Go on then, surprise me.", "I've seen this move before.", `${cfg.human.name}, you're sweating.`]);
        return { ...p, taunt };
      };
      const summary = seen.length ? (() => { const f = { rock: 0, paper: 0, scissors: 0 }; seen.forEach(h => f[h.you]++); return `Totals: rock ${f.rock}, paper ${f.paper}, scissors ${f.scissors}.`; })() : "";
      const system = `You are ${o.name}, the ${o.char.role}, an AI agent playing Rock-Paper-Scissors against a human named ${cfg.human.name}.
Personality: ${o.char.personality || "competitive"}${sk ? `\nYour skill: ${sk.name} (${sk.does})${sk.id === "bluffer" ? " Your taunt must claim a throw you are NOT playing." : ""}` : ""}
Study the human's past throws and predict their next one, then pick the throw that beats it. Humans often repeat a winning throw, switch after losing, and avoid three in a row.
Reply with JSON only: {"throw":"rock|paper|scissors","reasoning":"one sentence explaining your prediction using the history","taunt":"in-character taunt, max 12 words"}`;
      const user = `${band ? "Your teammates SHARED their notes with you over the BAND channel, so you see every game the human played." : "You only see your own games against the human."}
HUMAN'S THROW HISTORY (oldest first): ${seen.length ? seen.map(h => `${h.you}${h.opp !== o.name ? ` (vs ${h.opp})` : ""} → ${h.result === "you" ? "human won" : h.result === "agent" ? "human lost" : "draw"}`).join("; ") : "none yet"}
${summary}
CURRENT SCORE vs you: human ${o.w}, you ${o.l}. First to ${need}.`;
      const out = await Brain.ask(system, user, 0.9, fallback);
      return { throw: MOVES.includes(out.throw) ? out.throw : rand(MOVES), reasoning: Brain.clip(out.reasoning, 200) || "Gut feeling.", taunt: Brain.clip(out.taunt, 90), src: out._src };
    }

    function pick() {
      return new Promise(res => {
        const box = document.getElementById("rpsPick");
        box.classList.add("live");
        const done = m => { box.classList.remove("live"); window.removeEventListener("keydown", key); box.onclick = null; res(m); };
        box.onclick = ev => { const b = ev.target.closest("[data-m]"); if (b) done(b.dataset.m); };
        const key = ev => { if (!api.alive()) return window.removeEventListener("keydown", key); const i = ["1", "2", "3"].indexOf(ev.key); if (i >= 0) done(MOVES[i]); };
        window.addEventListener("keydown", key);
      });
    }

    let cur = null;
    stats();
    api.log(`<b>✊ ${esc(cfg.title || "Rock-Paper-Scissors Showdown")}</b> <span class="act">Best of ${rounds} against ${opps.length} agent${opps.length > 1 ? "s" : ""}. They remember everything you throw.</span>`, "sys");
    try {
      for (let oi = 0; oi < opps.length; oi++) {
        cur = opps[oi];
        lineup();
        Puppet.mount(pAg, cur.char);
        document.getElementById("nAg").innerHTML = `${esc(cur.name)} <small>${esc(cur.char.role)}</small> ${api.skillBadge(cur.name)}`;
        document.getElementById("sYou").textContent = 0; document.getElementById("sAg").textContent = 0;
        document.getElementById("rpsArena").style.setProperty("--c", cur.color);
        document.getElementById("rpsWhy").innerHTML = "";
        // BAND: previous opponent shares notes
        if (oi > 0 && cfg.tools.has("band") && history.length) {
          const prev = opps[oi - 1], f = { rock: 0, paper: 0, scissors: 0 }; history.forEach(h => f[h.you]++);
          const fav = Object.entries(f).sort((a, b) => b[1] - a[1])[0][0];
          const tip = `${cfg.human.name} loves ${fav} (${f[fav]}×). Counter with ${COUNTER[fav]}.`;
          api.radio(prev.name, cur.name, tip, prev.color);
          await sleep(1400);
        }
        Puppet.gesture(pAg, "wave", 1800);
        say(cur, rand([`I'm ${cur.name}. Ready to lose?`, "Let's see what you've got.", "I already know your first move.", "Best of " + rounds + ". Don't blink."]));
        api.status(`vs ${cur.name} · first to ${need}`);
        await sleep(1200);
        while (cur.w < need && cur.l < need) {
          await UI.waitWhilePaused(api.token);
          document.getElementById("hYou").textContent = "✊"; document.getElementById("hAg").textContent = "✊";
          document.getElementById("rpsArena").classList.remove("win", "lose", "draw");
          const why = document.getElementById("rpsWhy");
          why.innerHTML = `<span class="muted">${esc(cur.name)} is thinking<span class="dots3"><i></i><i></i><i></i></span></span>`;
          Puppet.emotion(pAg, "thinking");
          const agentP = decide(cur).then(d => { if (api.alive()) { why.innerHTML = `<span class="lock">🔒 ${esc(cur.name)} has locked in a throw. Your move!</span>`; Puppet.emotion(pAg, "sly"); if (d.taunt) say(cur, d.taunt); } return d; });
          const [you, d] = await Promise.all([pick(), agentP]);
          if (!api.alive()) return;
          // countdown + reveal
          const arena = document.getElementById("rpsArena");
          arena.classList.add("shake");
          for (const w of ["ROCK…", "PAPER…", "SCISSORS…", "SHOOT!"]) { document.getElementById("rpsVs").textContent = w; await sleep(330); }
          arena.classList.remove("shake");
          document.getElementById("rpsVs").textContent = "VS";
          document.getElementById("hYou").textContent = ICON[you]; document.getElementById("hAg").textContent = ICON[d.throw];
          const result = you === d.throw ? "draw" : BEATS[you] === d.throw ? "you" : "agent";
          stat.you[you]++; stat.rounds++; if (result === "agent") stat.predicted++;
          history.push({ opp: cur.name, you, agent: d.throw, result });
          if (result === "you") cur.w++; else if (result === "agent") cur.l++; else cur.d++;
          arena.classList.add(result === "you" ? "win" : result === "agent" ? "lose" : "draw");
          document.getElementById("sYou").textContent = cur.w; document.getElementById("sAg").textContent = cur.l;
          Puppet.emotion(pAg, result === "agent" ? "happy" : result === "you" ? "angry" : "shocked");
          if (result === "agent") Puppet.gesture(pAg, "raise", 1500); else if (result === "you") Puppet.gesture(pAg, "slump", 1500);
          why.innerHTML = `<b>${result === "you" ? "You win the round! 🎉" : result === "agent" ? `${esc(cur.name)} wins the round.` : "Draw!"}</b>
            <span class="r-why"><span class="thought">🔒 ${esc(cur.name)}'s reasoning:</span> ${esc(d.reasoning)}</span>
            ${d.src === "offline" && Brain.mode === "llm" ? `<span class="warn-s">⚠ LLM failed, offline brain used</span>` : ""}`;
          api.log(`<span class="ts">vs ${esc(cur.name)}</span><span class="act">You ${ICON[you]} vs ${ICON[d.throw]} ${esc(cur.name)} → ${result === "you" ? "you win" : result === "agent" ? `${esc(cur.name)} wins` : "draw"}</span>`);
          api.think(cur.name, cur.color, d.reasoning, d.src);
          setTimeout(() => api.alive() && say(cur, result === "agent" ? rand(["Called it.", "Predictable!", "Too easy."]) : result === "you" ? rand(["Lucky.", "Hmm. Interesting.", "Won't happen again."]) : rand(["Great minds…", "Again!"]), 2200), 500);
          stats(); lineup();
          await sleep(1900);
        }
        cur.done = true; cur.won = cur.w >= need;
        api.log(`<b>${cur.won ? `✅ You beat ${esc(cur.name)} ${cur.w}–${cur.l}` : `❌ ${esc(cur.name)} beat you ${cur.l}–${cur.w}`}</b>`, "event");
        Puppet.gesture(pAg, cur.won ? "slump" : "jump", 2000);
        say(cur, cur.won ? rand(["Fine. You earned that.", "Rematch. Later.", "I'll study your tapes."]) : rand(["Read you like a book.", "Better luck next time!", "Patterns never lie."]));
        lineup(); stats();
        await sleep(2200);
      }
    } catch (e) { if (e.message !== "aborted") console.error(e); return; }

    const beat = opps.filter(o => o.won).length, champ = beat === opps.length;
    api.status(champ ? "Champion!" : `You beat ${beat} of ${opps.length}`);
    const rows = [{ name: cfg.human.name, sub: "human", score: `${beat} wins`, color: "#ffffff", icon: "🧑" }].concat(opps.map(o => ({ name: o.name, sub: o.char.role, score: o.won ? `lost ${o.l}–${o.w}` : `won ${o.l}–${o.w}`, color: o.color, char: o.char })));
    Games.results(api, {
      kicker: champ ? "CHAMPION" : "SHOWDOWN OVER", icon: champ ? "🏆" : "🤖", color: champ ? "#b6ff5c" : "#ff4fa3",
      title: champ ? "You beat every agent!" : `You beat ${beat} of ${opps.length} agents`,
      text: `The agents predicted you ${stat.rounds ? Math.round(stat.predicted / stat.rounds * 100) : 0}% of the time. Your favourite throw: ${Object.entries(stat.you).sort((a, b) => b[1] - a[1])[0][0]}.`,
      rows, into: document.querySelector(".rps-wrap"), again: () => Games.restart(cfg)
    });
  }
})();

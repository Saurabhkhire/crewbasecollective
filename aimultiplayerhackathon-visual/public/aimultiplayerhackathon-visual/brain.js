/* =========================================================
   Brain: every agent decision goes through here.
   - LLM mode: calls /aimultiplayerhackathon-visual/api/chat (this project's api/chat.js → OpenAI)
   - Offline mode: personality-weighted simulated agents
   ========================================================= */
window.Brain = (function () {
  const rand = a => a[Math.floor(Math.random() * a.length)];
  const clip = (s, n) => String(s || "").trim().slice(0, n);
  const B = { mode: "checking", model: null, lastError: null };

  B.init = async function () {
    try {
      const r = await fetch("/aimultiplayerhackathon-visual/api/chat", { cache: "no-store" });
      const j = await r.json();
      B.mode = j.llm ? "llm" : "offline";
      B.model = j.model;
      B.reason = j.llm ? "" : "The AI endpoint has no OPENAI_API_KEY configured.";
    } catch {
      B.mode = "offline";
      B.reason = "The AI endpoint is not reachable here.";
    }
    return B.mode;
  };

  async function llm(system, user, temperature) {
    const r = await fetch("/aimultiplayerhackathon-visual/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ system, user, temperature })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "LLM request failed");
    return JSON.parse(j.content);
  }
  /* try the LLM, fall back to the simulated brain if anything goes wrong */
  async function think(system, user, temperature, fallback) {
    if (B.mode === "llm") {
      try { return { ...(await llm(system, user, temperature)), _src: "llm" }; }
      catch (e) { B.lastError = e.message; }
    }
    await new Promise(r => setTimeout(r, 350 + Math.random() * 400));
    return { ...fallback(), _src: "offline" };
  }

  /* ================= TRACK 1 · FILM ================= */
  const EMOTIONS = ["happy", "angry", "scared", "sad", "sly", "shocked", "calm", "determined"];

  B.filmTurn = async function (actor, st) {
    const others = st.cast.filter(c => c !== actor);
    const places = ["stay", "center", "exit", ...st.mode.spots.map(s => s.label), ...others.filter(o => !o.exited).map(o => o.name)];
    const k = st.beat + 1, N = st.beats;
    const phase = k <= Math.ceil(N * 0.3) ? "EARLY: react to the situation, reveal who you are, test the others."
      : k < N - 1 ? "MIDDLE: escalate. Form alliances, make accusations, lie, reveal or betray. Pursue your secret goal."
      : "CLIMAX: make a decisive, irreversible move that will shape the ending.";

    const system = `You are ${actor.name}, the ${actor.role}, an autonomous character in an improvised animated short film. Nobody scripts you: YOU decide what you do.
Personality: ${actor.personality}
Secret goal (private; reveal only if it is dramatically right): ${actor.secret}
Film tone: ${st.tone}. Setting: ${st.mode.setting}
Make bold, specific, visual choices that move the plot. Stay in character. Keep it short and cinematic.
Reply with JSON only:
{"thought":"one sentence of private reasoning","action":"what you physically do, third person present tense, max 16 words","say":"your spoken line, max 22 words, may be empty","move_to":"one of: ${places.join(" | ")}","target":"name of the character you act on, or empty","emotion":"one of: ${EMOTIONS.join(", ")}"}`;

    const user = `OPENING EVENT: ${st.mode.opening}
CHARACTERS:
${st.cast.map(c => `- ${c.name} (${c.role})${c === actor ? " ← YOU" : ""}: mood ${c.mood || "neutral"}${c.exited ? ", has LEFT the scene" : ""}`).join("\n")}
STORY SO FAR:
${st.log.length ? st.log.map((l, i) => `${i + 1}. ${l}`).join("\n") : "(nothing yet: you act first)"}
${st.twist ? `\nDIRECTOR'S TWIST JUST HAPPENED: ${st.twist}\n` : ""}
This is beat ${k} of ${N}. ${phase}
Hidden theme for this run: ${st.seed}.`;

    const out = await think(system, user, 1.05, () => mockFilmTurn(actor, st, others));
    out.thought = clip(out.thought, 220);
    out.action = clip(out.action, 160) || `${actor.name} hesitates.`;
    out.say = clip(out.say, 200);
    out.emotion = EMOTIONS.includes(out.emotion) ? out.emotion : "determined";
    out.move_to = places.includes(out.move_to) ? out.move_to : "stay";
    out.target = others.some(o => o.name === out.target) ? out.target : "";
    return out;
  };

  B.filmEnding = async function (st) {
    const system = `You are the narrator of an improvised animated short film. The characters were autonomous AI agents. Decide the ending ONLY from what they actually did. Do not invent a happy ending they didn't earn.
Tone: ${st.tone}.
Reply with JSON only:
{"title":"a punchy ending title, max 6 words","ending_type":"one of: Triumph, Tragedy, Betrayal, Bittersweet, Twist, Comedy","summary":"3-4 vivid sentences describing how it ends","fates":[{"name":"character name","fate":"max 14 words"}],"moral":"one-line tagline"}`;
    const user = `SETTING: ${st.mode.setting}
OPENING: ${st.mode.opening}
CAST: ${st.cast.map(c => `${c.name} (${c.role}; secret: ${c.secret})`).join("; ")}
WHAT THE AGENTS DID:
${st.log.map((l, i) => `${i + 1}. ${l}`).join("\n")}`;
    const out = await think(system, user, 0.9, () => mockFilmEnding(st));
    out.fates = Array.isArray(out.fates) ? out.fates.slice(0, 8) : [];
    return out;
  };

  /* ---- offline film brain ---- */
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
      ["blocks the way to {spot}", "Nobody gets there until we decide together.", "determined"],
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
  function mockFilmTurn(actor, st, others) {
    const k = st.beat + 1, N = st.beats;
    const pool = k <= Math.ceil(N * 0.3) ? FILM_T.early : k < N - 1 ? FILM_T.middle : FILM_T.climax;
    const tgt = rand(others.filter(o => !o.exited).length ? others.filter(o => !o.exited) : others);
    const spot = rand(st.mode.spots);
    const [a, s, emo] = rand(pool);
    const hint = actor.secret.split(/[.,]/)[0].toLowerCase();
    const fill = x => x.replace("{t}", tgt.name).replace("{spot}", spot.label).replace("{secretHint}", hint);
    const moving = /sprint|blocks|checks/.test(a) ? spot.label : /accuses|pulls|grabs|turns|defends|sacrifices|pockets/.test(a) ? tgt.name : rand(["stay", "center"]);
    return {
      thought: rand([`If ${tgt.name} finds out what I want, I'm finished.`, `${tgt.name} is the weak link. Time to use that.`, `My secret goal matters more than anything right now.`, `I need an ally before this falls apart.`, `The others are scared. Fear is useful.`]),
      action: `${actor.name} ${fill(a)}`, say: fill(s), move_to: moving, target: tgt.name, emotion: emo
    };
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
  function mockFilmEnding(st) {
    const e = rand(ENDINGS);
    return { title: e[1], ending_type: e[0], summary: e[2], fates: st.cast.map(c => ({ name: c.name, fate: rand(FATES) })), moral: rand(["Every secret has a seat on the escape pod.", "Trust is the rarest resource.", "The plan never survives the people."]) };
  }

  /* ================= TRACK 2 · GAME ================= */
  const ACTIONS = ["move", "gather", "trade", "ally", "talk", "steal", "attack", "betray"];

  B.gameTurn = async function (agent, g) {
    const others = g.players.filter(p => p !== agent);
    const system = `You are ${agent.name}, the ${agent.role}, an AI agent PLAYER (not an NPC) in a multiplayer game called "${g.world.title}": ${g.world.desc}
Personality: ${agent.personality}
Your goal: ${agent.goal}
You play as an equal to the humans. You remember everything, hold grudges and reward loyalty. Act on your own goals even if nobody talks to you.
ACTIONS: move(location) | gather (+2 coins) | trade(player: +1 coin each) | ally(player: +2 trust, +1 influence) | talk(player) | steal(player: take 3 coins) | attack(player: -3 health to them) | betray(player: only works on someone who trusts you >=2, take 5 coins).
Score = coins + health + 2*influence. Game lasts ${g.rounds} rounds.
Reply with JSON only: {"thought":"one sentence of private strategy","action":"${ACTIONS.join("|")}","target":"exact player name or location name","say":"what you say out loud, max 18 words","memory_note":"short note you want to remember next round"}`;
    const user = `ROUND ${g.round} of ${g.rounds}. You are at ${agent.loc}.
YOUR STATS: coins ${agent.coins}, health ${agent.health}, influence ${agent.influence}
PLAYERS:
${others.map(o => `- ${o.name} (${o.human ? "HUMAN" : "agent"}, ${o.role}) at ${o.loc}: coins ${o.coins}, health ${o.health}, influence ${o.influence}. Your trust in them: ${agent.trust[o.name] || 0}`).join("\n")}
LOCATIONS: ${g.world.locations.join(", ")}
YOUR MEMORIES:
${agent.memory.slice(-10).join("\n") || "(none yet)"}
LAST ROUND:
${g.lastRound.join("\n") || "(game just started)"}
${g.humanChatter.length ? "WHAT HUMANS SAID THIS ROUND:\n" + g.humanChatter.join("\n") : ""}`;

    const out = await think(system, user, 1.0, () => mockGameTurn(agent, g, others));
    out.action = ACTIONS.includes(out.action) ? out.action : "gather";
    if (out.action === "move") { if (!g.world.locations.includes(out.target)) out.target = rand(g.world.locations); }
    else if (out.action !== "gather") { if (!others.some(o => o.name === out.target)) out.target = rand(others).name; }
    out.say = clip(out.say, 160); out.thought = clip(out.thought, 220); out.memory_note = clip(out.memory_note, 160);
    return out;
  };

  B.gameNarrate = async function (g, results, mustEvent) {
    const evs = g.events;
    const system = `You are the game master of "${g.world.title}". Narrate the round in 2-3 dramatic, fun sentences.
Then decide if the AI AGENTS' actions (never the humans') caused a major world event. Choose from: ${evs.map(e => `${e.id} (${e.title})`).join(", ")}.
${mustEvent ? "No world event has happened yet: you MUST trigger one this round, caused by the agent whose actions best justify it." : "Only trigger one if the agents' actions clearly justify it."}
Reply with JSON only: {"narration":"...","world_event":null or {"id":"event id","caused_by":"agent name","why":"one sentence"}}`;
    const user = `ROUND ${g.round}. What happened:\n${results.join("\n")}\nAGENTS: ${g.players.filter(p => !p.human).map(p => p.name).join(", ")}`;
    const out = await think(system, user, 0.9, () => mockNarrate(g, results, mustEvent));
    const agents = g.players.filter(p => !p.human);
    if (out.world_event) {
      const ev = evs.find(e => e.id === out.world_event.id);
      const by = agents.find(a => a.name === out.world_event.caused_by);
      out.world_event = ev && by ? { ev, by, why: clip(out.world_event.why, 200) } : null;
    }
    if (mustEvent && !out.world_event) { const m = mockNarrate(g, results, true).world_event; out.world_event = { ev: evs.find(e => e.id === m.id), by: agents.find(a => a.name === m.caused_by), why: m.why }; }
    out.narration = clip(out.narration, 500);
    return out;
  };

  B.gameEpilogue = async function (g, standings) {
    const system = `You are the game master. Write the epilogue of this multiplayer game between humans and AI agents. Reply with JSON only: {"headline":"newspaper-style headline, max 9 words","epilogue":"3 sentences on who won, who betrayed whom, and what the agents decided"}`;
    const user = `GAME: ${g.world.title}\nFINAL STANDINGS: ${standings.map((p, i) => `${i + 1}. ${p.name} (${p.human ? "human" : "agent"}) score ${p.score}`).join("; ")}\nKEY MOMENTS:\n${g.history.slice(-14).join("\n")}`;
    return think(system, user, 0.9, () => ({
      headline: `${standings[0].name} ${standings[0].name === "You" ? "Rise" : "Rises"} as ${g.world.title} Burns`,
      epilogue: `${standings[0].name} finished on top with ${standings[0].score} points. Alliances formed and broke while the agents played their own game, whether humans were watching or not. ${standings[standings.length - 1].name} will remember this one.`
    }));
  };

  /* ---- offline game brain ---- */
  const SAY = {
    move: ["Things are getting crowded here.", "I've got business elsewhere."],
    gather: ["Honest work, honest coins.", "Somebody has to be productive."],
    trade: ["Fair deal. Don't make me regret it.", "Let's both get rich."],
    ally: ["Together we're unstoppable.", "I've got your back. For now."],
    talk: ["I hear things. Want to know what?", "Careful who you trust around here."],
    steal: ["Finders keepers.", "You weren't using that anyway."],
    attack: ["You had this coming.", "Nobody crosses me twice."],
    betray: ["Nothing personal. It's strategy.", "You really trusted me? Cute."]
  };
  function mockGameTurn(agent, g, others) {
    const style = Object.assign({ move: 1, gather: 1, trade: 1, ally: 1, talk: 1, steal: 0.5, attack: 0.5, betray: 0.3 }, agent.style || {});
    const enemy = others.slice().sort((a, b) => (agent.trust[a.name] || 0) - (agent.trust[b.name] || 0))[0];
    const friend = others.slice().sort((a, b) => (agent.trust[b.name] || 0) - (agent.trust[a.name] || 0))[0];
    const grudge = (agent.trust[enemy.name] || 0) <= -2;
    if (grudge) { style.attack += 3; style.steal += 2; }
    const bag = []; for (const k in style) for (let i = 0; i < Math.round(style[k] * 2); i++) bag.push(k);
    let action = rand(bag);
    let target;
    if (action === "move") target = rand(g.world.locations.filter(l => l !== agent.loc));
    else if (["steal", "attack"].includes(action)) target = grudge ? enemy.name : rand(others).name;
    else if (action === "betray") target = (agent.trust[friend.name] || 0) >= 2 ? friend.name : (action = "steal", rand(others).name);
    else if (action !== "gather") target = (Math.random() < 0.6 ? friend : rand(others)).name;
    return {
      thought: grudge ? `${enemy.name} wronged me. Payback time.` : rand([`Stick to my goal: ${agent.goal.toLowerCase()}`, `Keep the humans guessing.`, `${friend.name} might be useful.`]),
      action, target, say: rand(SAY[action]), memory_note: grudge ? `Still angry at ${enemy.name}.` : ""
    };
  }
  function mockNarrate(g, results, mustEvent) {
    const agents = g.players.filter(p => !p.human);
    const villain = agents.slice().sort((a, b) => b.aggression - a.aggression)[0];
    const fire = mustEvent || (villain.aggression >= 3 && Math.random() < 0.35);
    const ev = rand(g.events);
    return {
      narration: rand(["Coins changed hands, tempers flared, and somewhere a promise quietly broke.", "The town buzzed with deals and whispers. Not everyone will sleep well tonight.", "Alliances were tested this round. Some held. Some didn't."]),
      world_event: fire ? { id: ev.id, caused_by: villain.name, why: `${villain.name}'s scheming finally boiled over.` } : null
    };
  }

  return B;
})();

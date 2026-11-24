/* =========================================================
   Build guide (build.html): how the sponsor tools fit together, and full project
   recipes for each track that combine them. Everything is data-driven:
     STACK   → which layer each tool lives on (animated stack diagram)
     GUIDE   → per tool: when to reach for it, what not to use it for, best pairings
     RECIPES → 2 projects per track: scene + cast (image), ordered tool flow (animation), demo, MVP vs stretch
   Tools that are not in HACK.sponsors are skipped everywhere, so the page follows data.js.
   Needs data.js, mascots.js, play-data.js, puppet.js, scenes.js.
   ========================================================= */
(function () {
  const H = window.HACK, P = window.PLAY, root = document.getElementById("bgPage");
  if (!root || !H) return;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const sp = id => H.sponsors.find(s => s.id === id);
  const has = id => !!sp(id);
  const msvg = (id, o) => window.Mascots ? Mascots.svg(id, o) : (sp(id) || {}).icon || "";
  const track = id => H.tracks.find(t => t.id === id) || {};
  const charOf = id => P && P.characters.find(c => c.id === id);

  const STACK = [
    { id: "talk", icon: "💬", name: "Talk", line: "Where humans and agents coordinate", tools: ["teamily", "band"] },
    { id: "self", icon: "🧠", name: "Personality & skills", line: "Who each agent is and what it can do", tools: ["adal", "finch"] },
    { id: "know", icon: "🔎", name: "Know", line: "Fresh facts from the live web and real data", tools: ["telem", "glasser"] },
    { id: "make", icon: "⚡", name: "Make", line: "Generate images, video, voice, 3D and text", tools: ["runware", "adal"] },
    { id: "voice", icon: "🎙️", name: "Voice & judge", line: "Hear a human and score them fairly", tools: ["casuro"] },
    { id: "measure", icon: "📊", name: "Measure", line: "See what happened and why", tools: ["bruin", "telem"] },
    { id: "run", icon: "🔀", name: "Run & ship", line: "Run agents on real harnesses, then ship a real app", tools: ["harnessrouter", "lingcode"] }
  ];
  const STACK_STEPS = [
    ["talk", "A human posts the goal in the team's Teamily AI group; agents pass work along over BAND."],
    ["self", "Each agent acts in character (AdaL personality + memory) using its Finch skills."],
    ["know", "When it needs a fact, it searches the live web through Telem AI or pulls real data from Glasser."],
    ["make", "It renders what it decided: frames, voices, clips or text on Runware, posters and video with AdaL."],
    ["voice", "If a human is talking, Casuro listens, answers out loud and scores with evidence."],
    ["measure", "Every step lands in Bruin and Telem AI traces, so you can ask what happened and why."],
    ["run", "Each agent task runs on a complete harness through HarnessRouter; after the demo, LingCode ships the project as a real app."]
  ];

  const GUIDE = {
    bruin: { use: "You want to ask questions about your runs: which ending won, who talked most, how scores changed between tries.", not: "Talking to users live during the run.", pair: [["band", "log every message"], ["casuro", "chart every score"], ["telem", "join traces with outcomes"]], ex: "“Across 10 runs, which suspect was accused most?” answered from a Slack message." },
    adal: { use: "An agent needs a lasting personality, skills and memory, or you need posters, key frames and short video.", not: "Hosting your team chat.", pair: [["finch", "skills on top of a personality"], ["runware", "render at volume"]], ex: "Rook remembers he lied in scene 2 and keeps the lie going in scene 5." },
    band: { use: "Agents built with different tools must message each other, delegate and keep shared context in sync.", not: "Humans talking to humans (that's Teamily AI).", pair: [["teamily", "humans see the outcome"], ["bruin", "every message becomes data"]], ex: "Vega privately tells Rook “meet me at the pod”; the other agents can't read it." },
    finch: { use: "Give agents reusable abilities (negotiate, investigate, triage, score with STAR) instead of hand-writing each behaviour.", not: "Storing facts or data.", pair: [["adal", "skills on a personality"], ["bruin", "which skills actually helped"]], ex: "The Medic skill makes BOLT-9 heal before shooting, every round." },
    casuro: { use: "A human speaks and you need voice in, voice out, and fair, evidence-based scoring.", not: "Text-only chat.", pair: [["bruin", "scores over time"], ["runware", "panel voices and avatars"]], ex: "“Clarity 4/5: you said ‘we cut churn 18%’, which is a concrete result.”" },
    glasser: { use: "Structured facts from data providers: people, companies, prices, SEO, places, with the price shown before each call.", not: "Reading arbitrary web pages (that's Telem AI).", pair: [["telem", "web pages + structured data"], ["bruin", "cost per run"]], ex: "Look up the company's headcount and tech stack before the interview." },
    telem: { use: "The agent must search the open web, read a page cleanly, watch a topic for new information, or you need a trace of what it looked at.", not: "Paid structured datasets (that's Glasser).", pair: [["glasser", "web + data"], ["runware", "clean text into any model"], ["bruin", "traces next to outcomes"]], ex: "Marlowe searches real 1920s slang; the trace shows the engine, the page and the time." },
    runware: { use: "You need to run models (image, video, voice, 3D or LLM text) fast and cheaply, at hackathon volume.", not: "Deciding what to generate (your agents do that).", pair: [["adal", "art direction + rendering"], ["casuro", "voices for a speaking panel"]], ex: "Render all three endings instead of one, for about half the usual bill." },
    harnessrouter: { use: "Your agents should run on real agent harnesses (Codex, Claude Code, Hermes, Pi…) behind one API, each task in its own sandbox, and you want to route each task to the harness that wins on quality, cost or latency.", not: "Picking a model only (it runs whole harnesses), or agents talking to each other (that's BAND).", pair: [["bruin", "cost and wins per harness"], ["band", "agents coordinate, harnesses do the work"], ["teamily", "humans see the results"]], ex: "The Engineer Agent's “patch the build” goes to Codex, the planner's next wave goes to Hermes, and a timeout comes back as a clear “incomplete”." },
    lingcode: { use: "Your demo should become a real iPhone, Android or web app with sign-in, data and payments, live in the stores.", not: "The agent logic inside the project (that's the other tools).", pair: [["teamily", "launch posts in the group"], ["bruin", "installs and revenue next to your runs"], ["harnessrouter", "the agent backend for your app"]], ex: "One paragraph in, and fans can vote on the film's next ending from an app on their phone." },
    teamily: { use: "Humans and agents need one shared chat: your team at the event, or agents as members of your product's group.", not: "Private agent-to-agent channels (that's BAND).", pair: [["band", "agents talk behind the scenes"], ["telem", "monitors post news to the group"]], ex: "“@Engineer the medkits spawn too often” and the Engineer Agent patches it." }
  };

  /* flow: [toolId, short label, what it does in this project] */
  const RECIPES = [
    { track: "film", title: "The Gala Whodunit", log: "An improvised murder mystery: four suspects, one detective, and an ending nobody wrote.", scene: { base: "manor", time: "night", weather: "rain" }, cast: ["marlowe", "ashford", "rook", "nyx"],
      flow: [["teamily", "Plan in the crew chat", "You, a Producer Agent and a Writer Agent agree the cast, the setting and the opening event in your Teamily AI group."],
        ["adal", "Give each suspect a self", "Every character is an AdaL agent with a personality, a secret and memory, so they stay in character across scenes."],
        ["finch", "Hand out skills", "Marlowe gets Investigate, Ashford gets Deceive, Rook gets Persuade. The skills change what they say and do."],
        ["band", "Private whispers", "Suspects message each other over BAND channels. The audience sees glowing lines, not every word."],
        ["telem", "Real-world texture", "Marlowe searches the live web for real 1920s slang and famous jewel heists. The trace shows where each fact came from."],
        ["runware", "Render the scenes", "Key frames and voice lines render through one Runware API, cheap enough to render three different endings."],
        ["harnessrouter", "A harness per suspect", "Each suspect's turn runs on an agent harness behind one HarnessRouter API key; swap a harness with one config line and compare."],
        ["bruin", "Which ending wins?", "Every decision is logged. Run it ten times and ask Bruin which suspect gets accused most, and why."],
        ["lingcode", "The whodunit app", "After the demo, LingCode turns it into an app: fans pick a suspect, vote on the ending and buy the director's cut."]],
      demo: "Run it live twice: the judges watch a different killer get caught each time, then ask Bruin why.", mvp: ["adal", "band", "runware"], stretch: ["finch", "telem", "bruin", "harnessrouter", "lingcode"] },
    { track: "film", title: "Breaking News, Live", log: "An agent newsroom that turns something that happened today into a 60-second news short.", scene: { base: "city", time: "day", weather: "clear" }, cast: ["luna", "okafor", "jax"],
      flow: [["telem", "Watch the news", "A Telem AI monitor watches a topic. When a new story lands, the newsroom wakes up with a clean copy of the page."],
        ["glasser", "Get the numbers", "The reporter agent pulls real figures (company size, prices, places) through Glasser, with the cost of each call."],
        ["teamily", "Assign the desk", "The Producer Agent splits the work in the Teamily AI group: anchor, reporter, editor, and you approve the angle."],
        ["finch", "Fact-check skill", "The editor uses a Fact-check skill: every claim on screen needs a source from the trace."],
        ["runware", "Voice + b-roll", "The anchor's voice, b-roll images and two 5-second clips render on Runware."],
        ["adal", "Thumbnail", "AdaL makes the thumbnail and the title card."],
        ["bruin", "Source report", "Bruin lists every claim with its source and how long each step took."]],
      demo: "Ask the judges for a topic. A few minutes later the agents air a short with sources on screen.", mvp: ["telem", "runware", "teamily"], stretch: ["glasser", "finch", "bruin"] },
    { track: "game", title: "Zombie Night Co-op", log: "A judge joins three agent teammates to survive a night of waves. The agents really coordinate.", scene: { base: "city", time: "night", weather: "fog" }, cast: ["bolt", "hale", "imani", "kit"],
      flow: [["finch", "Roles as skills", "Finch gives each agent a skill that changes how it plays: Medic, Sharpshooter, Scout."],
        ["band", "Team radio", "Agents call out plans over BAND (“cover the north gate!”) and re-plan from each other's callouts."],
        ["telem", "Live twists", "A Telem AI monitor drops real-world twists into the round: a storm warning means fog next wave."],
        ["runware", "Voices + sprites", "NPC callouts and new zombie sprites render on Runware between waves, fast enough to feel live."],
        ["teamily", "Patch between rounds", "In the squad's Teamily AI group you @mention the Engineer Agent: “medkits spawn too often”. It patches."],
        ["bruin", "Live stats", "Every hit, heal and decision streams into Bruin: who saved whom, which skill mattered."],
        ["harnessrouter", "Harness arena", "Each teammate's task is routed to the harness that wins for it; after a wave, compare time, cost and wins per harness."],
        ["adal", "Cover art", "AdaL makes the cover art for the game you designed."],
        ["lingcode", "Ship it to the stores", "LingCode packages the game as an iPhone, Android and web app with accounts, a leaderboard and a skin pack."]],
      demo: "A judge plays as the fourth teammate and hears the agents adapt when the storm alert hits.", mvp: ["finch", "band", "bruin"], stretch: ["telem", "runware", "teamily", "harnessrouter", "lingcode"] },
    { track: "game", title: "The Agent Market", log: "A trading game where agents buy and sell real products, bluff, and react to live news.", scene: { base: "boardroom", time: "day", weather: "clear" }, cast: ["ashford", "rook", "jax", "nyx"],
      flow: [["glasser", "Real prices", "Each round starts from real product prices pulled through Glasser, with the price of the lookup shown."],
        ["telem", "News moves the market", "Telem AI watches the news. A headline crashes one product, and agents must decide fast."],
        ["finch", "Negotiate skill", "Traders get Negotiate and Bluff skills, so deals sound like real haggling."],
        ["band", "Private deals", "Agents make side deals over BAND that the others can't see."],
        ["teamily", "Humans bet", "Players bet on traders in a Teamily AI group, and agents post their market calls there."],
        ["runware", "Product art", "Runware renders a card for every product and a chart image each round."],
        ["bruin", "Leaderboard", "Bruin ranks traders and shows who bluffed and who got burned."]],
      demo: "Agents haggle over real prices; a live news event crashes one product and the judges watch who adapts.", mvp: ["glasser", "band", "bruin"], stretch: ["telem", "finch", "teamily"] },
    { track: "grow", title: "The Interview Panel", log: "A three-agent panel researches the company, interviews you by voice, and scores with evidence.", scene: { base: "boardroom", time: "day", weather: "clear" }, cast: ["priya", "okafor", "imani"],
      flow: [["telem", "Read the latest", "Before asking, the panel searches and fetches the company's newest pages through Telem AI."],
        ["glasser", "Company facts", "Headcount, tech stack and recent hires come from Glasser, so questions fit the real role."],
        ["finch", "Examiner skills", "One panelist scores with the STAR method, one checks clarity, one coaches."],
        ["casuro", "Voice interview", "Casuro speaks each question and turns your spoken answer into a transcript and evidence-based scores."],
        ["band", "Back-channel", "Panelists confer privately over BAND: “push harder on the numbers”."],
        ["runware", "Voices + avatars", "The panel's voices and avatars run on Runware and scale to zero between your answers."],
        ["bruin", "Score charts", "Bruin charts every score per question and per skill, across practice sessions."],
        ["harnessrouter", "Deep scoring, fast follow-ups", "Scoring runs on a deep harness and follow-ups on a fast one; a timeout comes back as a clear “incomplete”, never a silent fail."],
        ["teamily", "Keep practising", "After the session the coach agent stays in a Teamily AI study group with you and remembers your weak spots."],
        ["lingcode", "A practice app", "LingCode turns the panel into a mobile practice app: learners sign in, book sessions and buy a practice pack."]],
      demo: "A judge does a three-minute voice interview and gets scores that quote their own words.", mvp: ["casuro", "finch", "bruin"], stretch: ["telem", "glasser", "teamily", "harnessrouter", "lingcode"] },
    { track: "grow", title: "Language Buddy Café", log: "Practise a language by ordering coffee out loud; a patient buddy corrects you and tracks your progress.", scene: { base: "cafe", time: "day", weather: "clear" }, cast: ["zorp", "bruno", "kit"],
      flow: [["casuro", "Talk out loud", "You order by voice. Casuro listens and the buddy answers out loud."],
        ["runware", "Lots of cheap turns", "Every turn (text and voice) runs on Runware, so a long conversation costs cents."],
        ["finch", "Gentle correction", "A Correct-gently skill fixes one mistake per turn instead of all of them."],
        ["telem", "Real menus, real slang", "The buddy searches the web for a real café menu and local phrases to practise."],
        ["adal", "Remembers you", "AdaL memory keeps your mistakes and wins, so the next session picks up where you left off."],
        ["teamily", "Daily nudge", "Your buddy posts a two-minute challenge in your Teamily AI study group every day."],
        ["bruin", "Progress", "Bruin charts mistakes per session: you can see yourself improve over three tries."]],
      demo: "Order a coffee in Spanish by voice; the buddy corrects one thing, and Bruin shows three tries getting better.", mvp: ["casuro", "runware", "finch"], stretch: ["telem", "adal", "bruin"] }
  ];

  /* ---------- page ---------- */
  const visTracks = ["film", "game", "grow"].filter(t => H.tracks.some(x => x.id === t));
  root.innerHTML = `
    <section class="bg-hero">
      <div>
        <span class="eyebrow">🧩 BUILD GUIDE</span>
        <h1>Every tool, combined <em>into one project.</em></h1>
        <p class="lead">Each sponsor tool does one job well. The best projects chain them: agents talk, act in character, look things up, generate, listen and get measured. Here's how they fit together, and six full project recipes you can start from.</p>
        <div class="cta-row"><a class="btn" href="#recipes">See the recipes ↓</a><a class="btn ghost" href="#mixer">Mix your own stack →</a></div>
        <nav class="bg-jump">${visTracks.map(t => `<a href="#track-${t}" style="--c:${track(t).hex}">${track(t).icon} ${esc(track(t).short || track(t).name)}</a>`).join("")}<a href="#tools">🧰 Each tool</a></nav>
      </div>
      <div class="bg-stack" id="bgStack">
        <div class="bg-rail"><i id="bgDot"></i></div>
        ${STACK.map(l => `<div class="bg-layer" data-l="${l.id}"><div class="bg-ln"><span>${l.icon}</span><b>${esc(l.name)}</b><small>${esc(l.line)}</small></div>
          <div class="bg-lt">${l.tools.filter(has).map(id => `<button class="bg-chip" data-sp="${id}" style="--c:${sp(id).color}"><span class="org-mascot">${msvg(id)}</span>${esc(sp(id).name)}</button>`).join("")}</div></div>`).join("")}
        <p class="bg-cap" id="bgCap"></p>
      </div>
    </section>

    <section class="bg-sec" id="recipes">
      <div class="section-head"><span class="eyebrow">PROJECT RECIPES</span><h2>Two full builds per track</h2><p class="muted">Each recipe chains the tools in order. Watch the flow play, or click any step. Start with the <b>MVP</b> tools and add the <b>stretch</b> ones once it works.</p></div>
      ${visTracks.map(t => `<div class="bg-track" id="track-${t}" style="--c:${track(t).hex}"><h3><span>${track(t).icon}</span> Track ${esc(track(t).num)} · ${esc(track(t).name)} <small>${esc(track(t).tagline || "")}</small></h3>
        ${RECIPES.map((r, i) => r.track === t ? recipeHtml(r, i) : "").join("")}</div>`).join("")}
    </section>

    <section class="bg-sec" id="mixer">
      <div class="section-head"><span class="eyebrow">MIX YOUR OWN STACK</span><h2>Pick a track, pick tools, get a plan</h2><p class="muted">Tick the tools you want. The plan orders them the way data flows (talk → character → knowledge → generation → voice → measurement) and says what each one does in your track.</p></div>
      <div class="bg-mix">
        <div class="bg-mix-c">
          <div class="chip-row" id="mxTrack">${visTracks.map((t, i) => `<button data-t="${t}" class="${i ? "" : "on"}" style="--c:${track(t).hex}">${track(t).icon} ${esc(track(t).short || track(t).name)}</button>`).join("")}</div>
          <div class="bg-mix-tools" id="mxTools">${H.sponsors.map(s => `<label style="--c:${s.color}"><input type="checkbox" value="${s.id}" checked><span class="org-mascot">${msvg(s.id)}</span><b>${esc(s.name)}</b><small>${esc(s.role || "")}</small></label>`).join("")}</div>
        </div>
        <div class="bg-mix-o" id="mxOut"></div>
      </div>
    </section>

    <section class="bg-sec" id="tools">
      <div class="section-head"><span class="eyebrow">EACH TOOL, ONE JOB</span><h2>When to reach for which tool</h2><p class="muted">What it's for, what it's not for, and what it pairs with best.</p></div>
      <div class="bg-tools">${H.sponsors.map(toolCard).join("")}</div>
    </section>`;

  function flowHtml(flow, key) {
    return `<div class="bg-flow" data-flow="${key}">${flow.map(([id, label], k) => `${k ? `<span class="bg-link" style="--c:${sp(id).color}"><i></i></span>` : ""}<button class="bg-node" data-k="${k}" style="--c:${sp(id).color}"><span class="org-mascot">${msvg(id)}</span><b>${esc(sp(id).name)}</b><small>${esc(label)}</small></button>`).join("")}</div>
      <div class="bg-detail" data-detail="${key}"></div>`;
  }
  function recipeHtml(r, i) {
    const flow = r.flow.filter(([id]) => has(id));
    if (!flow.length) return "";
    r._flow = flow;
    return `<article class="bg-recipe" id="recipe-${i}">
      <div class="bg-scene" data-scene="${i}"><div class="bg-cast"></div><div class="bg-title"><small>${track(r.track).icon} RECIPE</small><h4>${esc(r.title)}</h4><p>${esc(r.log)}</p></div></div>
      <div class="bg-body">
        ${flowHtml(flow, "r" + i)}
        <div class="bg-meta">
          <ol class="bg-steps" data-steps="r${i}">${flow.map(([id, label, d], k) => `<li data-k="${k}" style="--c:${sp(id).color}"><b>${sp(id).icon} ${esc(sp(id).name)} · ${esc(label)}</b><span>${esc(d)}</span></li>`).join("")}</ol>
          <div class="bg-side">
            <div class="bg-box demo"><small>🎤 THE DEMO MOMENT</small><p>${esc(r.demo)}</p></div>
            <div class="bg-box"><small>🚀 START WITH (MVP)</small><div class="bg-tags">${r.mvp.filter(has).map(tag).join("")}</div><small>✨ THEN ADD (STRETCH)</small><div class="bg-tags">${r.stretch.filter(has).map(tag).join("")}</div></div>
            <a class="btn btn-sm" href="/aim-hack-visual/play.html#${r.track}">▶ Try ${esc(track(r.track).short || "it")} in the Playground</a>
          </div>
        </div>
      </div></article>`;
  }
  function tag(id) { return `<span class="bg-tag" style="--c:${sp(id).color}">${sp(id).icon} ${esc(sp(id).name)}</span>`; }
  function toolCard(s) {
    const g = GUIDE[s.id] || { use: s.buildIdea || s.blurb, not: "", pair: [], ex: "" };
    const uses = Object.entries(s.tracks || {}).filter(([t]) => visTracks.includes(t));
    return `<article class="bg-tool" style="--c:${s.color}">
      <div class="bg-tool-h"><button class="bg-tool-m" data-sp="${s.id}"><span class="org-mascot">${msvg(s.id, { act: true })}</span></button><div><small>${esc(s.role || "Sponsor tool")}</small><h4>${s.icon} ${esc(s.name)}</h4></div></div>
      <p><b>Reach for it when</b> ${esc(g.use)}</p>
      ${g.not ? `<p class="muted"><b>Not for</b> ${esc(g.not)}</p>` : ""}
      ${g.ex ? `<p class="bg-ex">💡 ${esc(g.ex)}</p>` : ""}
      ${g.pair.filter(([id]) => has(id)).length ? `<div class="bg-pair"><small>PAIRS WITH</small>${g.pair.filter(([id]) => has(id)).map(([id, why]) => `<span style="--c:${sp(id).color}">${sp(id).icon} ${esc(sp(id).name)} <i>${esc(why)}</i></span>`).join("")}</div>` : ""}
      ${uses.length ? `<ul class="bg-uses">${uses.map(([t, u]) => `<li><b>${track(t).icon} ${esc(u.label)}</b> ${esc(u.does.replace(/ \(simulated\)\.?$/, "."))}</li>`).join("")}</ul>` : ""}
    </article>`;
  }

  /* ---------- scenes + cast (the recipe "images") ---------- */
  RECIPES.forEach((r, i) => {
    const el = root.querySelector(`[data-scene="${i}"]`);
    if (!el) return;
    if (window.Scenes) {
      Scenes.mount(el, r.scene);
      /* scene SVGs reuse gradient ids (sky, vig…): make them unique so each recipe keeps its own sky */
      const bg = el.querySelector(".scene-bg");
      if (bg) bg.innerHTML = bg.innerHTML.replace(/id="([^"]+)"/g, `id="$1-bg${i}"`).replace(/url\(#([^)]+)\)/g, `url(#$1-bg${i})`).replace(/href="#([^"]+)"/g, `href="#$1-bg${i}"`);
    }
    const cast = el.querySelector(".bg-cast");
    if (window.Puppet) r.cast.map(charOf).filter(Boolean).forEach((c, k) => { const d = document.createElement("div"); d.className = "bg-pup"; d.style.setProperty("--k", k); cast.appendChild(d); Puppet.mount(d, c); });
  });

  /* ---------- animated flows: cycle steps while visible ---------- */
  const flows = [];
  function player(key, flow) {
    const box = root.querySelector(`[data-flow="${key}"]`), det = root.querySelector(`[data-detail="${key}"]`), steps = root.querySelector(`[data-steps="${key}"]`);
    if (!box) return null;
    const pl = { k: 0, vis: false, hold: 0, box };
    pl.show = k => {
      pl.k = k;
      box.querySelectorAll(".bg-node").forEach((n, j) => { n.classList.toggle("on", j === k); n.classList.toggle("done", j < k); });
      box.querySelectorAll(".bg-link").forEach((l, j) => { l.classList.toggle("go", j === k - 1); l.classList.toggle("done", j < k - 1); });
      if (steps) steps.querySelectorAll("li").forEach((li, j) => li.classList.toggle("on", j === k));
      const [id, label, d] = flow[k];
      if (det) { det.style.setProperty("--c", sp(id).color); det.innerHTML = `<span class="bg-dn">${k + 1}/${flow.length}</span><b>${sp(id).icon} ${esc(sp(id).name)} · ${esc(label)}</b> ${esc(d || (sp(id).tracks && Object.values(sp(id).tracks)[0] || {}).does || "")}`; }
      const n = box.querySelectorAll(".bg-node")[k];
      if (n && pl.vis && box.scrollWidth > box.clientWidth) box.scrollTo({ left: n.offsetLeft - box.clientWidth / 2 + n.offsetWidth / 2, behavior: "smooth" });
    };
    box.addEventListener("click", e => { const n = e.target.closest(".bg-node"); if (n) { pl.show(+n.dataset.k); pl.hold = 3; } });
    if (steps) steps.addEventListener("click", e => { const li = e.target.closest("li"); if (li) { pl.show(+li.dataset.k); pl.hold = 3; } });
    pl.flow = flow; pl.show(0);
    return pl;
  }
  RECIPES.forEach((r, i) => { if (r._flow) { const p = player("r" + i, r._flow); p && flows.push(p); } });
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { const p = flows.find(f => f.box === e.target); if (p) p.vis = e.isIntersecting; }), { threshold: 0.3 }) : null;
  flows.forEach(p => io ? io.observe(p.box) : (p.vis = true));
  setInterval(() => flows.forEach(p => { if (!p.vis || document.hidden) return; if (p.hold > 0) { p.hold--; return; } p.show((p.k + 1) % p.flow.length); }), 2600);

  /* ---------- stack animation ---------- */
  const steps = STACK_STEPS.filter(([l]) => STACK.find(x => x.id === l).tools.some(has));
  let si = 0;
  function stackStep() {
    const [l, cap] = steps[si % steps.length], layers = [...root.querySelectorAll(".bg-layer")], idx = layers.findIndex(x => x.dataset.l === l);
    layers.forEach((x, j) => x.classList.toggle("on", j === idx));
    const L = layers[idx], dot = root.querySelector("#bgDot"), st = root.querySelector("#bgStack");
    if (L && dot) dot.style.top = (L.offsetTop + L.offsetHeight / 2 - st.querySelector(".bg-rail").offsetTop) + "px";
    root.querySelector("#bgCap").innerHTML = `<b>${si % steps.length + 1}/${steps.length}</b> ${esc(cap)}`;
    si++;
  }
  if (steps.length) { stackStep(); setInterval(() => { if (!document.hidden) stackStep(); }, 2600); }

  /* ---------- mixer ---------- */
  const ORDER = ["teamily", "band", "adal", "finch", "harnessrouter", "telem", "glasser", "runware", "casuro", "bruin", "lingcode"];
  const rank = id => { const i = ORDER.indexOf(id); return i < 0 ? 50 : i; };
  let mixT = visTracks[0], mixP = null;
  function drawMix() {
    const chosen = [...root.querySelectorAll("#mxTools input:checked")].map(i => i.value).filter(id => (sp(id).tracks || {})[mixT]).sort((a, b) => rank(a) - rank(b));
    const skipped = [...root.querySelectorAll("#mxTools input:checked")].map(i => i.value).filter(id => !(sp(id).tracks || {})[mixT]);
    const out = root.querySelector("#mxOut");
    if (!chosen.length) { out.innerHTML = `<p class="muted">Pick at least one tool that works in this track.</p>`; mixP = null; return; }
    const flow = chosen.map(id => [id, sp(id).tracks[mixT].label, sp(id).tracks[mixT].does.replace(/ \(simulated\)\.?$/, ".")]);
    const T = track(mixT);
    out.innerHTML = `<h4 style="--c:${T.hex}">${T.icon} Your ${esc(T.short || T.name)} stack · ${chosen.length} tool${chosen.length > 1 ? "s" : ""}</h4>
      <p class="muted small">${esc(T.tagline || "")}</p>
      ${flowHtml(flow, "mix")}
      <ol class="bg-steps" data-steps="mix">${flow.map(([id, label, d], k) => `<li data-k="${k}" style="--c:${sp(id).color}"><b>${sp(id).icon} ${esc(sp(id).name)} · ${esc(label)}</b><span>${esc(d)}</span></li>`).join("")}</ol>
      ${skipped.length ? `<p class="muted small">Not used in this track: ${skipped.map(id => esc(sp(id).name)).join(", ")}.</p>` : ""}
      ${chosen.length >= 3 ? `<div class="bg-box demo"><small>🎤 PITCH IT IN ONE LINE</small><p>${esc(pitch(chosen))}</p></div>` : `<p class="small muted">Tip: three or more tools usually make a stronger demo.</p>`}`;
    const i = flows.findIndex(f => f.key === "mix"); if (i >= 0) flows.splice(i, 1);
    mixP = player("mix", flow);
    if (mixP) { mixP.key = "mix"; mixP.vis = true; flows.push(mixP); io && io.observe(mixP.box); }
  }
  function pitch(ids) {
    const n = id => sp(id).name, h = id => ids.includes(id), list = a => a.filter(Boolean).join(" and ");
    const who = h("adal") || h("finch") ? `agents with ${list([h("adal") && "real personalities", h("finch") && "reusable skills"])}` : "agents";
    const acts = [];
    if (h("band") || h("teamily")) acts.push(`coordinate over ${list([h("band") && n("band"), h("teamily") && n("teamily")])}`);
    if (h("telem") || h("glasser")) acts.push(`look things up with ${list([h("telem") && n("telem"), h("glasser") && n("glasser")])}`);
    if (h("harnessrouter")) acts.push(`run on the best agent harness for each task through ${n("harnessrouter")}`);
    if (h("runware")) acts.push(`render everything on ${n("runware")}`);
    if (h("casuro")) acts.push(`talk with you by voice through ${n("casuro")}`);
    if (h("bruin")) acts.push(`get measured in ${n("bruin")}`);
    if (h("lingcode")) acts.push(`ship as a real app with ${n("lingcode")}`);
    const T = track(mixT), verbs = acts.length > 1 ? acts.slice(0, -1).join(", ") + " and " + acts[acts.length - 1] : (acts[0] || "work together");
    return `A ${String(T.short || T.name).toLowerCase()} project where ${who} ${verbs}.`;
  }
  root.querySelector("#mxTrack").addEventListener("click", e => { const b = e.target.closest("[data-t]"); if (!b) return; mixT = b.dataset.t; root.querySelectorAll("#mxTrack button").forEach(x => x.classList.toggle("on", x === b)); drawMix(); });
  root.querySelector("#mxTools").addEventListener("change", drawMix);
  drawMix();

  /* mascot clicks open the sponsor card (site.js) */
  root.addEventListener("click", e => { const b = e.target.closest("[data-sp]"); if (b && window.openSponsor && !e.target.closest(".bg-node")) openSponsor(b.dataset.sp); });
  if (location.hash) setTimeout(() => { const t = document.querySelector(location.hash); t && t.scrollIntoView(); }, 300);
})();

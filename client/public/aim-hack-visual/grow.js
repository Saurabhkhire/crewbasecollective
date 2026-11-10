/* =========================================================
   TRACK 3 · Grow with Agents
   Agents play expert roles (interview panel, buying committee,
   language café, audience, examiners). They question the human,
   confer in private, adapt, and give an evidence-based verdict.
   Routes: #grow · #grow/demo (auto-plays a session for screenshots)
   ========================================================= */
window.Grow = (function () {
  const { $, esc } = UI;
  const C = "#b6ff5c";
  const STEPS = ["Scenario", "Panel", "Session", "Verdict"];
  const EMOS = ["happy", "calm", "thinking", "sad", "angry", "sly", "shocked", "determined", "neutral"];
  /* Finch: examiner skills from the shared library (PLAY.allSkills), changeable by clicking the badge */
  const GROW_SKILLS = ["examine", "investigate", "coach", "summarize"];

  /* rubric kinds drive the offline scorer: clarity | evidence | depth | confidence | polite | fluency */
  const SCENARIOS = [
    {
      id: "interview", icon: "💼", title: "Job Interview Panel", scene: "s-board",
      blurb: "A three-person hiring panel questions you, compares notes behind closed doors, then decides.",
      ctxLabel: "Role you're applying for", ctx: "Product Manager",
      pass: "Hire", fail: "No hire", panel: ["priya", "okafor", "bolt"], roles: ["Hiring manager", "Tech lead", "HR partner"],
      rubric: [["Clarity", "clarity"], ["Evidence", "evidence"], ["Role fit", "depth"], ["Confidence", "confidence"]],
      bank: [
        "Tell us about yourself and why you want to be a {ctx}.",
        "What do you know about what a great {ctx} does day to day?",
        "Describe a project you're proud of. What was your part in it?",
        "Tell us about a time you disagreed with a teammate. What happened?",
        "Give an example of a decision you made with incomplete data. What was the result?",
        "Describe a failure. What exactly went wrong and what did you change afterwards?",
        "How would you measure success in your first 90 days as {ctx}?",
        "Two senior stakeholders want opposite things and both say it's urgent. Walk us through what you do, step by step.",
        "Why should we hire you over a candidate with five more years of experience?"
      ]
    },
    {
      id: "sales", icon: "📈", title: "Sales Pitch", scene: "s-office",
      blurb: "Pitch to a buying committee: a CFO, a CTO and an end user who push back on every claim.",
      ctxLabel: "What are you selling?", ctx: "an AI meeting-notes app",
      pass: "Deal", fail: "No deal", panel: ["ashford", "bolt", "kit"], roles: ["CFO", "CTO", "End user"],
      rubric: [["Value", "evidence"], ["Objection handling", "depth"], ["Clarity", "clarity"], ["Confidence", "confidence"]],
      bank: [
        "In one minute: what is {ctx} and why should we care?",
        "Who on my team would actually use {ctx} every day, and for what?",
        "What does it cost, and how fast do we get the money back?",
        "We already have a tool that does something similar. Why switch?",
        "How does {ctx} handle our data, security and compliance?",
        "What happens if it breaks during our busiest week?",
        "Give me one real customer result with numbers.",
        "Your competitor offered us 30% off. Convince me not to take it.",
        "If we sign today, what exactly happens in the first two weeks?"
      ]
    },
    {
      id: "language", icon: "🗣️", title: "Language Café", scene: "s-park",
      blurb: "Order food, chat with locals and ask for directions. Agents slow down or switch words to match you.",
      ctxLabel: "Language to practise", ctx: "Spanish", ctxOptions: ["Spanish", "French", "German", "Italian", "Japanese", "Hindi"],
      pass: "Level", fail: "Level", levels: true, panel: ["bruno", "luna", "merlin"], roles: ["Waiter", "Local friend", "Shopkeeper"],
      rubric: [["Vocabulary", "depth"], ["Grammar", "clarity"], ["Fluency", "fluency"], ["Politeness", "polite"]],
      bank: {
        Spanish: ["¡Hola! ¿Qué te gustaría pedir hoy?", "¿De dónde eres y por qué estás aquí?", "¿Quieres algo de beber con eso?", "¿Qué hiciste el fin de semana pasado?", "Perdona, ¿sabes cómo llegar a la estación?", "¿Cuál es tu comida favorita y por qué?", "¿Qué planes tienes para mañana?", "Si pudieras vivir en cualquier ciudad, ¿cuál elegirías?"],
        French: ["Bonjour ! Qu'est-ce que vous désirez ?", "D'où venez-vous ?", "Vous voulez quelque chose à boire ?", "Qu'avez-vous fait le week-end dernier ?", "Excusez-moi, où est la gare ?", "Quel est votre plat préféré ?", "Quels sont vos projets pour demain ?", "Si vous pouviez vivre n'importe où, où iriez-vous ?"],
        German: ["Hallo! Was möchten Sie bestellen?", "Woher kommen Sie?", "Möchten Sie etwas trinken?", "Was haben Sie letztes Wochenende gemacht?", "Entschuldigung, wo ist der Bahnhof?", "Was ist Ihr Lieblingsessen?", "Was machen Sie morgen?", "Wo würden Sie am liebsten wohnen?"],
        Italian: ["Ciao! Cosa desideri ordinare?", "Di dove sei?", "Vuoi qualcosa da bere?", "Cosa hai fatto lo scorso fine settimana?", "Scusa, dov'è la stazione?", "Qual è il tuo piatto preferito?", "Cosa fai domani?", "Dove ti piacerebbe vivere?"],
        Japanese: ["いらっしゃいませ！ご注文は？", "どちらから来ましたか？", "お飲み物はいかがですか？", "先週末は何をしましたか？", "すみません、駅はどこですか？", "好きな食べ物は何ですか？", "明日は何をしますか？", "どこに住みたいですか？"],
        Hindi: ["नमस्ते! आप क्या लेना चाहेंगे?", "आप कहाँ से हैं?", "क्या आप कुछ पीना चाहेंगे?", "पिछले सप्ताहांत आपने क्या किया?", "माफ़ कीजिए, स्टेशन कहाँ है?", "आपका पसंदीदा खाना क्या है?", "कल आपकी क्या योजना है?", "आप कहाँ रहना चाहेंगे?"]
      }
    },
    {
      id: "speaking", icon: "🎤", title: "Public Speaking", scene: "s-stage",
      blurb: "Give a talk to an agent audience that reacts live while a coach watches from the wings.",
      ctxLabel: "Your talk topic", ctx: "Why every team needs AI agents",
      pass: "Standing ovation", fail: "Lost the room", panel: ["luna", "hale", "kit"], roles: ["Speaking coach", "Heckler", "Fan in the front row"],
      rubric: [["Structure", "clarity"], ["Engagement", "evidence"], ["Substance", "depth"], ["Confidence", "confidence"]],
      bank: [
        "Open your talk on \"{ctx}\". Grab us in the first 30 seconds.",
        "What is the one idea you want us to remember?",
        "Tell us a short story that proves your point.",
        "Prove it. Give us a number or a fact.",
        "A heckler shouts: \"This is all hype!\" Respond on the spot.",
        "Explain the hardest part of your idea so a 12-year-old gets it.",
        "What should we do differently tomorrow morning?",
        "Close your talk. Make it land."
      ]
    },
    {
      id: "exam", icon: "📝", title: "Exam Viva", scene: "s-class",
      blurb: "Examiners with different specialities grill you, then agree on a grade with written comments.",
      ctxLabel: "Subject", ctx: "Driving theory",
      pass: "Pass", fail: "Fail", panel: ["okafor", "imani", "bolt"], roles: ["Lead examiner", "Second examiner", "External examiner"],
      rubric: [["Accuracy", "depth"], ["Reasoning", "evidence"], ["Clarity", "clarity"], ["Composure", "confidence"]],
      bank: [
        "Let's start simple. Explain the most important rule in {ctx} and why it exists.",
        "Give us a real example where that rule matters.",
        "What's the most common mistake beginners make in {ctx}?",
        "Walk us through how you would handle an emergency situation in {ctx}.",
        "Compare two approaches in {ctx}. When would you choose each?",
        "What would happen if someone ignored the basics of {ctx}? Be specific.",
        "Teach us one thing about {ctx} we probably don't know.",
        "Defend your weakest answer from today."
      ]
    }
  ];
  const CUSTOM_DEFAULT = {
    id: "custom", icon: "✍️", title: "My Session", custom: true, scene: "s-office",
    blurb: "Your skill, your setting, your panel.", ctxLabel: "Skill to practise", ctx: "calming an angry customer",
    focus: "Empathy, staying calm and solving the problem.", pass: "Pass", fail: "Try again",
    panel: ["priya", "bruno", "bolt"], roles: ["Coach", "Angry customer", "Observer"],
    rubric: [["Clarity", "clarity"], ["Empathy", "polite"], ["Problem solving", "depth"], ["Composure", "confidence"]],
    bank: [
      "Let's begin. Introduce yourself and how you'll approach {ctx}.",
      "Here's the situation. What is your first sentence?",
      "That didn't fully work. What do you say next?",
      "Give a concrete example of how you have handled {ctx} before.",
      "What would you never do in this situation, and why?",
      "The other person escalates. Respond now.",
      "How would you know you succeeded?",
      "Sum up what you learned in one sentence."
    ]
  };
  const DIFF = [{ label: "Friendly", d: 1 }, { label: "Realistic", d: 2 }, { label: "Tough", d: 4 }];

  const S = {
    sc: "interview", ctx: {}, custom: JSON.parse(JSON.stringify(CUSTOM_DEFAULT)),
    panel: null, roles: {}, sceneSel: null, diff: 1, nq: 5,
    tools: new Set(), demo: false
  };
  const scen = () => S.sc === "custom" ? S.custom : SCENARIOS.find(s => s.id === S.sc);
  const ctxOf = sc => (S.ctx[sc.id] != null ? S.ctx[sc.id] : sc.ctx);

  /* ================= STEP 1 · SCENARIO ================= */
  function scenarioScreen() {
    UI.steps(STEPS, 0, C);
    const sc = scen();
    const ideas = (HACK.tracks[2] && HACK.tracks[2].ideas || []).slice(0, 8);
    UI.app().innerHTML = `
      <div class="screen-head"><div><span class="kicker" style="color:${C}">🎓 Track 03 · Step 1</span><h2>Pick a skill to practise</h2>
        <p class="muted">For once, the agents train the human. A panel of experts questions you, <b>confers in private</b>, adapts to how you're doing, and gives a verdict backed by <b>quotes of what you said</b>.</p></div></div>
      <div class="gr-scen">
        ${SCENARIOS.concat([S.custom]).map(s => `<button class="card gr-sc ${S.sc === s.id ? "on" : ""}" data-s="${s.id}" style="--c:${C}">
          <div class="gr-thumb">${Scenes.svg(UI.Lib.scene(s.scene) || { base: "office" })}<span>${s.icon}</span></div>
          <h4>${s.id === "custom" ? "Create your own" : esc(s.title)}</h4><p>${esc(s.id === "custom" ? "Any skill, any setting. Write it or describe it to an agent." : s.blurb)}</p>
          ${s.id === "custom" ? "" : `<small>${esc(s.pass)}${s.levels ? " A1–C1" : ` / ${esc(s.fail)}`}</small>`}</button>`).join("")}
      </div>
      <div class="gr-cfg">
        <div class="card">
          <h3 class="cfg-h">${sc.icon} ${esc(sc.id === "custom" ? "Your session" : sc.title)}</h3>
          ${sc.id === "custom" ? customForm(ideas) : ""}
          <label>${esc(sc.ctxLabel)}</label>
          ${sc.ctxOptions ? `<div class="chips sel" id="ctxChips">${sc.ctxOptions.map(o => `<button class="chip ${ctxOf(sc) === o ? "on" : ""}" data-o="${esc(o)}">${esc(o)}</button>`).join("")}</div>`
            : `<input id="ctxIn" maxlength="80" value="${esc(ctxOf(sc))}">`}
          <h3 class="cfg-h">🎚️ Difficulty</h3>
          <div class="chips sel" id="diffs">${DIFF.map((d, i) => `<button class="chip ${S.diff === i ? "on" : ""}" data-d="${i}">${d.label}</button>`).join("")}</div>
          <h3 class="cfg-h">❓ Questions</h3>
          <div class="range-row"><input type="range" id="nq" min="4" max="8" value="${S.nq}"><output id="nqO">${S.nq}</output></div>
        </div>
        <div class="card">
          <h3 class="cfg-h">📍 Setting <small>where the session happens</small></h3>
          <div id="scenePick" class="gr-scenepick"></div>
        </div>
      </div>
      <div class="action-bar"><a class="btn ghost" href="#">← Tracks</a><button class="btn" id="next">Next: choose the panel →</button></div>`;

    if (!S.sceneSel || S.sceneSel.sc !== S.sc) S.sceneSel = { sc: S.sc, ids: [sc.scene] };
    UI.scenePicker($("#scenePick"), { selected: S.sceneSel.ids, max: 1, color: C });
    const selEl = $("#scenePick .scc.on"); if (selEl) $("#scenePick").scrollTop = selEl.offsetTop - $("#scenePick").offsetTop - 8;

    const keep = () => {
      const ci = $("#ctxIn"); if (ci) S.ctx[sc.id] = ci.value.trim() || sc.ctx;
      if (sc.id === "custom") {
        const v = id => ($("#" + id) ? $("#" + id).value.trim() : "");
        Object.assign(S.custom, { title: v("cuTitle") || "My Session", focus: v("cuFocus"), pass: v("cuPass") || "Pass", fail: v("cuFail") || "Try again" });
        const roles = v("cuRoles").split(",").map(s => s.trim()).filter(Boolean);
        if (roles.length) S.custom.roles = roles.slice(0, 3);
        const rub = v("cuRubric").split(",").map(s => s.trim()).filter(Boolean).slice(0, 4);
        if (rub.length >= 2) S.custom.rubric = rub.map((r, i) => [r, guessKind(r, i)]);
      }
      S.custom.scene = S.sc === "custom" ? S.sceneSel.ids[0] : S.custom.scene;
    };
    UI.app().querySelectorAll("[data-s]").forEach(b => b.onclick = () => { keep(); S.sc = b.dataset.s; S.panel = null; scenarioScreen(); });
    const cc = $("#ctxChips"); if (cc) cc.onclick = e => { const b = e.target.closest("[data-o]"); if (b) { S.ctx[sc.id] = b.dataset.o; cc.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === b)); } };
    $("#diffs").onclick = e => { const b = e.target.closest("[data-d]"); if (b) { S.diff = +b.dataset.d; $("#diffs").querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === b)); } };
    $("#nq").oninput = e => { S.nq = +e.target.value; $("#nqO").textContent = S.nq; };
    $("#next").onclick = () => { keep(); panelScreen(); };
    if (sc.id === "custom") bindCustom(keep);
  }

  function customForm(ideas) {
    const c = S.custom;
    return `<div class="gr-ai">
        <label>✨ Describe it to an agent <small>one line is enough</small></label>
        <div class="ai-row"><input id="cuIdea" maxlength="240" placeholder="e.g. Practise asking my landlord to fix the heating, he's grumpy"><button class="btn ai btn-sm" id="cuGo">✨ Describe it</button></div>
        <div class="ex-chips">${ideas.map(i => `<button type="button" data-idea="${esc(i.t + ": " + i.log)}">${esc(i.t)}</button>`).join("")}</div>
        <div id="cuWork"></div>
      </div>
      <div class="two"><div><label>Session title</label><input id="cuTitle" maxlength="40" value="${esc(c.title)}"></div>
      <div><label>Panel roles <small>comma separated</small></label><input id="cuRoles" maxlength="90" value="${esc(c.roles.join(", "))}"></div></div>
      <label>What should the panel test?</label><textarea id="cuFocus" rows="2" maxlength="240">${esc(c.focus || "")}</textarea>
      <label>Scored on <small>2–4 skills, comma separated</small></label><input id="cuRubric" maxlength="90" value="${esc(c.rubric.map(r => r[0]).join(", "))}">
      <div class="two"><div><label>Result if you do well</label><input id="cuPass" maxlength="24" value="${esc(c.pass)}"></div><div><label>Result if not</label><input id="cuFail" maxlength="24" value="${esc(c.fail)}"></div></div>`;
  }
  function guessKind(name, i) {
    const n = name.toLowerCase();
    if (/clar|struct|grammar|concise/.test(n)) return "clarity";
    if (/evid|exampl|data|value|proof|engag/.test(n)) return "evidence";
    if (/conf|compos|calm|presen/.test(n)) return "confidence";
    if (/empath|polite|kind|tone|rapport/.test(n)) return "polite";
    if (/fluen/.test(n)) return "fluency";
    return ["clarity", "evidence", "depth", "confidence"][i % 4];
  }
  function bindCustom(keep) {
    UI.app().querySelectorAll("[data-idea]").forEach(b => b.onclick = () => { $("#cuIdea").value = b.dataset.idea; });
    $("#cuGo").onclick = async () => {
      const idea = $("#cuIdea").value.trim();
      if (!idea) { $("#cuIdea").focus(); return; }
      $("#cuGo").disabled = true;
      const bases = Scenes.BASES.map(b => b.id);
      const out = await UI.aiRun($("#cuWork"), ["Reading your idea", "Casting the expert panel", "Choosing what to score", "Picking a setting"], Brain.ask(
        `You design practice sessions where AI agents play expert roles and train a human. Reply with JSON only:
{"title":"max 5 words","skill":"the skill practised, max 8 words","focus":"what the panel tests, max 25 words","roles":["3 distinct expert/character roles"],"rubric":["4 short skill names to score"],"pass":"result label if the human does well, max 3 words","fail":"result label if not, max 3 words","scene":"one of: ${bases.join(", ")}","first_question":"the opening line one panelist says, max 30 words","why":"one sentence on your design choices"}`,
        `Idea: ${idea}`, 0.9, () => offlineDesign(idea)));
      $("#cuGo").disabled = false;
      const roles = (Array.isArray(out.roles) ? out.roles : []).map(r => Brain.clip(r, 28)).filter(Boolean).slice(0, 3);
      const rub = (Array.isArray(out.rubric) ? out.rubric : []).map(r => Brain.clip(r, 22)).filter(Boolean).slice(0, 4);
      Object.assign(S.custom, {
        title: Brain.clip(out.title, 40) || "My Session", focus: Brain.clip(out.focus, 240),
        pass: Brain.clip(out.pass, 24) || "Pass", fail: Brain.clip(out.fail, 24) || "Try again",
        roles: roles.length >= 2 ? roles : S.custom.roles, rubric: rub.length >= 2 ? rub.map((r, i) => [r, guessKind(r, i)]) : S.custom.rubric,
        opener: Brain.clip(out.first_question, 220)
      });
      S.ctx.custom = Brain.clip(out.skill, 80) || S.ctx.custom;
      const base = bases.includes(out.scene) ? out.scene : "office";
      const match = UI.Lib.scenes().find(s => s.base === base);
      S.sceneSel = { sc: "custom", ids: [match ? match.id : "s-office"] };
      S.custom.scene = S.sceneSel.ids[0];
      scenarioScreen();
      const w = $("#cuWork");
      UI.aiWork(w, ["Reading your idea", "Casting the expert panel", "Choosing what to score", "Picking a setting"]).done(out.why || "Designed from your idea.");
    };
  }
  function offlineDesign(idea) {
    const t = idea.toLowerCase();
    const pick = (re, a, b) => (re.test(t) ? a : b);
    return {
      title: idea.split(/[:.!?]/)[0].split(" ").slice(0, 4).join(" "),
      skill: idea.slice(0, 60),
      focus: "Clear communication, staying calm, and backing up what you say with specifics.",
      roles: pick(/landlord|tenant|neighbou?r/, ["Grumpy landlord", "Housing advisor", "Neighbour"], pick(/customer|client|complain/, ["Angry customer", "Team lead", "Observer"], pick(/doctor|patient|nurse|er\b/, ["Senior nurse", "Doctor", "Patient"], ["Coach", "Tough critic", "Observer"]))),
      rubric: ["Clarity", "Evidence", "Empathy", "Confidence"],
      pass: "Nailed it", fail: "Try again",
      scene: pick(/doctor|patient|lab|nurse/, "lab", pick(/landlord|home|park/, "park", pick(/stage|talk|speech/, "stage", pick(/class|exam|school/, "classroom", "office")))),
      first_question: "Okay, let's start. Tell me what you want, and why it matters to you.",
      why: "I matched the roles to the people in your idea and kept the scoring simple."
    };
  }

  /* ================= STEP 2 · PANEL ================= */
  function panelScreen() {
    UI.steps(STEPS, 1, C);
    const sc = scen();
    if (!S.panel) S.panel = sc.panel.filter(id => UI.Lib.char(id)).slice(0, 3);
    UI.app().innerHTML = `
      <div class="screen-head"><div><span class="kicker" style="color:${C}">🎓 Track 03 · Step 2</span><h2>Choose your panel</h2>
        <p class="muted">Pick <b>2 or 3</b> experts. Each becomes an agent with its own role and opinion of you. Rename their roles below.</p></div></div>
      <div id="cast"></div>
      <div class="card gr-roles" id="roles"></div>
      <div class="action-bar"><button class="btn ghost" id="back">← Scenario</button><span class="muted" id="cnt"></span><button class="btn" id="go">🎓 Start the session</button></div>`;
    const drawRoles = () => {
      $("#roles").innerHTML = `<h3 class="cfg-h">🪪 Expert roles</h3>${S.panel.map((id, i) => { const c = UI.Lib.char(id); return `
        <div class="gr-role"><div class="gr-mini"></div><b>${esc(c.name)}</b><input data-r="${esc(id)}" maxlength="32" value="${esc(S.roles[id] || sc.roles[i] || c.role)}"></div>`; }).join("") || `<p class="muted">Pick at least 2 experts above.</p>`}`;
      $("#roles").querySelectorAll(".gr-mini").forEach((el, i) => Puppet.mount(el, UI.Lib.char(S.panel[i])));
      $("#roles").querySelectorAll("[data-r]").forEach(inp => inp.oninput = () => (S.roles[inp.dataset.r] = inp.value.trim()));
      $("#cnt").innerHTML = `<b style="color:${S.panel.length >= 2 ? C : "var(--text)"}">${S.panel.length}</b> / 3 experts`;
      $("#go").disabled = S.panel.length < 2;
    };
    UI.castPicker($("#cast"), { selected: S.panel, min: 2, max: 3, color: C, detail: "role", onChange: drawRoles });
    drawRoles();
    $("#back").onclick = scenarioScreen;
    $("#go").onclick = () => { S.panel.forEach((id, i) => { if (!S.roles[id]) S.roles[id] = sc.roles[i] || UI.Lib.char(id).role; }); session(); };
  }

  /* ================= OFFLINE SCORER ================= */
  const FILLER = /\b(um+|uh+|erm|like|basically|literally|kind of|sort of|you know|i guess)\b/gi;
  const HEDGE = /\b(maybe|i think|not sure|probably|i don't know|perhaps|i hope|kinda)\b/gi;
  const CONF = /\b(i led|i built|i decided|i will|i'm confident|i am confident|i delivered|i owned|definitely|clearly|i made sure|we shipped|i launched)\b/gi;
  const STAR = /\b(situation|task|action|result|so that|which led|as a result|outcome|because)\b/gi;
  const EXAMPLE = /\b(for example|for instance|when i|last year|in my last|at my previous|one time|once)\b/gi;
  const POLITE = /\b(please|thank|thanks|sorry|excuse|appreciate|por favor|gracias|perdón|merci|s'il vous plaît|pardon|bitte|danke|entschuldigung|grazie|per favore|scusa|お願い|ありがとう|すみません|कृपया|धन्यवाद|माफ़)\b/gi;
  const cnt = (s, re) => (s.match(re) || []).length;
  const clamp5 = v => Math.max(1, Math.min(5, Math.round(v)));
  function heur(answer, kind, sc, q) {
    const a = answer.trim(), words = a ? a.split(/\s+/).length : 0;
    const nums = cnt(a, /\d/g) ? 1 : 0;
    const filler = cnt(a, FILLER), hedge = cnt(a, HEDGE), conf = cnt(a, CONF), star = cnt(a, STAR), ex = cnt(a, EXAMPLE);
    const sentences = a.split(/[.!?。]+/).filter(s => s.trim()).length;
    const nonAscii = /[^\x00-\x7F]/.test(a) || /\b(el|la|los|je|vous|ich|und|il|ciao|hola|bonjour|hallo|yo|quiero|voudrais|möchte)\b/i.test(a);
    const lenScore = words < 6 ? 1 : words < 15 ? 2 : words < 35 ? 3.4 : words < 120 ? 4.2 : 3.6;
    const qWords = new Set(String(q || "").toLowerCase().match(/[a-zà-ÿ]{5,}/g) || []);
    const overlap = (a.toLowerCase().match(/[a-zà-ÿ]{5,}/g) || []).filter(w => qWords.has(w) || String(ctxOf(sc)).toLowerCase().includes(w)).length;
    const lang = sc.id === "language";
    switch (kind) {
      case "clarity": return clamp5(lenScore - filler * 0.6 + (sentences >= 2 ? 0.4 : 0) - (words > 160 ? 1 : 0) + (lang && nonAscii ? 0.6 : 0));
      case "evidence": return clamp5(1.4 + nums * 1.3 + ex * 0.9 + star * 0.4 + (words > 25 ? 0.7 : 0));
      case "depth": return clamp5(1.6 + Math.min(2, overlap * 0.5) + (words > 30 ? 0.9 : 0) + star * 0.3 + (lang ? (nonAscii ? 1.4 : -1) : 0));
      case "confidence": return clamp5(2.8 + conf * 0.8 - hedge * 0.7 - filler * 0.3 + (words > 20 ? 0.5 : -0.6));
      case "polite": return clamp5(2.2 + cnt(a, POLITE) * 1.2 + (words > 10 ? 0.5 : 0));
      case "fluency": return clamp5(lenScore + (lang && nonAscii ? 0.6 : lang ? -1.2 : 0) - filler * 0.4);
      default: return clamp5(lenScore);
    }
  }
  /* the most quotable bit of an answer */
  function quoteOf(answer, good) {
    const parts = answer.split(/(?<=[.!?。])\s+/).map(s => s.trim()).filter(Boolean);
    if (!parts.length) return "";
    let best = parts[0];
    if (good) best = parts.slice().sort((x, y) => (cnt(y, /\d/g) * 3 + cnt(y, EXAMPLE) * 2 + y.length / 60) - (cnt(x, /\d/g) * 3 + cnt(x, EXAMPLE) * 2 + x.length / 60))[0];
    else best = parts.find(p => FILLER.test(p) || HEDGE.test(p)) || parts.slice().sort((x, y) => x.length - y.length)[0];
    FILLER.lastIndex = 0; HEDGE.lastIndex = 0;
    return best.length > 140 ? best.slice(0, 137) + "…" : best;
  }

  /* ================= SESSION ================= */
  let G = null;
  function newSession() {
    const sc = scen();
    const sceneObj = UI.Lib.scene((S.sceneSel && S.sceneSel.sc === S.sc && S.sceneSel.ids[0]) || sc.scene) || UI.Lib.scene(sc.scene) || { base: "office", time: "day" };
    const panel = S.panel.map((id, i) => ({ ...UI.Lib.char(id), xrole: S.roles[id] || sc.roles[i] || UI.Lib.char(id).role, skill: UI.skill((S.skillPick || {})[id] || GROW_SKILLS[i % GROW_SKILLS.length]), color: PLAY.colors[(i * 2 + 2) % PLAY.colors.length], vi: i }));
    return {
      sc, ctx: ctxOf(sc), scene: sceneObj, panel, nq: S.nq,
      level: DIFF[S.diff].d, diffLabel: DIFF[S.diff].label, rubric: sc.rubric.map(r => r[0]),
      qa: [], next: "same", quote: "", used: new Set(), asker: -1, lean: {}
    };
  }

  function session() {
    UI.steps(STEPS, 2, C);
    G = newSession();
    const token = ++UI.ctl.token;
    UI.ctl.paused = false;
    UI.app().innerHTML = `
      <div class="gr-top">
        <div><span class="kicker" style="color:${C}">${G.sc.icon} ${esc(G.sc.id === "custom" ? G.sc.title : G.sc.title)} · ${esc(G.ctx)}</span><h2 id="qLbl">Getting ready…</h2></div>
        <div class="gr-top-r"><span class="src">${UI.srcLabel()}</span>
          <div class="gr-meter" title="Difficulty: the panel adapts to you"><small>DIFFICULTY</small><div class="bar"><i id="meter"></i></div><b id="meterL"></b></div>
          <button class="btn ghost btn-sm" id="voiceT">${UI.ctl.voice ? "🔊 Voices on" : "🔇 Voices off"}</button></div>
      </div>
      <div id="spBar"></div>
      <div class="gr-grid">
        <div class="gr-main">
          <div class="gr-stage" id="stage">
            <svg class="gr-lines" id="lines" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
            ${G.panel.map((p, i) => `<div class="gr-seat" id="seat-${i}" style="left:${seatX(i, G.panel.length)}%;--c:${p.color}">
              <div class="gr-pup"></div><div class="gr-score"></div></div>`).join("")}
            <div class="gr-desk"></div>
            ${G.panel.map((p, i) => `<div class="gr-name" style="left:${seatX(i, G.panel.length)}%;--c:${p.color}"><b>${esc(p.name)}</b><span>${esc(p.xrole)}</span><span class="gr-skill" data-sk="${i}">${UI.skillBadge(p.skill, "pick")}</span></div>`).join("")}
            <div class="gr-sub" id="sub"></div>
            <div class="gr-closed" id="closed"><span>🚪 Behind closed doors…</span></div>
            <div class="gr-badges" id="badges"></div>
          </div>
          <div class="card gr-answer" id="answerBox"></div>
        </div>
        <aside class="gr-side">
          <div class="card gr-rubric" id="rubric"></div>
          <div class="card gr-band" id="band"><div class="log-head mono"><span>📡 BAND · #panel-backchannel</span><small>private</small></div><ol id="bandFeed"></ol></div>
          <div class="card gr-bruin" id="bruin"></div>
          <div class="card gr-log"><div class="log-head mono"><span>SESSION LOG</span><label class="minds"><input type="checkbox" id="showNotes" checked> panel notes</label></div><ol id="glog"></ol></div>
        </aside>
      </div>`;
    G.panel.forEach((p, i) => { const el = $(`#seat-${i} .gr-pup`); Puppet.mount(el, p); p.el = el; });
    Scenes.mount($("#stage"), G.scene);
    G.live = UI.toolsLive($("#stage"), "grow", S.tools);
    UI.sponsorBar($("#spBar"), "grow", S.tools, applyTools, { live: G.live });
    $("#stage").addEventListener("click", e => {
      const b = e.target.closest("[data-sk]"); if (!b) return;
      const p = G.panel[+b.dataset.sk];
      UI.chooseSkill(p.name, p.skill.id, sk => { p.skill = sk; (S.skillPick = S.skillPick || {})[p.id] = sk.id; b.innerHTML = UI.skillBadge(sk, "pick"); drawRubric(); G.live.fx("finch", { text: `${p.name} will score with ${sk.icon} ${sk.name}`, from: $(`#seat-${p.vi}`), n: 0 }); });
    });
    applyTools();
    drawRubric(); drawBruin(); setMeter();
    $("#voiceT").onclick = () => { UI.ctl.voice = !UI.ctl.voice; $("#voiceT").textContent = UI.ctl.voice ? "🔊 Voices on" : "🔇 Voices off"; if (!UI.ctl.voice) UI.stopVoice(); };
    $("#showNotes").onchange = e => $("#glog").classList.toggle("hide-minds", !e.target.checked);
    loop(token).catch(e => { if (e.message !== "aborted") console.error(e); });
  }
  const seatX = (i, n) => n === 2 ? [33, 67][i] : [20, 50, 80][i];
  const on = id => S.tools.has(id);

  function applyTools() {
    if (!G || !$("#stage")) return;
    const st = $("#stage");
    st.classList.toggle("finch", on("finch"));
    $("#band").hidden = !on("band");
    $("#bruin").hidden = !on("bruin");
    if (!on("band")) $("#lines").innerHTML = "";
    $("#badges").innerHTML = on("casuro") ? `<span class="sp-badge" style="--c:#ff6b6b">🎙️ CASURO · voice interview · evidence-based scoring</span>` : "";
    drawRubric(); drawBruin(); drawAnswerHint();
    if (G.live) { G.live.refresh(); bruinDash(); }
  }
  function bruinDash() {
    if (!G.live || !on("bruin")) return;
    const done = G.qa.filter(x => x.scores);
    const avg = done.length ? done.reduce((a, x) => a + x.total, 0) / done.length : 0;
    G.live.dash(`<div class="k"><div><b>${done.length}/${G.nq}</b><small>answered</small></div><div><b>${avg ? avg.toFixed(1) : "–"}</b><small>avg /5</small></div><div><b>${Math.round(G.level)}</b><small>level</small></div></div>
      ${UI.miniBars(G.rubric.map(r => ({ label: r, value: +avgSkill(r).toFixed(1), color: "#ffc857" })))}<small class="muted">score per question</small>${UI.spark(done.map(x => x.total), "#ffc857")}`);
  }

  function setMeter() {
    if (!$("#meter")) return;
    const pct = Math.max(8, Math.min(100, G.level * 20));
    $("#meter").style.width = pct + "%";
    $("#meter").style.background = G.level >= 4 ? "#ff6b6b" : G.level >= 3 ? "var(--gold)" : C;
    $("#meterL").textContent = ["", "Easy", "Medium", "Hard", "Tough", "Brutal"][Math.max(1, Math.min(5, Math.round(G.level)))];
  }

  function avgSkill(name) {
    const v = G.qa.filter(x => x.scores).map(x => x.scores[name]).filter(n => typeof n === "number");
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  }
  function drawRubric() {
    if (!$("#rubric")) return;
    $("#rubric").innerHTML = `<div class="log-head mono"><span>${on("casuro") ? "🎙️ EVIDENCE-BASED RUBRIC" : "SCORED ON"}</span><span>${G.qa.filter(x => x.scores).length}/${G.nq}</span></div>
      ${G.rubric.map(r => { const v = avgSkill(r); return `<div class="gr-rb"><span>${esc(r)}</span><div class="bar"><i style="width:${v * 20}%"></i></div><b>${v ? v.toFixed(1) : "–"}</b></div>`; }).join("")}
      ${on("casuro") ? `<p class="muted gr-note">Every score must point to something you actually said. Quotes appear in the verdict.</p>` : ""}
      ${on("finch") ? `<div class="gr-fskills">${G.panel.map(p => `<span class="gr-fs">${esc(p.name)}: ${UI.skillBadge(p.skill)}</span>`).join("")}</div>` : ""}`;
  }
  /* Casuro: light up the rubric rows that just got evidence */
  function flashRubric(scores) {
    document.querySelectorAll("#rubric .gr-rb").forEach((row, i) => { const r = G.rubric[i]; if (scores && scores[r] != null) { row.classList.remove("lit"); void row.offsetWidth; row.classList.add("lit"); } });
  }
  function drawBruin() {
    if (!$("#bruin") || !on("bruin")) return;
    const done = G.qa.filter(x => x.scores);
    const W = 300, H = 120, pad = 18;
    const pts = done.map((x, i) => [pad + (done.length === 1 ? (W - 2 * pad) / 2 : i * (W - 2 * pad) / Math.max(1, G.nq - 1)), H - pad - (x.total / 5) * (H - 2 * pad)]);
    const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    $("#bruin").innerHTML = `<div class="log-head mono"><span>🏛️ BRUIN · SESSION ANALYTICS</span><small>live</small></div>
      <svg viewBox="0 0 ${W} ${H}" class="gr-chart">
        ${[1, 2, 3, 4, 5].map(v => `<line x1="${pad}" x2="${W - pad}" y1="${H - pad - v / 5 * (H - 2 * pad)}" y2="${H - pad - v / 5 * (H - 2 * pad)}" stroke="rgba(255,255,255,.07)"/>`).join("")}
        ${Array.from({ length: G.nq }, (_, i) => `<text x="${pad + i * (W - 2 * pad) / Math.max(1, G.nq - 1)}" y="${H - 3}" font-size="9" fill="#8d97bd" text-anchor="middle">Q${i + 1}</text>`).join("")}
        ${pts.length ? `<path d="${line}" fill="none" stroke="#ffc857" stroke-width="2.5"/>${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#ffc857"/><text x="${p[0]}" y="${p[1] - 8}" font-size="9" fill="#ffc857" text-anchor="middle">${done[i].total.toFixed(1)}</text>`).join("")}` : `<text x="${W / 2}" y="${H / 2}" fill="#8d97bd" font-size="11" text-anchor="middle">Scores appear after your first answer</text>`}
      </svg>
      <div class="gr-skillbars">${G.rubric.map(r => { const v = avgSkill(r); return `<div><span>${esc(r)}</span><div class="bar"><i style="width:${v * 20}%"></i></div></div>`; }).join("")}</div>
      ${done.length ? `<p class="muted gr-note">Best: Q${done.indexOf(done.slice().sort((a, b) => b.total - a.total)[0]) + 1} · Words per answer: ${Math.round(done.reduce((a, x) => a + x.answer.split(/\s+/).length, 0) / done.length)}</p>` : ""}`;
  }

  function gLog(html, cls) { const li = document.createElement("li"); if (cls) li.className = cls; li.innerHTML = html; $("#glog").prepend(li); }

  function say(p, text, token) {
    const seat = $(`#seat-${p.vi}`);
    G.panel.forEach(x => $(`#seat-${x.vi}`).classList.remove("active"));
    seat.classList.add("active");
    $("#sub").innerHTML = `<b style="color:${p.color}">${esc(p.name)}:</b> ${esc(text)}`;
    if (G.live && on("casuro")) G.live.stat("casuro", `🔊 ${p.name.split(" ")[0]} speaking`);
    $("#sub").classList.add("on");
    Puppet.talk(p.el, Math.min(9000, 600 + text.length * 55));
    Puppet.gesture(p.el, UI.rand(["point", "out", "nod"]), 1800);
    return new Promise(res => {
      let finished = false;
      const fin = () => { if (!finished) { finished = true; Puppet.stopTalk(p.el); res(); } };
      UI.speak(text, p.vi + 1, { force: on("casuro"), onend: fin });
      setTimeout(fin, (UI.ctl.voice || on("casuro")) ? 14000 : Math.min(3200, 900 + text.length * 25) / UI.ctl.speed);
    });
  }

  /* ---------- ask the next question ---------- */
  async function nextQuestion(k) {
    const sc = G.sc, n = G.panel.length;
    const offline = () => {
      let asker = (G.asker + 1) % n;
      let q;
      if (k === 0 && sc.opener) q = sc.opener;
      else if (G.next === "follow_up" && G.quote) {
        q = UI.rand([`You said "${G.quote}". Can you make that concrete? What exactly did you do, and what happened?`, `Let's stay on that. "${G.quote}" — give me one specific example, with a number if you can.`, `I want to push on "${G.quote}". Why should I believe that?`]);
        asker = Math.max(0, G.asker);
        if (sc.id === "language") q = { Spanish: `Dijiste "${G.quote}". ¿Puedes decirlo con más detalle?`, French: `Vous avez dit "${G.quote}". Pouvez-vous préciser ?`, German: `Sie sagten "${G.quote}". Können Sie das genauer erklären?`, Italian: `Hai detto "${G.quote}". Puoi spiegare meglio?`, Japanese: `「${G.quote}」と言いましたね。もう少し詳しく教えてください。`, Hindi: `आपने कहा "${G.quote}"। थोड़ा और बताइए?` }[G.ctx] || q;
      } else {
        const bank = Array.isArray(sc.bank) ? sc.bank : (sc.bank[G.ctx] || sc.bank.Spanish);
        const target = Math.round((Math.min(5, G.level) - 1) / 4 * (bank.length - 1) * 0.6 + k / Math.max(1, G.nq - 1) * (bank.length - 1) * 0.4);
        let idx = target;
        for (let d = 0; d < bank.length; d++) { const c1 = target + d, c2 = target - d; if (c1 < bank.length && !G.used.has(c1)) { idx = c1; break; } if (c2 >= 0 && !G.used.has(c2)) { idx = c2; break; } }
        G.used.add(idx);
        q = bank[idx].replace(/\{ctx\}/g, G.ctx);
        if (G.next === "harder" && sc.id !== "language") q += " And be specific. I want details, not a summary.";
        if (G.next === "easier" && sc.id !== "language") q = "Take your time. " + q;
      }
      if (on("glasser") && G.research && G.research.length && k > 0 && k % 2 === 1 && sc.id !== "language" && G.next !== "follow_up") {
        const r = G.research[(k >> 1) % G.research.length];
        q = `I looked this up: ${r.fact.replace(/\.$/, "")}. ` + q;
      }
      return { asker: G.panel[asker].name, question: q, intent: G.next === "follow_up" ? "Probing a vague answer" : "Core question" };
    };
    const system = `You are running a practice session where AI agents play expert roles and test a human.
Session: ${sc.id === "custom" ? sc.title + " — " + (sc.focus || "") : sc.title}. Topic/context: ${G.ctx}.${sc.id === "language" ? ` Speak ONLY in simple ${G.ctx} (adapt vocabulary to the human's level).` : ""}
Panel: ${G.panel.map(p => `${p.name} (${p.xrole}; personality: ${p.personality})${on("finch") ? ` [Finch skill ${p.skill.name}: ${p.skill.instructions}]` : ""}`).join("; ")}.
Difficulty now: ${G.level}/5. Scored on: ${G.rubric.join(", ")}.
${on("glasser") && G.research && G.research.length ? `Company/role research from Glasser (simulated sample data): ${G.research.map(r => `${r.fact} [${r.provider}]`).join(" | ")}. Ground at least some questions in these findings and mention them naturally.\n` : ""}Pick which panelist asks next (rotate, but the same person may follow up) and write ONE question in that character's voice.
If the instruction is follow_up, quote the human's own words back and push for specifics.
Reply with JSON only: {"asker":"exact panelist name","question":"max 40 words","intent":"what it tests, max 8 words"}`;
    const user = `Question ${k + 1} of ${G.nq}. Instruction from the panel's last private discussion: ${k === 0 ? "open the session" : G.next}${G.quote ? ` (quote: "${G.quote}")` : ""}.
${sc.opener && k === 0 ? `Suggested opener: ${sc.opener}\n` : ""}TRANSCRIPT SO FAR:
${G.qa.map((x, i) => `Q${i + 1} (${x.by}): ${x.q}\nA: ${x.answer}`).join("\n") || "(nothing yet)"}`;
    const out = await Brain.ask(system, user, 0.9, offline);
    let p = G.panel.find(x => x.name === out.asker);
    if (!p) p = G.panel[(G.asker + 1) % n];
    G.asker = p.vi;
    return { p, q: Brain.clip(out.question, 320) || offline().question, intent: Brain.clip(out.intent, 60), src: out._src };
  }

  /* ---------- wait for the human ---------- */
  let rec = null;
  function drawAnswerHint() {
    const h = $("#ansHint"); if (!h) return;
    h.innerHTML = on("casuro") ? "🎙️ Voice mode: the panel speaks, you answer out loud (or type)." : "Tip: use a real example and a number. Vague answers get a follow-up.";
  }
  function askHuman(token, q) {
    return new Promise(resolve => {
      const hasMic = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      $("#answerBox").innerHTML = `
        <div class="gr-ask"><b>Your answer</b><small id="ansHint"></small></div>
        <textarea id="ans" rows="3" maxlength="1200" placeholder="${S.sc === "language" ? "Answer in " + esc(G.ctx) + "…" : "Type your answer…"}"></textarea>
        <div class="gr-ans-row">
          ${hasMic ? `<button class="btn ghost btn-sm ${on("casuro") ? "mic-hot" : ""}" id="mic">🎙️ Speak</button>` : `<span class="muted gr-note">🎙️ Voice input needs Chrome or Edge.</span>`}
          <span class="muted gr-wc" id="wc">0 words</span>
          <button class="btn ghost btn-sm" id="skip">Skip</button>
          <button class="btn btn-sm" id="send">Answer ✓</button>
        </div>`;
      drawAnswerHint();
      if (G.live && on("casuro")) G.live.stat("casuro", "🎙️ listening to you");
      const ta = $("#ans");
      ta.oninput = () => ($("#wc").textContent = (ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0) + " words");
      ta.onkeydown = e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) $("#send").click(); };
      if (!S.demo) setTimeout(() => ta.focus({ preventScroll: true }), 50);
      const done = v => { stopMic(); resolve(v); };
      $("#send").onclick = () => { const v = ta.value.trim(); if (!v) { ta.focus(); ta.classList.add("shake"); setTimeout(() => ta.classList.remove("shake"), 400); return; } done(v); };
      $("#skip").onclick = () => done("(no answer)");
      const mic = $("#mic");
      if (mic) mic.onclick = () => (rec ? stopMic() : startMic(ta, mic));
      if (S.demo) setTimeout(() => { ta.value = DEMO_ANSWERS[(G.qa.length - 1) % DEMO_ANSWERS.length]; ta.oninput(); setTimeout(() => token === UI.ctl.token && $("#send") && $("#send").click(), 400); }, 500);
    });
  }
  function startMic(ta, btn) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    try {
      rec = new SR();
      const langs = { Spanish: "es-ES", French: "fr-FR", German: "de-DE", Italian: "it-IT", Japanese: "ja-JP", Hindi: "hi-IN" };
      rec.lang = S.sc === "language" ? (langs[G.ctx] || "en-US") : "en-US";
      rec.continuous = true; rec.interimResults = true;
      const base = ta.value ? ta.value.trim() + " " : "";
      rec.onresult = e => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; ta.value = base + t; ta.oninput && ta.oninput(); };
      rec.onend = () => { rec = null; if (btn.isConnected) { btn.textContent = "🎙️ Speak"; btn.classList.remove("rec"); } };
      rec.onerror = () => { rec = null; btn.textContent = "🎙️ Mic blocked"; btn.classList.remove("rec"); };
      rec.start();
      btn.textContent = "⏹ Stop"; btn.classList.add("rec");
    } catch { rec = null; }
  }
  function stopMic() { try { rec && rec.stop(); } catch {} rec = null; }
  const DEMO_ANSWERS = [
    "I'm a product manager with four years in B2B SaaS. At my last company I led the launch of a reporting feature that grew weekly active users by 32% in one quarter.",
    "Um, I think I'm basically good with people and stuff, kind of a team player.",
    "For example, last year two teams wanted the same engineers. I set up a one-hour review, we ranked both projects by revenue impact, and as a result we shipped the higher-value one two weeks early.",
    "I would measure success by retention, activation and how quickly the team ships. In the first 30 days I'd talk to 20 customers.",
    "I made a pricing mistake once: I didn't test it, and churn went up 5%. I rolled it back in a week and now I always run a small experiment first."
  ];

  /* ---------- the panel confers ---------- */
  async function confer(x) {
    const sc = G.sc;
    const offline = () => {
      const scores = {};
      sc.rubric.forEach(([name, kind]) => (scores[name] = heur(x.answer, kind, sc, x.q)));
      const total = Object.values(scores).reduce((a, b) => a + b, 0) / sc.rubric.length;
      const weak = sc.rubric.slice().sort((a, b) => scores[a[0]] - scores[b[0]])[0][0];
      const strong = sc.rubric.slice().sort((a, b) => scores[b[0]] - scores[a[0]])[0][0];
      const vague = x.answer.split(/\s+/).length < 18 || scores[weak] <= 2;
      const emo = total >= 3.8 ? "happy" : total >= 3 ? "calm" : total >= 2.2 ? "thinking" : "sad";
      const notes = G.panel.map((p, i) => {
        const focus = on("finch") ? p.skill.name : sc.rubric[i % sc.rubric.length][0];
        const good = total >= 3.2;
        return {
          name: p.name,
          note: x.answer === "(no answer)" ? "Skipped. That's a red flag." : good ? UI.rand([`Strong on ${strong.toLowerCase()}. ${focus}: convincing.`, `I liked "${quoteOf(x.answer, true).slice(0, 50)}".`, `Good. Let's see if it holds under pressure.`]) : UI.rand([`Too vague on ${weak.toLowerCase()}. Needs a real example.`, `${focus} is weak. Push harder.`, `I don't buy it yet.`]),
          emotion: i === G.asker ? (good ? "calm" : "determined") : (good ? UI.rand(["happy", "calm"]) : UI.rand(["thinking", "sad", "sly"])),
          lean: good ? "yes" : "no"
        };
      });
      const a = G.panel[0], b = G.panel[1 % G.panel.length], c = G.panel[G.panel.length - 1];
      const back = [
        { from: a.name, to: b.name, msg: total >= 3.2 ? `That was solid. Raise the bar?` : `Vague. Can you press on ${weak.toLowerCase()}?` },
        { from: b.name, to: c.name, msg: vague ? `Agreed. I'll quote it back to them.` : `Fine by me. ${strong} is clearly there.` }
      ];
      if (G.panel.length > 2) back.push({ from: c.name, to: a.name, msg: total >= 3.8 ? "Leaning hire." : total < 2.4 ? "Leaning no." : "Still on the fence." });
      return {
        scores, panel: notes, backchannel: back,
        next: x.answer === "(no answer)" ? "easier" : vague ? "follow_up" : total >= 3.8 ? "harder" : total < 2.2 ? "easier" : "same",
        quote: vague ? quoteOf(x.answer, false) : quoteOf(x.answer, true),
        feedback: total >= 3.8 ? "Strong answer. The panel is nodding." : vague ? "A bit vague. Expect a follow-up." : "Okay answer. Room to add specifics.",
        emotion: emo
      };
    };
    const system = `You are a panel of AI experts conferring IN PRIVATE about a human's answer during a practice session.
Session: ${sc.title}${sc.focus ? " — " + sc.focus : ""}. Context: ${G.ctx}. Difficulty ${G.level}/5 (${G.diffLabel}).${sc.id === "language" ? ` The human should answer in ${G.ctx}; judge their ${G.ctx}.` : ""}
Panel: ${G.panel.map(p => `${p.name} (${p.xrole})${on("finch") ? ` uses the Finch skill "${p.skill.name}" (${p.skill.instructions})` : ""}`).join("; ")}.
Score ONLY from evidence in the answer${on("casuro") ? " (evidence-based scoring: every judgement must point to the human's words)" : ""}. Be honest: vague answers score 1-2, specific answers with examples/numbers score 4-5.
Rubric (1-5 each): ${G.rubric.join(", ")}.
Reply with JSON only:
{"scores":{${G.rubric.map(r => `"${r}":1`).join(",")}},"panel":[{"name":"panelist","note":"private note, max 18 words","emotion":"one of ${EMOS.join("|")}","lean":"yes|no"}],"backchannel":[{"from":"panelist","to":"panelist","msg":"private message, max 14 words"}],"next":"harder|easier|follow_up|same","quote":"exact words copied from the answer that most influenced you","feedback":"one short sentence shown to the human"}`;
    const user = `QUESTION (${x.by}): ${x.q}\nANSWER: ${x.answer}\nEARLIER: ${G.qa.slice(0, -1).map((y, i) => `Q${i + 1} total ${y.total ? y.total.toFixed(1) : "?"}`).join(", ") || "first answer"}`;
    const out = await Brain.ask(system, user, 0.7, offline);
    const fb = offline();
    const scores = {};
    G.rubric.forEach(r => { const v = out.scores && +out.scores[r]; scores[r] = v >= 1 && v <= 5 ? Math.round(v) : fb.scores[r]; });
    const panel = G.panel.map(p => {
      const n = (Array.isArray(out.panel) ? out.panel : []).find(z => z && z.name === p.name) || fb.panel.find(z => z.name === p.name);
      return { name: p.name, note: Brain.clip(n.note, 140), emotion: EMOS.includes(n.emotion) ? n.emotion : "calm", lean: n.lean === "no" ? "no" : "yes" };
    });
    const names = G.panel.map(p => p.name);
    let back = (Array.isArray(out.backchannel) ? out.backchannel : []).filter(m => m && names.includes(m.from) && names.includes(m.to) && m.from !== m.to).slice(0, 3).map(m => ({ ...m, msg: Brain.clip(m.msg, 110) }));
    if (!back.length) back = fb.backchannel;
    const quote = Brain.clip(out.quote, 160);
    return {
      scores, panel, backchannel: back,
      next: ["harder", "easier", "follow_up", "same"].includes(out.next) ? out.next : fb.next,
      quote: quote && x.answer.toLowerCase().includes(quote.toLowerCase().slice(0, 20)) ? quote : fb.quote,
      feedback: Brain.clip(out.feedback, 160) || fb.feedback, src: out._src
    };
  }

  /* ---------- BAND back-channel: animated lines between puppets ---------- */
  async function showBackchannel(msgs, token) {
    if (!on("band")) return;
    const svg = $("#lines");
    for (const m of msgs) {
      const a = G.panel.find(p => p.name === m.from), b = G.panel.find(p => p.name === m.to);
      if (!a || !b) continue;
      const x1 = seatX(a.vi, G.panel.length), x2 = seatX(b.vi, G.panel.length);
      const mid = (x1 + x2) / 2;
      if (G.live) G.live.fx("band", { text: `${a.name} → ${b.name}: ${m.msg}`, from: $(`#seat-${a.vi}`), to: $(`#seat-${b.vi}`), callout: false });
      const li = document.createElement("li");
      li.innerHTML = `<span class="gr-from" style="color:${a.color}">${esc(a.name)}</span> → <span style="color:${b.color}">${esc(b.name)}</span><span>${esc(m.msg)}</span>`;
      $("#bandFeed").prepend(li);
      const pill = document.createElement("div");
      pill.className = "gr-pill"; pill.style.left = mid + "%"; pill.style.borderColor = a.color;
      pill.textContent = "📡 " + m.msg;
      $("#stage").appendChild(pill);
      await UI.sleep(1500, token);
      pill.remove();
    }
    svg.innerHTML = "";
  }

  /* Glasser (simulated): the panel researches the company / role before asking */
  async function glasserResearch(token) {
    if (G.research || !on("glasser")) return;
    G.research = [];
    const sc = G.sc;
    const offline = () => ({ findings: PLAY.glasser.facts.grow.slice().sort(() => Math.random() - 0.5).slice(0, 3).map((f, i) => ({ source: ["Apollo company search", "BuiltWith tech stack lookup", "Crustdata headcount growth"][i], fact: f })) });
    gLog(`<b style="color:#7cc8ff">🔭 Glasser</b><span class="act">The panel is researching "${esc(G.ctx)}" before the next question…</span>`);
    const out = await Brain.ask(`You are a research agent for an interview/coaching panel. You use Glasser, a pay-as-you-go data API for agents (company search, people data, tech stack, headcount growth, web search, reviews).
Produce 3 short, plausible findings about the company/role/topic the human is practising for, as if returned by those APIs. They are SIMULATED sample data for a demo, so keep them generic and believable, never claim to be exact.
Reply with JSON only: {"findings":[{"source":"provider + endpoint, e.g. Apollo company search","fact":"max 18 words"}]}`,
      `Session: ${sc.title}. Topic/context: ${G.ctx}.`, 0.8, offline);
    if (token !== UI.ctl.token) return;
    const list = (Array.isArray(out.findings) ? out.findings : offline().findings).slice(0, 3).map(f => ({ source: Brain.clip(f.source, 50), fact: Brain.clip(f.fact, 140) })).filter(f => f.fact);
    for (const [i, f] of list.entries()) {
      const g = UI.glasserCall(G.live, { topic: f.source + " " + f.fact, fact: f.fact, from: $(`#seat-${i % G.panel.length}`) });
      G.research.push({ ...f, price: g ? g.price : 0, provider: g ? g.ep.provider : f.source });
      gLog(`<b style="color:#7cc8ff">🔭 ${esc(g ? g.ep.provider + " · " + PLAY.glasser.price(g.price) : f.source)}</b><span class="act">${esc(f.fact)}</span><span class="thought">simulated sample data</span>`);
      await UI.sleep(900, token);
    }
  }

  async function loop(token) {
    await UI.sleep(500, token);
    for (let k = 0; k < G.nq; k++) {
      await UI.waitWhilePaused(token);
      $("#qLbl").textContent = `Question ${k + 1} of ${G.nq}`;
      if (on("glasser") && !G.research) await glasserResearch(token);
      $("#answerBox").innerHTML = `<div class="thinking-row"><span class="think-chip" style="--c:${C}">The panel is choosing the next question<span class="dots3"><i></i><i></i><i></i></span></span></div>`;
      G.panel.forEach(p => Puppet.emotion(p.el, "thinking"));
      const q = await nextQuestion(k);
      if (token !== UI.ctl.token) return;
      G.panel.forEach(p => Puppet.emotion(p.el, p === q.p ? "calm" : "neutral"));
      const x = { q: q.q, by: q.p.name, intent: q.intent, asker: q.p.vi };
      G.qa.push(x);
      gLog(`<span class="ts">Q${k + 1}${q.intent ? " · " + esc(q.intent) : ""}</span><b style="color:${q.p.color}">${esc(q.p.name)}</b><span class="act">${esc(q.q)}</span>`);
      const talking = say(q.p, q.q, token);
      const ans = await askHuman(token, q.q);
      await talking;
      if (token !== UI.ctl.token) return;
      x.answer = ans;
      gLog(`<b>🧑 You</b><span class="say">“${esc(ans)}”</span>`, "you");
      // confer in private
      $("#sub").classList.remove("on");
      $("#closed").classList.add("on");
      $("#answerBox").innerHTML = `<div class="thinking-row">${G.panel.map(p => `<span class="think-chip" style="--c:${p.color}">${esc(p.name)} is taking notes<span class="dots3"><i></i><i></i><i></i></span></span>`).join("")}</div>`;
      G.panel.forEach(p => Puppet.emotion(p.el, "thinking"));
      const r = await confer(x);
      if (token !== UI.ctl.token) return;
      x.scores = r.scores;
      x.total = Object.values(r.scores).reduce((a, b) => a + b, 0) / G.rubric.length;
      x.notes = r.panel; x.quote = r.quote; x.feedback = r.feedback;
      $("#closed").classList.remove("on");
      // reactions
      r.panel.forEach((n, i) => {
        const p = G.panel.find(z => z.name === n.name); if (!p) return;
        G.lean[p.name] = n.lean;
        setTimeout(() => {
          Puppet.emotion(p.el, n.emotion);
          Puppet.gesture(p.el, x.total >= 3.6 ? UI.rand(["nod", "nod", "raise"]) : x.total < 2.4 ? UI.rand(["cross", "shrug", "slump"]) : UI.rand(["nod", "shrug"]), 2200);
        }, i * 260);
      });
      G.panel.forEach(p => {
        const sEl = $(`#seat-${p.vi} .gr-score`);
        const lean = G.lean[p.name];
        sEl.innerHTML = lean ? `<span class="${lean === "yes" ? "y" : "n"}">${lean === "yes" ? "👍" : "👎"}</span>` : "";
      });
      gLog(`<span class="ts">PANEL · PRIVATE</span>${r.panel.map(n => `<span class="thought"><b>${esc(n.name)}:</b> ${esc(n.note)}</span>`).join("")}
        <span class="gr-mini-sc">${G.rubric.map(k2 => `${esc(k2)} <b>${r.scores[k2]}</b>`).join(" · ")}</span>
        ${r.src === "offline" && Brain.mode === "llm" ? `<span class="warn-s">⚠ LLM failed, used offline panel</span>` : ""}`, "panel");
      const chip = `<div class="gr-qscore ${x.total >= 3.6 ? "good" : x.total < 2.4 ? "bad" : ""}"><b>${x.total.toFixed(1)}</b><small>/5</small><span>${esc(r.feedback)}</span>${r.next === "follow_up" ? `<em>Follow-up coming: "${esc(r.quote)}"</em>` : r.next === "harder" ? `<em>⬆ The panel is raising the difficulty.</em>` : r.next === "easier" ? `<em>⬇ The panel is easing off a little.</em>` : ""}</div>`;
      $("#answerBox").innerHTML = chip;
      // adapt
      G.next = r.next; G.quote = r.next === "follow_up" ? r.quote : "";
      G.level = Math.max(1, Math.min(5, G.level + (r.next === "harder" ? 1 : r.next === "easier" ? -1 : 0)));
      setMeter(); drawRubric(); drawBruin(); bruinDash();
      if (G.live) {
        if (on("casuro")) { G.live.stat("casuro", null); G.live.fx("casuro", { text: `Evidence: "${Brain.clip(r.quote || x.answer, 60)}" → ${x.total.toFixed(1)}/5` }); flashRubric(r.scores); }
        if (on("finch")) r.panel.forEach((n, i) => { const p = G.panel.find(z => z.name === n.name); if (!p) return; G.live.fx("finch", { text: `${p.name} · ${p.skill.icon} ${p.skill.name}: ${n.note}`, from: $(`#seat-${p.vi}`), callout: i === 0 }); });
        if (on("bruin")) G.live.fx("bruin", { text: `Logged Q${k + 1}: ${x.total.toFixed(1)}/5 · next ${r.next.replace("_", "-")}`, callout: false });
      }
      await showBackchannel(r.backchannel, token);
      await UI.sleep(S.demo ? 600 : 1600, token);
    }
    await verdict(token);
  }

  /* ================= STEP 4 · VERDICT ================= */
  async function verdict(token) {
    UI.steps(STEPS, 3, C);
    $("#qLbl").textContent = "The panel is deciding…";
    $("#closed").classList.add("on");
    $("#answerBox").innerHTML = `<div class="thinking-row"><span class="think-chip" style="--c:${C}">🚪 Final deliberation<span class="dots3"><i></i><i></i><i></i></span></span></div>`;
    const sc = G.sc;
    const skills = {}; G.rubric.forEach(r => (skills[r] = avgSkill(r)));
    const overall = Math.round(Object.values(skills).reduce((a, b) => a + b, 0) / G.rubric.length * 20 * (0.92 + Math.min(5, G.level) * 0.03));
    const pass = overall >= 62;
    const level = overall < 35 ? "A1" : overall < 50 ? "A2" : overall < 65 ? "B1" : overall < 80 ? "B2" : "C1";
    const answered = G.qa.filter(x => x.answer && x.answer !== "(no answer)");
    const offline = () => {
      const best = answered.slice().sort((a, b) => b.total - a.total), worst = answered.slice().sort((a, b) => a.total - b.total);
      const topSk = Object.keys(skills).sort((a, b) => skills[b] - skills[a]), lowSk = topSk.slice().reverse();
      return {
        result: sc.levels ? `${G.ctx} level ${level}` : pass ? sc.pass : sc.fail,
        summary: pass ? `You gave the panel concrete evidence when it mattered, especially on ${topSk[0].toLowerCase()}. ${lowSk[0]} is the one thing holding you back.` : `The panel wanted more specifics. Your best moments were real examples; the weakest were general statements about yourself.`,
        strengths: best.slice(0, 2).map((x, i) => ({ point: `${topSk[i % topSk.length]}: you backed it up`, quote: quoteOf(x.answer, true) })),
        improvements: worst.slice(0, 2).map((x, i) => ({ point: `${lowSk[i % lowSk.length]}: be more specific`, quote: quoteOf(x.answer, false) })),
        panel: G.panel.map(p => ({ name: p.name, verdict: G.lean[p.name] === "no" ? UI.rand(["Not convinced yet. Needs sharper examples.", "Close, but I'd want another round.", "Too many general answers for me."]) : UI.rand(["I'd say yes. Clear and specific.", "Good instincts. I'm in.", "Convincing when it counted."]) })),
        tips: [`Use the STAR method: situation, task, action, result.`, `Put one number in every answer.`, `Cut filler words like "basically" and "kind of".`].concat(sc.id === "language" ? [`Learn 5 polite phrases in ${G.ctx}.`] : [])
      };
    };
    const system = `You are the expert panel delivering a final verdict on a practice session. Base everything on the transcript; QUOTE the human's exact words as evidence.
Session: ${sc.title}. Context: ${G.ctx}. Result labels: ${sc.levels ? `a ${G.ctx} CEFR level like "${G.ctx} level B1"` : `"${sc.pass}" or "${sc.fail}"`}. Computed overall score: ${overall}/100 (${pass ? "passing" : "not passing"}).
Reply with JSON only: {"result":"label","summary":"2 sentences","strengths":[{"point":"max 10 words","quote":"exact words from an answer"}],"improvements":[{"point":"max 10 words","quote":"exact words from an answer"}],"panel":[{"name":"panelist","verdict":"one line in character, max 16 words"}],"tips":["3 short practise-next tips"]}`;
    const user = `PANEL: ${G.panel.map(p => `${p.name} (${p.xrole})`).join(", ")}\nTRANSCRIPT:\n${G.qa.map((x, i) => `Q${i + 1} (${x.by}): ${x.q}\nA: ${x.answer}\nPanel score: ${x.total ? x.total.toFixed(1) : "?"}/5`).join("\n")}`;
    const out = await Brain.ask(system, user, 0.7, offline);
    if (token !== UI.ctl.token) return;
    const fb = offline();
    const listOk = a => Array.isArray(a) && a.length ? a.slice(0, 3).map(z => ({ point: Brain.clip(z.point, 90), quote: Brain.clip(z.quote, 180) })).filter(z => z.point) : null;
    const v = {
      result: Brain.clip(out.result, 40) || fb.result, summary: Brain.clip(out.summary, 400) || fb.summary,
      strengths: listOk(out.strengths) || fb.strengths, improvements: listOk(out.improvements) || fb.improvements,
      panel: G.panel.map(p => { const z = (Array.isArray(out.panel) ? out.panel : []).find(y => y && y.name === p.name); return { p, verdict: Brain.clip(z && z.verdict, 120) || fb.panel.find(y => y.name === p.name).verdict }; }),
      tips: (Array.isArray(out.tips) && out.tips.length ? out.tips : fb.tips).slice(0, 4).map(t => Brain.clip(t, 120))
    };
    $("#closed").classList.remove("on");
    $("#qLbl").textContent = "Verdict";
    G.panel.forEach(p => { Puppet.emotion(p.el, pass ? "happy" : "calm"); Puppet.gesture(p.el, pass ? "raise" : "nod", 2400); });
    const good = sc.levels ? overall >= 50 : pass;
    UI.app().querySelector(".gr-grid").insertAdjacentHTML("afterend", `
      <section class="card gr-verdict ${good ? "pass" : "fail"}" id="verdict">
        <div class="gr-v-head">
          <div class="gr-ring" style="--p:${overall}"><b>${overall}</b><small>/100</small></div>
          <div><small class="kicker">FINAL VERDICT · ${esc(sc.title.toUpperCase())}</small><h2>${good ? "✅" : "🔁"} ${esc(v.result)}</h2><p>${esc(v.summary)}</p>
            ${on("casuro") ? `<span class="sp-badge" style="--c:#ff6b6b">🎙️ Casuro · every point is backed by your words</span>` : ""}</div>
        </div>
        <div class="gr-v-grid">
          <div><h3 class="cfg-h">📊 Skills</h3>${G.rubric.map(r => `<div class="gr-rb big"><span>${esc(r)}</span><div class="bar"><i style="width:${skills[r] * 20}%"></i></div><b>${skills[r].toFixed(1)}</b></div>`).join("")}</div>
          <div><h3 class="cfg-h">💪 Strengths</h3><ul class="gr-ev">${v.strengths.map(s => `<li><b>${esc(s.point)}</b>${s.quote ? `<q>${esc(s.quote)}</q>` : ""}</li>`).join("")}</ul>
            <h3 class="cfg-h">🛠️ Improve</h3><ul class="gr-ev bad">${v.improvements.map(s => `<li><b>${esc(s.point)}</b>${s.quote ? `<q>${esc(s.quote)}</q>` : ""}</li>`).join("")}</ul></div>
        </div>
        <h3 class="cfg-h">🧑‍⚖️ The panel</h3>
        <div class="gr-v-panel">${v.panel.map(z => `<div class="gr-vp" style="--c:${z.p.color}"><div class="gr-vpup"></div><div><b>${esc(z.p.name)}</b><small>${esc(z.p.xrole)}</small><p>“${esc(z.verdict)}”</p><span class="${G.lean[z.p.name] === "no" ? "n" : "y"}">${G.lean[z.p.name] === "no" ? "👎 No" : "👍 Yes"}</span></div></div>`).join("")}</div>
        <h3 class="cfg-h">🎯 Practise next</h3><ol class="gr-tips">${v.tips.map(t => `<li>${esc(t)}</li>`).join("")}</ol>
        <div class="after-btns">
          <button class="btn" id="again">🔁 Try again (same panel)</button>
          <button class="btn ghost" id="harder">⬆ Harder</button>
          <button class="btn ghost" id="change">🎛️ Change scenario</button>
          <a class="btn ghost" href="#film">🎬 Try Track 1</a>
        </div>
      </section>`);
    $("#answerBox").innerHTML = `<div class="gr-qscore ${good ? "good" : "bad"}"><b>${overall}</b><small>/100</small><span>${esc(v.result)}. Scroll down for the full verdict.</span></div>`;
    UI.app().querySelectorAll(".gr-vpup").forEach((el, i) => { Puppet.mount(el, v.panel[i].p); Puppet.emotion(el, G.lean[v.panel[i].p.name] === "no" ? "thinking" : "happy"); });
    const spk = v.panel[0];
    UI.speak(`${v.result}. ${v.summary}`, spk.p.vi + 1, { force: on("casuro") });
    drawBruin();
    if (!S.demo) $("#verdict").scrollIntoView({ behavior: "smooth", block: "start" });
    $("#again").onclick = () => { S.demo = false; session(); };
    $("#harder").onclick = () => { S.demo = false; S.diff = Math.min(2, S.diff + 1); session(); };
    $("#change").onclick = () => { S.demo = false; scenarioScreen(); };
  }

  function start(sub) {
    S.demo = false;
    if (sub === "demo" || sub === "demo-tools") {
      S.demo = true; S.sc = "interview"; S.panel = null; S.nq = 4; UI.ctl.speed = 3;
      if (sub === "demo-tools") ["band", "bruin", "finch", "casuro", "glasser"].forEach(t => S.tools.add(t));
      const sc = scen(); S.panel = sc.panel.slice(); S.panel.forEach((id, i) => (S.roles[id] = sc.roles[i]));
      return session();
    }
    UI.ctl.speed = 1;
    scenarioScreen();
  }
  return { start };
})();

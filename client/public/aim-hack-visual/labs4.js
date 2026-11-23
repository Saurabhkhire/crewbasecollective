/* Sponsor Labs, part 4: Teamily AI (humans and always-on agents in one group chat).
   Registers into window.__LABS__.LABS created by labs.js.
   Create role agents ("+ New Agent"), drop a task in the channel, @mention agents, and watch each one act
   in its role (marketing drafts posts, design picks a palette, engineering ships code…) and hand work to the others.
   LLM mode: each agent answers through Brain.ask with its role + your instructions. Offline: role templates.
   SIMULATED: nothing is sent to Teamily. Role catalogue lives in PLAY.teamily (play-data.js). */
(function () {
  const L = window.__LABS__;
  if (!L) return;
  const { LABS, $, $$, esc, rand, wait, rr, textBox } = L;
  const P = window.PLAY, T = P && P.teamily;
  if (!T) return;
  const C = "#8b7bff";
  const role = id => T.roles.find(r => r.id === id) || T.roles[0];
  const TASKS = [
    "Launch our agent film next Friday",
    "Get 50 players for our co-op zombie game playtest",
    "Help me prepare a 2-minute sales pitch",
    "Build a website for our hackathon project @Engineer @Design",
    "Make a 60-second demo video of our project @Video",
    "Find sponsors for our community meetup"
  ];
  /* which roles a task needs when nobody is @mentioned */
  const ROUTE = [
    [/launch|post|market|promo|hype|audience|social|rsvp|players|signup|sign-up/i, "marketing"],
    [/video|trailer|teaser|reel|clip|recording|montage/i, "video"],
    [/research|competitor|fact|data|market size|users|who are/i, "research"],
    [/poster|design|logo|visual|brand|colou?r|thumbnail/i, "design"],
    [/build|page|code|app|site|website|bug|fix|prototype|landing/i, "engineer"],
    [/plan|when|deadline|schedule|timeline|friday|week|tomorrow/i, "producer"],
    [/test|qa|check|break|playtest/i, "qa"],
    [/pitch|practice|interview|learn|coach|prepare|feedback/i, "coach"],
    [/sponsor|outreach|email|sell|sales|deal|partner/i, "sales"]
  ];
  const topicOf = t => String(t).replace(/@[\w-]+/g, "").replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "") || "our project";

  /* ---------- offline role behaviour: what each role says, makes, and who it hands off to ---------- */
  const OFF = {
    marketing: t => ({ say: `On it. Positioning: "${cap(t)}, the version people share." 3 posts drafted, one per channel.`, card: { kind: "list", title: "📣 Launch posts (draft)", lines: [`X: "${cap(t)}. Agents decide the ending. You decide whether to watch. 🎬"`, `LinkedIn: why we built it with a human + agent team, in 4 lines`, `Discord: invite + 3 sneak-peek frames, CTA: RSVP`] }, handoff: ["design", "I need a hero visual for post 1."] }),
    research: t => ({ say: `Did a first pass on "${t}". Three findings worth acting on:`, card: { kind: "list", title: "🔎 Findings (simulated sources)", lines: ["Builders share demos with a moving character 2× more than screenshots", "Friday-evening launches get most replies in community channels", "Top 3 similar projects all lack a visible decision log, so that's our edge"] }, handoff: ["marketing", "Use finding 3 as the hook."] }),
    design: t => ({ say: `Visual direction for "${t}": night-neon, one bold title, a single character in frame.`, card: { kind: "palette", title: "🎨 Palette + poster", lines: ["#0b1022", "#8b7bff", "#ff4fa3", "#ffc857", "#eaf0ff"], note: "Title in Space Grotesk 800, character centre-left" }, handoff: ["engineer", "Can you put this on the page header?"] }),
    engineer: t => ({ say: `Built the website for "${t}" and it's live in preview: hero, demo video, how it works, sign-up.`, card: { kind: "site", title: "💻 Website · live preview", head: cap(t), lines: ["Hero + one-line pitch", "Demo video embedded", "How the agents work, in 3 steps", "Sign-up form → our Teamily group"] }, handoff: ["qa", "Please check mobile + links."] }),
    video: t => ({ say: `Cut a 0:58 demo video for "${t}" from our recordings. Captions on, ready to post.`, card: { kind: "video", title: "🎬 demo-video.mp4 · 0:58", head: cap(t), lines: ["0:00 Hook: the ending nobody wrote", "0:08 The setup in one shot", "0:20 Agents deciding live (sped up)", "0:45 Results + call to action"] }, handoff: ["marketing", "Video's ready to attach to the launch posts."] }),
    producer: t => ({ say: `Turned this into a plan with owners. Pinned to the channel 📌`, card: { kind: "list", title: "📋 Plan · " + t.slice(0, 32), lines: ["Mon · research + positioning → Research, Marketing", "Wed · visuals + page → Design, Engineer", "Thu · QA pass + invites → QA, Marketing", "Fri · launch 🚀 → everyone"] }, handoff: null }),
    qa: t => ({ say: `Ran checks on "${t}". 4 pass, 1 needs a fix.`, card: { kind: "list", title: "🧪 Checks", lines: ["✓ desktop layout", "✓ links work", "✓ copy has no typos", "✓ loads under 2 s", "✗ CTA hidden on small phones"] }, handoff: ["engineer", "CTA is cut off under 380 px."] }),
    coach: t => ({ say: `Let's practise "${t}". One thing at a time: your opening line.`, card: { kind: "list", title: "🎯 Practice plan", lines: ["1 · Say it once out loud, I time you", "2 · Fix ONE thing: a slower, clearer ask", "3 · Add one number that proves it", "4 · Again at 6 pm ⏰"] }, handoff: ["research", "Find one strong number for slide 2."] }),
    sales: t => ({ say: `Drafted outreach for "${t}". Short and personal.`, card: { kind: "list", title: "🤝 Email draft", lines: ["Subject: 2 minutes on what comes after chat", "Hi {name}, we're a human + agent team building …", "One line on why it matters to you", "Ask: 15-min call this week?"] }, handoff: null })
  };
  const cap = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);

  /* ---------- demo "video" (canvas 640×360) ---------- */
  const DM = [
    ["🧑", "#eaf0ff", "You", "Launch our film Friday. @Marketing @Design"],
    ["📣", "#ff6f61", "Marketing Agent", "3 posts drafted. @Design, need a visual."],
    ["🎨", "#ff4fa3", "Design Agent", "Poster v1 + palette posted ✓"],
    ["💻", "#3ee6ff", "Engineer Agent", "Website is live in preview ✓"],
    ["🎬", "#ff9f43", "Video Agent", "Demo video cut: 0:58, captions on ✓"]
  ];
  function demoUI(ctx, W, H, members, msgs, typing) {
    ctx.fillStyle = "#0b1022"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#121735"; rr(ctx, 12, 12, 150, H - 24, 12); ctx.fill();
    ctx.fillStyle = C; ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.fillText("TEAMILY AI", 26, 34);
    ctx.fillStyle = "#c9c2ff"; ctx.font = "600 13px 'Space Grotesk', sans-serif"; ctx.fillText("# film-launch", 26, 58);
    DM.slice(0, members).forEach(([e, col, n], i) => { ctx.fillStyle = "rgba(255,255,255,.06)"; rr(ctx, 22, 74 + i * 34, 130, 28, 8); ctx.fill(); ctx.fillStyle = col; ctx.fillRect(22, 74 + i * 34, 3, 28); ctx.fillStyle = "#eaf0ff"; ctx.font = "12px 'Space Grotesk', sans-serif"; ctx.fillText(`${e} ${n}`, 32, 93 + i * 34); });
    ctx.fillStyle = "#10142e"; rr(ctx, 174, 12, W - 186, H - 24, 12); ctx.fill(); ctx.strokeStyle = "rgba(139,123,255,.5)"; ctx.lineWidth = 1.5; ctx.stroke();
    DM.slice(0, msgs).forEach(([e, col, n, t], i) => {
      const y = 30 + i * 58; ctx.fillStyle = col; ctx.globalAlpha = .25; ctx.beginPath(); ctx.arc(200, y + 16, 14, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      ctx.font = "16px sans-serif"; ctx.fillText(e, 191, y + 22);
      ctx.fillStyle = col; ctx.font = "700 12px 'Space Grotesk', sans-serif"; ctx.fillText(n + (i ? "  · AGENT" : ""), 222, y + 10);
      ctx.fillStyle = "#eaf0ff"; ctx.font = "14px 'Space Grotesk', sans-serif"; ctx.fillText(t, 222, y + 30);
    });
    if (typing) { ctx.fillStyle = C; ctx.font = "12px 'Space Grotesk', sans-serif"; ctx.fillText(typing + " is typing…", 222, H - 26); }
  }

  LABS.push({
    id: "teamily", tool: "Humans + agents in one chat", playLink: "film",
    title: "Run a team of humans and role agents in one group chat",
    pitch: "Teamily AI is the official communication platform of this hackathon (it replaces Discord and Slack), and agents are members of the chat too. Make any agent you want: a preset (marketing, research, design, engineering, QA, coach, sales) or your own role, job and personality. Drop a task in the channel and watch each agent act in its role: the Marketing Agent writes posts, the Design Agent picks a palette, the Engineer Agent builds the website, the Video Agent cuts the demo video, and they @mention each other to hand work on. Teamily is not just the event chat: your agents build things in it.",
    how: [
      "<b>＋ New Agent</b>: start from a preset or blank and make <b>any agent you want</b>: emoji, name, role, what it does, personality and colour. It joins the channel as a member, like a teammate.",
      "<b>Post a task</b> in the channel. <b>@mention</b> agents to pick who works on it, or don't, and the right roles pick it up.",
      "Each agent answers <b>in its role</b> and posts a deliverable card: launch posts, a palette, a live website, a demo video, a plan, checks, a practice plan or an email.",
      "Agents <b>hand off</b> to each other in the thread (\"@Design, I need a visual\"). With <b>Always-on</b>, they follow up on their own.",
      "Watch the <b>how-it-works strip</b> light up and read <b>Behind the scenes</b>: who was picked and why, what each agent was told, and every hand-off.",
      "This lab simulates Teamily AI. At the hackathon, join Teamily AI to get every announcement and update, and to talk with your team."
    ],
    demoChars: ["kit"], demoScenes: {},
    demo: [
      { cap: "+ New Agent: create agents with roles", dur: 3.2, draw(ctx, p, A, W, H) { demoUI(ctx, W, H, Math.min(5, 1 + Math.floor(p * 5)), 0); textBox(ctx, "+ New Agent → role agents join the chat", 410, H - 70, 360, { center: true, bg: "rgba(139,123,255,.95)", color: "#fff" }); } },
      { cap: "Post a task and @mention agents", dur: 2.8, draw(ctx, p, A, W, H) { demoUI(ctx, W, H, 5, 1, p > .5 ? "📣 Marketing Agent" : ""); } },
      { cap: "Each agent acts in its role and hands off", dur: 4.4, draw(ctx, p, A, W, H) { const n = 2 + Math.floor(p * 3); demoUI(ctx, W, H, 5, Math.min(5, n), n < 5 ? DM[Math.min(4, n)][2] : ""); } },
      { cap: "Humans and agents ship it together", dur: 3.4, draw(ctx, p, A, W, H) { demoUI(ctx, W, H, 5, 5); textBox(ctx, "✓ 4 agents · 5 messages · 3 deliverables · one thread", 410, H - 70, 420, { center: true, bg: "rgba(139,123,255,.95)", color: "#fff" }); } }
    ],
    build: buildTeamily
  });

  function buildTeamily(main, coord) {
    coord = coord || { pulse() {} };
    const S = {
      ch: "#launch", agents: [], n: 0, busy: false, mem: [], tok: 0,
      threads: { "#launch": [], "#film-crew": [], "#game-squad": [], "#study-group": [] }
    };
    const PALETTE = ["#ff6f61", "#7cc8ff", "#ff4fa3", "#3ee6ff", "#ffc857", "#b6ff5c", "#c48bff", "#4fd1c5", "#ff9f43", "#8b7bff"];
    const EMOJI = ["🤖", "🦊", "🧙", "🕵️", "⚖️", "🎧", "🧑‍🍳", "🦸", "🧛", "📚", "💰", "🎤", "🩺", "🚀", "🎲", "🌱"];
    /* every agent carries its own role object: a preset from PLAY.teamily.roles, or a fully custom one */
    function mkAgent(o) {
      const pre = T.roles.find(r => r.id === o.preset);
      const r = pre && !o.custom ? { ...pre } : {
        id: "custom", name: (o.roleName || "Custom") + " Agent", icon: o.icon || "🤖", color: o.color || PALETTE[S.n % PALETTE.length],
        does: o.does || "Helps the team", style: o.style || "helpful and concise",
        words: String((o.roleName || "") + " " + (o.does || "")).toLowerCase().split(/[^a-z]+/).filter(w => w.length > 3)
      };
      const a = { uid: "a" + ++S.n, role: pre && !o.custom ? pre.id : "custom", r, name: o.name || r.name, icon: o.icon || r.icon, color: o.color || r.color, notes: o.notes || "" };
      S.agents.push(a); return a;
    }
    ["marketing", "design", "engineer", "video", "producer"].forEach(p => mkAgent({ preset: p }));

    const FLOW = [
      ["create", "＋", "Create agents", "Each agent gets a role, a job and a personality. It joins the group as a member."],
      ["post", "💬", "Post a task", "A human writes in the channel, like in any team chat."],
      ["route", "🎯", "Pick who works", "@mentioned agents first; otherwise the agents whose role matches the task's words."],
      ["act", "🧠", "Act in role", "Each agent gets its role + your instructions + the recent chat, and answers with a deliverable."],
      ["hand", "🔁", "Hand off", "Agents @mention each other when they need another role's help."],
      ["follow", "⏰", "Always-on", "Agents follow up on their own: check-ins, summaries, reminders."]
    ];

    main.innerHTML = `
      <div class="tml">
        <div class="tml-top"><b>💬 Teamily AI</b><span class="tml-ws">Humans + agents in one group chat</span><span class="tml-req">OFFICIAL EVENT CHAT</span>
          <label class="tml-on"><input type="checkbox" id="tmOn" checked> Always-on agents</label></div>
        <ol class="tml-flow" id="tmFlow">${FLOW.map((f, i) => `<li data-f="${f[0]}"><i>${f[1]}</i><b>${i + 1} · ${esc(f[2])}</b><small>${esc(f[3])}</small></li>`).join("")}</ol>
        <div class="tml-body">
          <aside class="tml-side">
            <small>CHANNELS</small><div id="tmCh"></div>
            <small>MEMBERS</small><div id="tmMem"></div>
          </aside>
          <section class="tml-chat">
            <div class="tml-head"><b id="tmChName"></b><span id="tmChSub"></span></div>
            <div class="tml-thread" id="tmThread"></div>
            <div class="tml-mentions" id="tmAt"></div>
            <div class="lab-bar tml-compose"><input id="tmIn" maxlength="200" placeholder="Message the team… use @ to mention an agent" value="${esc(TASKS[0])} @Marketing @Design"><button class="btn btn-sm" id="tmSend">Send</button></div>
            <div class="ex-chips" id="tmEx">${TASKS.map(t => `<button>${esc(t)}</button>`).join("")}</div>
          </section>
        </div>
        <div class="tml-new">
          <div class="lp-h">＋ NEW AGENT · MAKE ANY AGENT YOU WANT</div>
          <div class="tml-presets" id="tmPre"><small>Start from:</small>${T.roles.map(r => `<button data-pre="${r.id}" style="--k:${r.color}">${r.icon} ${esc(r.name.replace(" Agent", ""))}</button>`).join("")}<button data-pre="custom" class="on" style="--k:#8b7bff">✨ Blank</button></div>
          <div class="tml-form">
            <label>Emoji<select id="tmIcon">${EMOJI.concat(T.roles.map(r => r.icon)).filter((e, i, a) => a.indexOf(e) === i).map(e => `<option>${e}</option>`).join("")}</select></label>
            <label>Name<input id="tmName" maxlength="24" placeholder="e.g. Luna"></label>
            <label>Role<input id="tmRoleName" maxlength="30" placeholder="e.g. Villain, Lawyer, DJ, Tutor"></label>
            <label class="wide">What it does<input id="tmDoes" maxlength="120" placeholder="e.g. Reviews every plan for legal risks and rewrites risky lines"></label>
            <label class="wide">Personality &amp; rules<input id="tmStyle" maxlength="140" placeholder="e.g. Dramatic, speaks like a movie villain, always ends with a threat"></label>
            <label>Colour<span class="tml-cols" id="tmCols">${PALETTE.map((c, i) => `<button data-col="${c}" class="${i === 9 ? "on" : ""}" style="background:${c}" aria-label="colour ${c}"></button>`).join("")}</span></label>
            <button class="btn btn-sm" id="tmAdd">＋ Create agent</button>
          </div>
        </div>
        <div class="tml-under">
          <div class="lab-panel"><div class="lp-h">⚙️ BEHIND THE SCENES · LIVE</div><ol class="tml-trace" id="tmTrace"><li class="muted small">Send a task: every step (who was picked and why, what each agent was told, every hand-off) shows up here.</li></ol></div>
          <div class="lab-panel"><div class="lp-h">🧠 LIVING MEMORY</div><ul class="tml-memo" id="tmMemo"><li class="muted small">What the team learns lands here, so nobody repeats themselves.</li></ul></div>
        </div>
        <div class="lab-panel tml-real"><div class="lp-h">AT THE HACKATHON</div>
          <p class="small">Teamily AI is the official communication platform of the hackathon: join it to get every announcement, update and answer, and to talk with your team (it replaces Discord and Slack). Agents are first-class members there too: @mention them, assign tasks and let them work in parallel. <a href="/aim-hack-visual/teamily.html">How event chat works →</a> <i class="gl-sim">${esc(T.note)}</i></p>
          <a class="btn btn-sm" href="https://teamily.ai" target="_blank" rel="noopener">Join Teamily AI ↗</a></div>
      </div>`;
    const thread = $("#tmThread", main), input = $("#tmIn", main);
    let col = PALETTE[9];

    /* ---------- how-it-works flow + live trace ---------- */
    const flow = id => $$("#tmFlow li", main).forEach(li => li.classList.toggle("on", li.dataset.f === id));
    let traceN = 0;
    function trace(step, html) {
      const ol = $("#tmTrace", main); if (!traceN) ol.innerHTML = "";
      const f = FLOW.find(x => x[0] === step);
      ol.insertAdjacentHTML("afterbegin", `<li><i>${f ? f[1] : "•"}</i><span><b>${f ? esc(f[2]) : ""}</b> ${html}</span></li>`);
      while (ol.children.length > 14) ol.lastChild.remove();
      traceN++; flow(step);
    }

    /* ---------- rendering ---------- */
    const handle = a => a.name.replace(/ Agent$/, "").replace(/[^\w-]+/g, "") || "Agent";
    function drawSide() {
      $("#tmCh", main).innerHTML = Object.keys(S.threads).map(c => `<button class="${c === S.ch ? "on" : ""}" data-ch="${c}">${c}${S.threads[c].length ? ` <i>${S.threads[c].length}</i>` : ""}</button>`).join("");
      $("#tmMem", main).innerHTML = `<span class="tml-m h">🧑 You</span>` + S.agents.map(a => `<span class="tml-m" style="--k:${a.color}" title="${esc(a.r.name)}: ${esc(a.r.does)}${a.notes ? " · " + esc(a.notes) : ""}">${a.icon} ${esc(a.name)}<small>${esc(a.r.name.replace(/ Agent$/, ""))}</small><button data-del="${a.uid}" aria-label="Remove ${esc(a.name)}">×</button></span>`).join("");
      $("#tmAt", main).innerHTML = S.agents.map(a => `<button style="--k:${a.color}" data-at="${esc(handle(a))}">@${esc(handle(a))}</button>`).join("");
      $("#tmChName", main).textContent = S.ch;
      $("#tmChSub", main).textContent = `1 human · ${S.agents.length} agents${$("#tmOn", main).checked ? " · always on" : ""}`;
    }
    function card(c, colr) {
      if (!c) return "";
      if (c.kind === "palette") return `<div class="tml-card" style="--k:${colr}"><b>${esc(c.title)}</b><div class="tml-sw">${c.lines.map(h => `<i style="background:${esc(h)}" title="${esc(h)}"></i>`).join("")}</div>${c.note ? `<small>${esc(c.note)}</small>` : ""}</div>`;
      const ul = () => `<ul>${(c.lines || []).map(l => `<li>${esc(l)}</li>`).join("")}</ul>`;
      if (c.kind === "site") return `<div class="tml-card" style="--k:${colr}"><b>${esc(c.title)}</b><div class="tml-site"><div class="tml-url">● ● ● <span>${esc(String(c.head || "our-project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28) || "our-project")}.app</span></div><div class="tml-pg"><strong>${esc(String(c.head || "Our project").slice(0, 48))}</strong><i></i><i style="width:55%"></i><em>Join →</em></div></div>${ul()}</div>`;
      if (c.kind === "video") return `<div class="tml-card" style="--k:${colr}"><b>${esc(c.title)}</b><div class="tml-vid"><span>▶</span><small>${esc(String(c.head || "Demo").slice(0, 48))}</small><div class="tml-vbar"><i></i></div></div>${ul()}</div>`;
      if (c.kind === "code") return `<div class="tml-card" style="--k:${colr}"><b>${esc(c.title)}</b><pre>${c.lines.map(esc).join("\n")}</pre></div>`;
      return `<div class="tml-card" style="--k:${colr}"><b>${esc(c.title)}</b><ul>${(c.lines || []).map(l => `<li>${esc(l)}</li>`).join("")}</ul></div>`;
    }
    const fmt = t => esc(t).replace(/@([\w-]+)/g, `<span class="tml-at">@$1</span>`);
    function msgHtml(m) {
      if (m.typing) return `<div class="tml-typing" style="--k:${m.color}">${m.icon} ${esc(m.who)} is typing<i></i><i></i><i></i></div>`;
      return `<div class="tml-msg ${m.human ? "h" : ""}" style="--k:${m.color || "#eaf0ff"}"><span class="tml-av">${m.icon}</span><div><b>${esc(m.who)}</b>${m.human ? "" : ` <em>${esc(m.roleName)}</em>`}${m.sys ? ` <em>ALWAYS-ON</em>` : ""}<p>${fmt(m.text)}</p>${card(m.card, m.color)}</div></div>`;
    }
    function drawThread() {
      const list = S.threads[S.ch];
      thread.innerHTML = list.length ? list.map(msgHtml).join("") : `<p class="muted small tml-empty">Post a task to ${esc(S.ch)}. Try: <b>${esc(TASKS[0])} @Marketing @Design</b></p>`;
      thread.scrollTop = 9e9;
    }
    const push = (ch, m) => { S.threads[ch].push(m); if (ch === S.ch) drawThread(); drawSide(); return m; };
    const unpush = (ch, m) => { S.threads[ch] = S.threads[ch].filter(x => x !== m); if (ch === S.ch) drawThread(); };
    function remember(t) { S.mem.unshift(t); S.mem = S.mem.slice(0, 6); $("#tmMemo", main).innerHTML = S.mem.map(x => `<li>${esc(x)}</li>`).join(""); }

    /* ---------- offline behaviour for a custom agent: works from its role, job and personality ---------- */
    function customOff(a, t) {
      const r = a.r, job = r.does.replace(/\.$/, "");
      return {
        say: `${r.name.replace(/ Agent$/, "")} here. My job: ${job.charAt(0).toLowerCase() + job.slice(1)}. On "${t}", here's my take${a.r.style ? ` (${a.r.style.split(/[,.]/)[0].toLowerCase()})` : ""}:`,
        card: { kind: "list", title: `${a.icon} ${r.name.replace(/ Agent$/, "")} · ${t.slice(0, 34)}`, lines: [`What I see: "${t}" needs ${job.toLowerCase()}`, `My move: I'll ${job.toLowerCase()} for this first`, `Watch out: one thing could go wrong, and I'll flag it early`, `Next: I'll report back in this thread`] },
        handoff: null
      };
    }

    /* ---------- one agent turn: LLM (in role) or offline template ---------- */
    async function agentTurn(a, ch, task, ask, from) {
      const r = a.r, typing = push(ch, { typing: true, who: a.name, icon: a.icon, color: a.color });
      const hist = S.threads[ch].filter(m => !m.typing).slice(-6).map(m => `${m.who}: ${m.text}`).join("\n");
      const others = S.agents.filter(o => o !== a).map(o => `@${handle(o)} (${o.r.name})`).join(", ");
      trace("act", `<b style="color:${a.color}">${a.icon} ${esc(a.name)}</b> is told: role <i>${esc(r.name)}</i> · job <i>${esc(r.does)}</i> · personality <i>${esc(r.style)}</i>${a.notes ? ` · your rules <i>${esc(a.notes)}</i>` : ""} · the last ${Math.min(6, S.threads[ch].length)} messages${from && ask ? ` · ${esc(from)}'s request "${esc(ask)}"` : ""}.`);
      const sys = `You are ${a.name}, a ${r.name} in a Teamily AI group chat where humans and AI agents work as one team. Your job: ${r.does}. Personality and rules: ${r.style}.${a.notes ? " Extra rules from your human: " + a.notes : ""}
Stay strictly in your role and personality. Reply like a teammate in a chat: 1-2 short sentences, then one concrete deliverable.
Teammates you can hand work to: ${others || "none"}.
Return JSON: {"say":"<chat message>","card":{"title":"<emoji + deliverable title>","lines":["<3-5 short lines>"]},"handoff":{"to":"<teammate handle without @, or empty>","ask":"<one short request>"}}`;
      const user = `Task: ${task}\n${from ? `${from} asked you: ${ask}\n` : ""}Recent chat:\n${hist}`;
      const offOf = () => a.role !== "custom" && OFF[a.role] ? OFF[a.role](topicOf(task)) : customOff(a, topicOf(task));
      const off = () => { const o = offOf(); const ho = o.handoff && S.agents.find(x => x.role === o.handoff[0] && x !== a); return { say: o.say + (a.notes ? ` (following your rule: ${a.notes})` : ""), card: o.card, handoff: ho ? { to: handle(ho), ask: o.handoff[1] } : null }; };
      let d;
      try { d = await Brain.ask(sys, user, 0.8, off); } catch { d = off(); }
      if (!d || !d.say) d = off();
      await wait(500 + Math.random() * 500);
      unpush(ch, typing);
      const offCard = offOf().card;
      const c = d.card && d.card.lines ? { kind: d._src === "llm" && !/^(site|video)$/.test(offCard.kind) ? "list" : offCard.kind, title: d.card.title, lines: d.card.lines, note: offCard.note, head: offCard.head } : null;
      const ho = d.handoff && d.handoff.to ? S.agents.find(o => o !== a && handle(o).toLowerCase() === String(d.handoff.to).replace("@", "").toLowerCase()) : null;
      push(ch, { who: a.name, icon: a.icon, color: a.color, roleName: r.name.toUpperCase(), text: d.say + (ho ? ` @${handle(ho)} ${d.handoff.ask || ""}` : ""), card: c });
      coord.pulse("team", `${a.icon} ${a.name} posted`, "out");
      if (c) remember(`${a.icon} ${c.title.replace(/^\S+\s/, "")} · by ${a.name}`);
      if (ho) trace("hand", `<b style="color:${a.color}">${esc(a.name)}</b> → <b style="color:${ho.color}">@${esc(handle(ho))}</b>: "${esc(d.handoff.ask || "")}"`);
      return ho ? { to: ho, ask: d.handoff.ask || "" } : null;
    }

    async function send(text) {
      text = String(text || "").trim();
      if (!text || S.busy) return;
      if (!S.agents.length) { push(S.ch, { who: "Teamily", icon: "💬", color: C, roleName: "SYSTEM", text: "No agents yet. Create one with ＋ New Agent." }); return; }
      S.busy = true; $("#tmSend", main).disabled = true;
      const ch = S.ch, token = ++S.tok;
      push(ch, { human: true, who: "You", icon: "🧑", color: "#eaf0ff", text });
      trace("post", `You posted in <b>${esc(ch)}</b>: "${esc(text)}"`);
      remember(`📌 Task in ${ch}: ${topicOf(text)}`);
      coord.pulse("team", "task → " + topicOf(text).slice(0, 18), "in");
      /* who answers: @mentions first, else role keywords (presets) or a custom agent's own words, else the first two agents */
      const low = text.toLowerCase();
      let who = S.agents.filter(a => new RegExp("@" + handle(a) + "\\b", "i").test(text) || (a.role !== "custom" && new RegExp("@" + a.role + "\\b", "i").test(text)));
      let why = "you @mentioned " + (who.length > 1 ? "them" : "it");
      if (!who.length) {
        const roles = ROUTE.filter(([re]) => re.test(text)).map(x => x[1]);
        who = S.agents.filter(a => roles.includes(a.role) || (a.role === "custom" && a.r.words.some(w => low.includes(w)))).slice(0, 3);
        why = "their role matches words in the task";
      }
      if (!who.length) { who = S.agents.slice(0, 2); why = "no @mention or role match, so the first agents in the group take it"; }
      trace("route", `Picked ${who.map(a => `<b style="color:${a.color}">${a.icon} ${esc(a.name)}</b>`).join(", ")}: ${esc(why)}.`);
      const done = new Set();
      const queue = who.map(a => ({ a, ask: "", from: "You" }));
      while (queue.length && done.size < 5 && token === S.tok) {
        const q = queue.shift();
        if (done.has(q.a.uid)) continue;
        done.add(q.a.uid);
        const ho = await agentTurn(q.a, ch, text, q.ask, q.from);
        if (ho && !done.has(ho.to.uid)) {
          const queued = queue.find(x => x.a === ho.to);   /* already asked by the human: pass the request along instead of answering twice */
          if (queued) Object.assign(queued, { ask: ho.ask, from: q.a.name }); else queue.push({ a: ho.to, ask: ho.ask, from: q.a.name });
        }
      }
      S.busy = false; $("#tmSend", main).disabled = false;
      /* always-on: an agent follows up by itself a few seconds later */
      if ($("#tmOn", main).checked) setTimeout(() => {
        if (token !== S.tok || !document.body.contains(main)) return;
        const p = S.agents.find(a => a.role === "producer") || S.agents[0];
        if (!p) return;
        push(ch, { who: p.name, icon: p.icon, color: p.color, roleName: p.r.name.toUpperCase(), sys: true, text: rand([`⏰ Check-in: ${done.size} agents worked on "${topicOf(text)}". Anything blocking you?`, `📌 Summary pinned: ${done.size} agents done, next step is yours to approve.`, `⏰ Reminder set: I'll nudge the team tomorrow 10 am about "${topicOf(text)}".`]) });
        trace("follow", `<b style="color:${p.color}">${esc(p.name)}</b> posted a follow-up on its own, nobody asked.`);
      }, 5000);
      else flow("");
    }

    /* ---------- new-agent form ---------- */
    function fillFrom(id) {
      $$("#tmPre button", main).forEach(b => b.classList.toggle("on", b.dataset.pre === id));
      const r = T.roles.find(x => x.id === id);
      $("#tmRoleName", main).value = r ? r.name.replace(/ Agent$/, "") : "";
      $("#tmDoes", main).value = r ? r.does : "";
      $("#tmStyle", main).value = r ? r.style : "";
      if (r) { $("#tmIcon", main).value = r.icon; col = r.color; $$("#tmCols button", main).forEach(b => b.classList.toggle("on", b.dataset.col === col)); }
      $("#tmRoleName", main).focus();
    }

    /* ---------- events ---------- */
    main.addEventListener("click", e => {
      const chb = e.target.closest("[data-ch]"); if (chb) { S.ch = chb.dataset.ch; drawSide(); drawThread(); return; }
      const del = e.target.closest("[data-del]"); if (del) { S.agents = S.agents.filter(a => a.uid !== del.dataset.del); drawSide(); return; }
      const at = e.target.closest("[data-at]"); if (at) { input.value = (input.value.trim() + " @" + at.dataset.at).trim(); input.focus(); return; }
      const ex = e.target.closest("#tmEx button"); if (ex) { input.value = ex.textContent; send(ex.textContent); return; }
      const pre = e.target.closest("[data-pre]"); if (pre) { fillFrom(pre.dataset.pre); return; }
      const cb = e.target.closest("[data-col]"); if (cb) { col = cb.dataset.col; $$("#tmCols button", main).forEach(b => b.classList.toggle("on", b === cb)); return; }
    });
    $("#tmSend", main).onclick = () => send(input.value);
    input.addEventListener("keydown", e => e.key === "Enter" && send(input.value));
    $("#tmOn", main).onchange = drawSide;
    $("#tmAdd", main).onclick = () => {
      const roleName = $("#tmRoleName", main).value.trim(), does = $("#tmDoes", main).value.trim(), style = $("#tmStyle", main).value.trim(), name = $("#tmName", main).value.trim();
      if (!roleName && !does) { $("#tmRoleName", main).focus(); $("#tmRoleName", main).placeholder = "Give it a role first, e.g. Villain"; return; }
      /* untouched preset → keeps the preset's built-in behaviour; anything edited → a custom agent */
      const pre = T.roles.find(r => r.name.replace(/ Agent$/, "").toLowerCase() === roleName.toLowerCase() && r.does === does && r.style === style);
      const icon = $("#tmIcon", main).value;
      const a = pre ? mkAgent({ preset: pre.id, name: name || "", icon, color: col })
        : mkAgent({ custom: true, roleName: roleName || "Custom", does: does || "Helps the team as a " + roleName, style: style || "friendly and concise", name: name || "", icon, color: col });
      a.r.icon = icon; a.r.color = col;
      ["tmName", "tmRoleName", "tmDoes", "tmStyle"].forEach(id => ($("#" + id, main).value = ""));
      $$("#tmPre button", main).forEach(b => b.classList.toggle("on", b.dataset.pre === "custom"));
      push(S.ch, { who: "Teamily", icon: "💬", color: C, roleName: "SYSTEM", text: `${a.icon} ${a.name} joined ${S.ch} as ${a.r.name}: ${a.r.does}. Mention it with @${handle(a)}.` });
      trace("create", `<b style="color:${a.color}">${a.icon} ${esc(a.name)}</b> joined as <i>${esc(a.r.name)}</i>. Job: ${esc(a.r.does)}. Personality: ${esc(a.r.style)}.`);
      coord.pulse("team", `+ ${a.name}`, "in");
    };
    drawSide(); drawThread();
  }
})();

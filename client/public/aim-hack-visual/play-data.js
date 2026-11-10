/* =========================================================
   Playground shared content: preset characters, preset scenes,
   and which sponsor tools show up in which track.
   Module content (story presets, games, interview scenarios)
   lives at the top of each module file.
   Users add their own characters/scenes in the Studio (#studio);
   those are stored in the browser and appear everywhere.
   ========================================================= */
window.PLAY = {
  colors: ["#ff4fa3", "#3ee6ff", "#b6ff5c", "#ffc857", "#c48bff", "#ff9f43", "#5c8dff", "#4fd1c5", "#ff6b6b", "#f2f2f2"],

  /* Every character works in every track: personality + secret drive films,
     goal drives games, role/expertise drives the Track 3 panel. */
  characters: [
    { id: "vega", name: "Captain Vega", role: "Starship captain", personality: "Duty-bound, calm under pressure, hates losing anyone under her command.", secret: "The disaster was her fault, and she will do anything to keep that hidden.", goal: "Keep everyone alive, no matter what.",
      look: { species: "human", skin: "#d29a6c", hair: "bun", hairColor: "#1d1410", eyes: "normal", facial: "none", outfit: "uniform", outfitColor: "#5c8dff", acc: "headset", build: "regular" } },
    { id: "rook", name: "Rook", role: "Smuggler", personality: "Charming, selfish, always has an exit plan.", secret: "A buyer is waiting for the valuable cargo. Rook intends to escape with it.", goal: "Get rich and get out first.",
      look: { species: "human", skin: "#f6c9a4", hair: "side", hairColor: "#3d2618", eyes: "sleepy", facial: "stubble", outfit: "jacket", outfitColor: "#8b5e3c", acc: "none", build: "regular" } },
    { id: "imani", name: "Dr. Imani", role: "Doctor", personality: "Compassionate, logical, the steady voice in a crisis.", secret: "Carries an experimental cure worth millions and can't let it be lost.", goal: "Heal the team and keep the group together.",
      look: { species: "human", skin: "#6b4229", hair: "curly", hairColor: "#1d1410", eyes: "normal", facial: "none", outfit: "labcoat", outfitColor: "#4fd1c5", acc: "glasses", build: "slim" } },
    { id: "bolt", name: "BOLT-9", role: "Android", personality: "Literal, polite, curious about human emotions.", secret: "Has hidden orders to protect the cargo above every human life.", goal: "Complete the mission with zero risk.",
      look: { species: "robot", skin: "#c9d3e0", hair: "none", eyes: "big", outfit: "armor", outfitColor: "#3ee6ff", acc: "none", build: "broad" } },
    { id: "kit", name: "Kit", role: "Stowaway kid", personality: "Brave, sneaky, cracks jokes when scared.", secret: "Overheard everyone's secrets and is deciding whom to trust.", goal: "Prove they belong on the team.",
      look: { species: "human", skin: "#ffe0c7", hair: "spiky", hairColor: "#d9a441", eyes: "big", facial: "none", outfit: "hoodie", outfitColor: "#ff9f43", acc: "cap", build: "slim" } },
    { id: "marlowe", name: "Marlowe", role: "Detective", personality: "Sharp, cynical, notices everything.", secret: "Was paid to frame someone in this room.", goal: "Find out who is lying.",
      look: { species: "human", skin: "#e8b08a", hair: "short", hairColor: "#6b3e22", eyes: "sleepy", facial: "mustache", outfit: "suit", outfitColor: "#2d3142", acc: "tophat", build: "regular" } },
    { id: "ashford", name: "Lady Ashford", role: "Heiress", personality: "Proud, elegant, quietly manipulative.", secret: "Is completely broke and desperate for money.", goal: "Win by making others do the work.",
      look: { species: "human", skin: "#ffe0c7", hair: "long", hairColor: "#f1d27a", eyes: "normal", facial: "none", outfit: "dress", outfitColor: "#c48bff", acc: "crown", build: "slim" } },
    { id: "jax", name: "Jax", role: "Engineer", personality: "Grumpy genius, blunt, secretly soft-hearted.", secret: "Can fix everything but needs someone to stay behind and help.", goal: "Build the best defences and protect friends.",
      look: { species: "human", skin: "#b97a56", hair: "buzz", hairColor: "#1d1410", eyes: "normal", facial: "beard", outfit: "overalls", outfitColor: "#ffc857", acc: "none", build: "broad" } },
    { id: "okafor", name: "Prof. Okafor", role: "Professor", personality: "Brilliant, demanding, talks too much but is always fair.", secret: "Their experiment caused all of this.", goal: "Test everyone and reward real understanding.",
      look: { species: "human", skin: "#4a2c1d", hair: "short", hairColor: "#7a7a7a", eyes: "normal", facial: "beard", outfit: "sweater", outfitColor: "#8b5e3c", acc: "glasses", build: "regular" } },
    { id: "nyx", name: "Nyx", role: "Thief", personality: "Playful, quick, impossible to read.", secret: "Is an undercover police informant.", goal: "Grab the treasure and betray at the perfect moment.",
      look: { species: "cat", skin: "#3b3b3b", hair: "none", eyes: "big", outfit: "hoodie", outfitColor: "#2d3142", acc: "eyepatch", build: "slim" } },
    { id: "hale", name: "General Hale", role: "Soldier", personality: "Aggressive, protective, gives orders to everyone.", secret: "Deserted his last post and fears being found out.", goal: "Be the most feared player.",
      look: { species: "human", skin: "#f6c9a4", hair: "buzz", hairColor: "#7a7a7a", eyes: "normal", facial: "mustache", outfit: "uniform", outfitColor: "#3d8a4f", acc: "none", build: "broad" } },
    { id: "luna", name: "Luna Star", role: "Pop star", personality: "Dramatic, attention-seeking, surprisingly brave.", secret: "Wants to vanish and start a new life under a new name.", goal: "Be the crowd favourite.",
      look: { species: "human", skin: "#d29a6c", hair: "ponytail", hairColor: "#ff5fa2", eyes: "big", facial: "none", outfit: "jacket", outfitColor: "#ff4fa3", acc: "sunglasses", build: "slim" } },
    { id: "priya", name: "Priya Shah", role: "Hiring manager", personality: "Warm but precise; asks follow-up questions until she gets a concrete example.", secret: "Already has a favourite candidate and needs a reason to change her mind.", goal: "Hire someone who can actually do the job.",
      look: { species: "human", skin: "#b97a56", hair: "bob", hairColor: "#1d1410", eyes: "normal", facial: "none", outfit: "suit", outfitColor: "#5c8dff", acc: "earrings", build: "slim" } },
    { id: "zorp", name: "Zorp", role: "Alien envoy", personality: "Curious, very polite, takes every idiom literally.", secret: "Is here to decide whether Earth is worth a second visit.", goal: "Learn the rules, then bend them.",
      look: { species: "alien", skin: "#8fe3a1", hair: "none", eyes: "big", outfit: "robe", outfitColor: "#c48bff", acc: "none", build: "slim" } },
    { id: "bruno", name: "Bruno", role: "Head chef", personality: "Loud, passionate, hugs as hard as he yells.", secret: "Lost his sense of taste last week and is faking it.", goal: "Feed everyone and win the crowd.",
      look: { species: "bear", skin: "#8a5a3b", hair: "none", eyes: "normal", outfit: "labcoat", outfitColor: "#f2f2f2", acc: "none", build: "broad" } },
    { id: "merlin", name: "Old Wren", role: "Wizard", personality: "Ancient, mischievous, speaks in riddles.", secret: "Has forgotten most of their spells.", goal: "Teach a lesson nobody asked for.",
      look: { species: "human", skin: "#ffe0c7", hair: "long", hairColor: "#e8e8e8", eyes: "sleepy", facial: "beard", outfit: "robe", outfitColor: "#5c8dff", acc: "wizardhat", build: "regular" } }
  ],

  /* Named scenes built from Scenes.BASES. */
  scenes: [
    { id: "s-office", name: "Startup office", base: "office", time: "day", weather: "clear", desc: "An open-plan startup office the morning of a big launch." },
    { id: "s-forest", name: "Misty forest", base: "forest", time: "sunset", weather: "fireflies", desc: "A deep pine forest at dusk, fireflies over the path." },
    { id: "s-ship", name: "Starship bridge", base: "space", time: "night", weather: "clear", desc: "The bridge of a research starship in deep space." },
    { id: "s-city", name: "Neon street", base: "city", time: "night", weather: "rain", desc: "A rainy downtown street under neon signs." },
    { id: "s-castle", name: "Throne hall", base: "castle", time: "night", weather: "embers", desc: "A torch-lit throne hall in an old castle." },
    { id: "s-beach", name: "Island beach", base: "beach", time: "day", weather: "clear", desc: "A sunny island beach with palm trees." },
    { id: "s-class", name: "Classroom", base: "classroom", time: "day", weather: "clear", desc: "A classroom with a chalkboard and rows of desks." },
    { id: "s-court", name: "Courtroom", base: "courtroom", time: "day", weather: "clear", desc: "A packed courtroom on the final day of a trial." },
    { id: "s-kitchen", name: "Restaurant kitchen", base: "kitchen", time: "night", weather: "clear", desc: "A steel kitchen in the middle of dinner service." },
    { id: "s-desert", name: "Desert road", base: "desert", time: "sunset", weather: "clear", desc: "Endless dunes and a blazing sunset." },
    { id: "s-snow", name: "Mountain pass", base: "snow", time: "day", weather: "snow", desc: "A snowy mountain pass 300 m below the summit." },
    { id: "s-stage", name: "Concert stage", base: "stage", time: "night", weather: "clear", desc: "A concert stage minutes before the final show." },
    { id: "s-manor", name: "Manor dining room", base: "manor", time: "night", weather: "rain", desc: "A candle-lit dining hall during a thunderstorm." },
    { id: "s-lab", name: "Science lab", base: "lab", time: "night", weather: "clear", desc: "A high-tech lab full of glowing tubes." },
    { id: "s-board", name: "Boardroom", base: "boardroom", time: "day", weather: "clear", desc: "A glass-walled boardroom high above the city." },
    { id: "s-park", name: "City park", base: "park", time: "day", weather: "clear", desc: "A sunny park with a pond and a bench." }
  ],

  /* Sponsor tools inside each track: what switching each one ON does there.
     ids match HACK.sponsors in data.js. */
  tools: {
    film: [
      { id: "band", label: "Agent channel", does: "Agents send each other private messages; glowing lines show who is talking to whom." },
      { id: "adal", label: "Poster & frames", does: "Generates a movie poster and key frames for your film." },
      { id: "finch", label: "Skills", does: "Each agent gets a skill (Persuade, Deceive, Investigate…) and uses it on screen." },
      { id: "bruin", label: "Insights", does: "A live dashboard of who spoke, who acted, and how endings compare across runs." },
      { id: "glasser", label: "Real-world facts", does: "Characters pull one real-world fact or statistic into a scene through Glasser; every lookup shows its provider and price (simulated)." }
    ],
    game: [
      { id: "band", label: "Team radio", does: "Agent teammates coordinate in a shared channel; lines show callouts between them." },
      { id: "finch", label: "Skills", does: "Agents get a special skill (Medic, Sharpshooter, Lucky…) that changes how they play." },
      { id: "bruin", label: "Analytics", does: "Analytics panel: live metrics, a data pipeline, quality checks and data governance for the run." },
      { id: "adal", label: "Custom art", does: "Generates cover art for the game you create." },
      { id: "glasser", label: "Real data", does: "Agents look up real-world data (prices, trends, places) mid-game and cite it in their plans; each call shows its cost (simulated)." }
    ],
    grow: [
      { id: "casuro", label: "Voice interview", does: "Answer out loud with your microphone and hear the panel speak. Fair, evidence-based scoring." },
      { id: "band", label: "Panel back-channel", does: "See the panel's private messages to each other while you answer." },
      { id: "finch", label: "Examiner skills", does: "Each panelist uses a scoring skill (STAR method, clarity, confidence…)." },
      { id: "bruin", label: "Score analytics", does: "Charts of your scores per question and per skill." },
      { id: "glasser", label: "Company research", does: "Before you start, the panel researches the company and role through Glasser and grounds its questions in what it found (simulated)." }
    ]
  },

  /* Glasser: real-world data APIs for agents (glasser.ai). The playground SIMULATES calls:
     nothing is sent to Glasser, prices are examples, data rows are generated samples. */
  glasser: {
    note: "Simulated sample data. Connect Glasser for real data.",
    skill: "set up https://glasser.ai/SKILL.md",
    catalog: [
      { id: "apollo-company", provider: "Apollo", icon: "🏢", kind: "company", endpoint: "Company search", price: 0.01975, unit: "call", sub: "$65/seat/mo", re: /compan|startup|firm|employer|hiring|business|org/i },
      { id: "pdl-person", provider: "People Data Labs", icon: "🧑‍💼", kind: "people", endpoint: "Person search", price: 0.28, unit: "profile", sub: "from $98/mo", re: /people|person|profile|candidate|founder|engineer|talent|recruit/i },
      { id: "pdl-company", provider: "People Data Labs", icon: "📇", kind: "company", endpoint: "Company enrichment", price: 0.1, unit: "record", sub: "from $98/mo", re: /enrich|firmograph|headcount|raise|funding/i },
      { id: "hunter-email", provider: "Hunter", icon: "✉️", kind: "people", endpoint: "Find work email", price: 0.012, unit: "call", sub: "$49/mo", re: /email|contact|reach out/i },
      { id: "builtwith", provider: "BuiltWith", icon: "🧱", kind: "company", endpoint: "Tech stack lookup", price: 0.03, unit: "call", sub: "$295/mo", re: /tech stack|built with|technolog|framework|uses react|stack/i },
      { id: "crustdata", provider: "Crustdata", icon: "📈", kind: "company", endpoint: "Headcount growth", price: 0.05, unit: "call", sub: "custom plan", re: /growth|headcount trend|jobs? (?:open|posting)/i },
      { id: "ahrefs-kw", provider: "Ahrefs", icon: "🔗", kind: "seo", endpoint: "Organic keywords", price: 0.01548, unit: "result", sub: "$129/mo", re: /backlink|ranking|organic/i },
      { id: "semrush-kw", provider: "Semrush", icon: "📊", kind: "seo", endpoint: "Keyword metrics", price: 0.0011, unit: "call", sub: "$139/mo", re: /keyword|search volume|seo/i },
      { id: "dataforseo", provider: "DataForSEO", icon: "🔎", kind: "seo", endpoint: "SERP results", price: 0.00024, unit: "keyword", sub: "pay-as-you-go", re: /serp|google results|rank/i },
      { id: "serper", provider: "Serper", icon: "🛒", kind: "web", endpoint: "Google shopping search", price: 0.002, unit: "call", sub: "credits", re: /price|shopping|product|buy|cost|deal/i },
      { id: "exa", provider: "Exa", icon: "🌐", kind: "web", endpoint: "Neural web search", price: 0.005, unit: "call", sub: "credits", re: /news|fact|research|article|web|latest|statistic/i },
      { id: "keepa", provider: "Keepa", icon: "📉", kind: "ecommerce", endpoint: "Amazon price history", price: 0.0038, unit: "product", sub: "€19/mo", re: /price history|amazon|keepa/i },
      { id: "amazon", provider: "Amazon", icon: "📦", kind: "ecommerce", endpoint: "Product search", price: 0.004, unit: "call", sub: "n/a", re: /listing|amazon product|best seller/i },
      { id: "gmaps", provider: "Google Maps", icon: "📍", kind: "places", endpoint: "Places search", price: 0.017, unit: "call", sub: "n/a", re: /place|restaurant|map|near|venue|location|city/i },
      { id: "reddit", provider: "Reddit", icon: "👽", kind: "social", endpoint: "Posts search", price: 0.002, unit: "call", sub: "n/a", re: /reddit|opinion|community|forum/i },
      { id: "youtube", provider: "YouTube", icon: "▶️", kind: "social", endpoint: "Video stats", price: 0.003, unit: "call", sub: "n/a", re: /video|youtube|views/i },
      { id: "linkedin", provider: "LinkedIn", icon: "💼", kind: "people", endpoint: "Profile lookup", price: 0.03, unit: "call", sub: "n/a", re: /linkedin|career|role|job title/i },
      { id: "fin", provider: "Financial Datasets", icon: "💹", kind: "finance", endpoint: "Stock prices", price: 0.01, unit: "call", sub: "n/a", re: /stock|market|revenue|earnings|financ/i }
    ],
    /* pick the endpoint that best matches a text (provider name, topic or question) */
    pick(text) {
      const t = String(text || "");
      const C = this.catalog;
      return C.find(c => t.toLowerCase().includes(c.provider.toLowerCase())) || C.find(c => c.re.test(t)) || C.find(c => c.id === "exa");
    },
    price(p) { return p >= 0.1 ? "$" + p.toFixed(2) : p >= 0.01 ? "$" + p.toFixed(3) : "$" + p.toFixed(4); },
    /* offline sample facts per track (generic and labelled as simulated) */
    facts: {
      film: ["A 2-hour power cut leaves most city buildings on backup lighting.", "Escape pods on research ships are rated for 72 hours of air.", "Storms at sea cut radio range by roughly half.", "The average bank vault door weighs over 20 tonnes.", "Most house fires start in the kitchen, at night.", "Mountain rescue teams answer most calls after dark."],
      game: ["Searches for 'zombie survival kit' spike every October.", "Medkit prices on Amazon jumped 18% this week.", "Board-game sales peak in December.", "Rock is the most common first throw in rock-paper-scissors.", "Most players lose their first ladder race to a late snake.", "Teams that share callouts survive 30% longer in co-op games."],
      grow: ["The company grew headcount by about a third in the last year.", "It runs on a React + Python stack on AWS.", "It opened 14 engineering roles this quarter.", "Its last funding round was a Series B.", "Customers mention 'fast onboarding' most in reviews.", "The team is hybrid, with offices in two cities."]
    }
  },

  /* Finch skill library: reusable abilities you can equip on any agent.
     Users can create more in Sponsor Labs → Finch (stored in localStorage "aimp_skills").
     Use PLAY.allSkills() to get presets + custom ones. */
  skills: [
    { id: "negotiate", name: "Negotiate", icon: "🤝", color: "#ff9f43", desc: "Finds a deal both sides can accept.", instructions: "Before answering, state what each side wants, then propose a concrete trade-off with numbers.", good: "markets, heists, sales pitches" },
    { id: "persuade", name: "Persuade", icon: "🗣️", color: "#ff4fa3", desc: "Changes minds with one strong argument.", instructions: "Lead with the listener's interest, give one vivid reason, end with a clear ask.", good: "films, debates, pitches" },
    { id: "investigate", name: "Investigate", icon: "🔎", color: "#3ee6ff", desc: "Spots the lie and follows the clue.", instructions: "List what is known, what does not add up, and the single question that would expose the truth.", good: "mysteries, interviews" },
    { id: "plan", name: "Plan", icon: "🗺️", color: "#5c8dff", desc: "Breaks a goal into 3 clear steps with owners.", instructions: "Answer as a numbered 3-step plan; each step has an owner and a deadline.", good: "team games, heists, projects" },
    { id: "summarize", name: "Summarize", icon: "🧾", color: "#b6ff5c", desc: "Turns a long mess into three crisp bullets.", instructions: "Answer in at most 3 bullets of max 12 words each.", good: "reports, meetings" },
    { id: "examine", name: "Examine", icon: "📋", color: "#c48bff", desc: "Scores an answer against a rubric with evidence.", instructions: "Score 1-5 on clarity, evidence and impact; quote the exact words that justify each score.", good: "interviews, exams" },
    { id: "coach", name: "Coach", icon: "🧑‍🏫", color: "#4fd1c5", desc: "Gives one kind, specific tip to improve.", instructions: "Name one thing that worked, one thing to change, and a sentence to practise.", good: "Track 3 sessions" },
    { id: "translate", name: "Translate", icon: "🌐", color: "#ffc857", desc: "Says it in another language, simply.", instructions: "Answer in the target language first, then a plain English gloss in brackets.", good: "language café" },
    { id: "deceive", name: "Deceive", icon: "🎭", color: "#ff6b6b", desc: "Hides the truth behind a believable story.", instructions: "Give a plausible cover story with one true detail so it sounds real.", good: "films, social deduction" },
    { id: "inspire", name: "Inspire", icon: "✨", color: "#f2f2f2", desc: "Rallies the team when hope is low.", instructions: "Name the shared goal, one past win, and a bold next move.", good: "films, co-op games" },
    { id: "heal", name: "Medic", icon: "🩹", color: "#b6ff5c", desc: "Prioritises keeping teammates alive.", instructions: "Always check who is weakest first and act to protect them.", good: "zombie survival" },
    { id: "predict", name: "Predict", icon: "🔮", color: "#c48bff", desc: "Reads patterns to guess the next move.", instructions: "Look at the last moves, name the pattern, and bet on what comes next.", good: "rock-paper-scissors, strategy" }
  ],
  allSkills() {
    let mine = [];
    try { mine = JSON.parse(localStorage.getItem("aimp_skills") || "[]"); } catch {}
    return mine.map(s => ({ ...s, custom: true })).concat(this.skills);
  },
  saveSkill(sk) {
    let mine = [];
    try { mine = JSON.parse(localStorage.getItem("aimp_skills") || "[]"); } catch {}
    sk = { ...sk, id: sk.id || "sk-" + Math.random().toString(36).slice(2, 8) };
    mine = [sk, ...mine.filter(x => x.id !== sk.id)].slice(0, 40);
    try { localStorage.setItem("aimp_skills", JSON.stringify(mine)); } catch {}
    return sk;
  },
  removeSkill(id) {
    try { localStorage.setItem("aimp_skills", JSON.stringify(JSON.parse(localStorage.getItem("aimp_skills") || "[]").filter(x => x.id !== id))); } catch {}
  },

  emotions: ["happy", "angry", "scared", "sad", "sly", "shocked", "calm", "determined", "thinking", "neutral"],
  inspiration: ["trust", "greed", "sacrifice", "a lie", "an old debt", "a misunderstanding", "redemption", "jealousy", "a hidden weapon", "an unexpected kindness", "panic", "a confession"]
};

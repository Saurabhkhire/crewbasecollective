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
      { id: "bruin", label: "Insights", does: "A live dashboard of who spoke, who acted, and how endings compare across runs." }
    ],
    game: [
      { id: "band", label: "Team radio", does: "Agent teammates coordinate in a shared channel; lines show callouts between them." },
      { id: "finch", label: "Skills", does: "Agents get a special skill (Medic, Sharpshooter, Lucky…) that changes how they play." },
      { id: "bruin", label: "Analytics", does: "Analytics panel: live metrics, a data pipeline, quality checks and data governance for the run." },
      { id: "adal", label: "Custom art", does: "Generates cover art for the game you create." }
    ],
    grow: [
      { id: "casuro", label: "Voice interview", does: "Answer out loud with your microphone and hear the panel speak. Fair, evidence-based scoring." },
      { id: "band", label: "Panel back-channel", does: "See the panel's private messages to each other while you answer." },
      { id: "finch", label: "Examiner skills", does: "Each panelist uses a scoring skill (STAR method, clarity, confidence…)." },
      { id: "bruin", label: "Score analytics", does: "Charts of your scores per question and per skill." }
    ]
  },

  emotions: ["happy", "angry", "scared", "sad", "sly", "shocked", "calm", "determined", "thinking", "neutral"],
  inspiration: ["trust", "greed", "sacrifice", "a lie", "an old debt", "a misunderstanding", "redemption", "jealousy", "a hidden weapon", "an unexpected kindness", "panic", "a confession"]
};

/* =========================================================
   Multiplayer AI — site content
   Edit this file to change tracks, ideas, sponsors, dates.
   Sponsors are fully data-driven: add/remove entries and
   the map, grid and home strip all update.
   ========================================================= */
window.HACK = {
  name: "Multiplayer AI",
  /* event details: shown on the home page, tracks page and submission section */
  event: {
    date: "Monday, November 23, 2026",
    dateShort: "Nov 23, 2026",
    time: "9:30 AM – 8:30 PM",
    venue: "AWS Loft",
    format: "Solo or teams of up to 4"
  },
  dates: "Nov 23, 2026 · 9:30 AM – 8:30 PM · AWS Loft",
  submitUrl: "https://hackathons.crewbasecollective.com",

  tracks: [
    {
      id: "film", num: "01", icon: "🎬", hex: "#ff4fa3",
      name: "Agent Animated Film", short: "Film", island: "Studio Island",
      tagline: "You write the opening. The agents write the ending.",
      pitch: "Create a 1–3 minute animated short where the plot is decided by agents, not by you. You set up the world, the characters and the opening event. From there the agents interact, make choices and decide how the story ends.",
      forYou: "Storytellers, animators, 3D artists, writers, filmmakers",
      flow: [
        ["Set the stage", "Design the world, the cast and each character's goals and secrets."],
        ["Light the fuse", "Trigger one opening event: a body, a storm, a countdown."],
        ["Agents improvise", "Each agent decides what to do next. Every choice is logged."],
        ["Roll credits", "Render the short. Run it again and get a different ending."]
      ],
      musts: [
        "You set the world, characters and opening event, and nothing more",
        "Agents decide every plot beat, including the ending",
        "Characters are animated, moving and reacting on screen",
        "The same setup produces different endings across runs",
        "Final output: a 1–3 minute animated short"
      ],
      keyLabel: "Agents decide",
      map: { x: 230, y: 175, rx: 180, ry: 92 },
      agentReasons: [
        "wants to direct a heist where the traitor picks the ending",
        "thinks the escape-pod story needs one more survivor",
        "is auditioning for the jury in the courtroom drama",
        "heard the band might break up on stage tonight",
        "wants to find out who poisoned the host this run"
      ],
      ideas: [
        { t: "The Last Escape Pod", log: "A sinking spaceship, five survivors, one seat.", cast: ["Captain", "Engineer", "Stowaway", "Ship AI", "Medic"], key: "Who boards the pod: by vote, sacrifice, deception or mutiny.", up: "Voice: panicked radio chatter. 3D: a zero-g cabin.", tags: ["3D", "Voice"] },
        { t: "The Inside Man", log: "A four-person heist crew. One of them is secretly working for the police, and even you don't know who.", cast: ["Mastermind", "Hacker", "Driver", "Safecracker"], key: "Whether the vault opens, the traitor is caught, or everyone walks away empty-handed.", up: "ML: the traitor learns from earlier runs which lies get caught.", tags: ["ML", "3D"] },
        { t: "The Verdict", log: "A courtroom where nobody, not even the author, knows the verdict.", cast: ["Prosecutor", "Defender", "Witness", "Judge", "3 Jurors"], key: "Guilty or not guilty, and which testimony changed the jury's mind.", up: "Voice: a distinct voice for every juror.", tags: ["Voice", "Starter"] },
        { t: "Dinner at the Manor", log: "The host collapses at dessert. Every guest has a motive and a secret.", cast: ["Detective", "Butler", "Heiress", "Doctor", "Old Friend"], key: "Who gets accused, who confesses, and whether the detective is right.", tags: ["Starter", "Voice"] },
        { t: "Encore", log: "A touring band on the night of their final show. Tensions are high and the setlist isn't decided.", cast: ["Singer", "Guitarist", "Drummer", "Manager"], key: "Whether the band plays, breaks up on stage, or writes a new song live.", up: "Audio: agents choose the setlist, and the music changes mood with their decisions.", tags: ["Voice"] },
        { t: "First Contact", log: "An alien envoy lands in a city square and asks for exactly one thing.", cast: ["General", "Scientist", "Mayor", "Envoy", "Reporter"], key: "War, treaty, or a catastrophic misunderstanding.", tags: ["3D"] },
        { t: "Opening Night", log: "A new restaurant, one famous critic, and a kitchen on the edge.", cast: ["Head Chef", "Sous Chef", "Waiter", "Critic"], key: "The review the critic writes at the end.", tags: ["Starter"] },
        { t: "Whiteout", log: "A climbing team caught in a storm 300 m below the summit.", cast: ["Lead Guide", "Rookie", "Photographer", "Veteran Climber"], key: "Push for the summit or turn back, and who gets left behind.", tags: ["3D"] },
        { t: "The Empty Crown", log: "The king dies without naming an heir.", cast: ["3 Heirs", "Royal Advisor", "Spymaster"], key: "Who takes the throne, through alliance or betrayal.", up: "ML: heirs remember grudges across runs and play differently.", tags: ["ML"] },
        { t: "Demo Day", log: "Three founders, ten minutes before their pitch, and the demo just broke.", cast: ["CEO", "CTO", "Designer", "Investor"], key: "Pivot, bluff, or confess on stage.", tags: ["Starter", "Voice"] },
        { t: "The Lighthouse", log: "A storm, a ship in distress, and two keepers who disagree on what to do.", cast: ["Keeper", "Apprentice", "Ship Captain (radio)", "Coast Guard"], key: "Whether the ship is saved, and at what cost.", tags: ["Voice"] },
        { t: "Mall After Dark", log: "Survivors barricaded in a shopping mall with three days of supplies and five mouths to feed.", cast: ["Ex-Soldier", "Teenager", "Store Manager", "Nurse", "Stranger"], key: "Who leads, who leaves, and who opens the door.", tags: ["3D", "ML"] }
      ]
    },
    {
      id: "game", num: "02", icon: "🎮", hex: "#3ee6ff",
      name: "Co-op Multiplayer Game", short: "Game", island: "Arena Island",
      tagline: "Humans and AI as equal players in one world.",
      pitch: "Build a multiplayer game where humans and AI agents share the same world as equal players. Agents aren't NPCs waiting for instructions. They have their own goals, memories and plans, and they act whether or not a human is involved.",
      forYou: "Game devs, systems designers, multiplayer and simulation nerds",
      flow: [
        ["Build the world", "A map, resources and rules that humans and agents both play by."],
        ["Give agents lives", "Goals, memories and plans. They act even when no human is watching."],
        ["Let humans in", "2+ humans join as equal players, not as the main character."],
        ["Watch it emerge", "Alliances, betrayals, and at least one world event the agents caused."]
      ],
      musts: [
        "At least 2 human players + 3 agent players in one visual game world",
        "Agents act independently with their own goals and memory",
        "Agents can ally with, trade with, compete with or betray players",
        "At least one major world event is caused by agents alone"
      ],
      keyLabel: "Agent-caused event",
      map: { x: 970, y: 175, rx: 180, ry: 92 },
      agentReasons: [
        "is forming an alliance against the human players",
        "remembers a bad trade and wants revenge",
        "suspects the impostor is a human this round",
        "is planning to corner the spice market",
        "wants to recruit a human into its tribe"
      ],
      ideas: [
        { t: "Betrayal Island", log: "Shipwrecked humans share an island with two agent tribes that remember everything you do.", cast: ["Tribe Chief", "Shaman", "Scout", "Trader", "+2 humans"], key: "A tribe war, or a raid on the human camp decided in council.", up: "ML: tribes update their trust in each player after every interaction.", tags: ["3D", "ML"] },
        { t: "Grudge Market", log: "A trading town where agent merchants set prices, strike deals and never forget a bad trade.", cast: ["Spice Merchant", "Banker", "Smuggler", "Guard Captain"], key: "A market crash, a monopoly, or a boycott of a cheating player.", tags: ["ML", "Starter"] },
        { t: "Who's the Bot?", log: "A social deduction game where the impostor could be a human or an agent.", cast: ["3+ agent crewmates", "2+ humans"], key: "An agent-led accusation that ejects a human, rightly or not.", up: "Voice: agents argue out loud in the meeting phase.", tags: ["Voice", "Starter"] },
        { t: "The Siege", log: "Humans and agent knights defend a castle. The agent general may negotiate a surrender behind your back.", cast: ["General", "Quartermaster", "Spy", "Archer Captain"], key: "A surrender, a secret deal with the enemy, or a surprise counter-attack.", tags: ["3D"] },
        { t: "Station Zero", log: "Keep a failing space station alive. Agent crew ration oxygen, repair systems, and might mutiny.", cast: ["Commander", "Engineer", "Botanist", "Security"], key: "A mutiny, a sealed-off section, or power diverted away from the humans.", tags: ["3D", "Voice"] },
        { t: "Valley Harvest", log: "A farming valley where agent farmers plant, trade and compete for water.", cast: ["Rich Farmer", "Miller", "Water Keeper", "Newcomer"], key: "A drought from over-farming, or a cooperative that shuts players out.", tags: ["ML", "Starter"] },
        { t: "Pirate Fleet", log: "Every ship has an agent captain with their own code. Humans join as first mates.", cast: ["3 Captains", "Quartermaster", "Navigator"], key: "A mutiny, a fleet split, or a treasure double-cross.", tags: ["3D"] },
        { t: "Kingdom Council", log: "Humans and agents sit as lords on a council that votes on taxes, wars and laws.", cast: ["Duke", "Bishop", "Merchant Lord", "General"], key: "A declared war, or a law passed against the humans' votes.", tags: ["Voice"] },
        { t: "Kitchen Chaos", log: "A frantic restaurant shift. Agent cooks have their own priorities and opinions about your cooking.", cast: ["Grill Cook", "Pastry Chef", "Dishwasher", "Manager"], key: "A kitchen strike, or a menu change in the middle of service.", tags: ["Starter"] },
        { t: "Monster Guild", log: "Agent hunters bid on contracts, form parties and decide who gets the loot.", cast: ["Veteran Hunter", "Healer", "Rogue", "Guild Master"], key: "A guild split, or a hunter going rogue with the loot.", tags: ["ML", "3D"] },
        { t: "Election Night", log: "A city sim where agent candidates campaign for human and agent votes alike.", cast: ["Candidate A", "Candidate B", "Journalist", "Campaign Manager"], key: "A leaked scandal or a surprise coalition.", tags: ["Voice"] },
        { t: "The Night Zoo", log: "Agent animals plan a great escape while human players are the night keepers.", cast: ["Clever Monkey", "Old Elephant", "Parrot Lookout", "Penguin Crew"], key: "A breakout organised entirely by the animals.", tags: ["3D", "Starter"] }
      ]
    },
    {
      id: "grow", num: "03", icon: "🎓", hex: "#b6ff5c",
      name: "Grow with Agents", short: "Grow", island: "Academy Island",
      tagline: "For once, the agents train the humans.",
      pitch: "The roles are reversed. Usually humans train AI. Here, agents step into expert roles such as interviewer, examiner, professor, coach, boss or client, and the human learns, practises, gets tested and improves through a visual, interactive simulation.",
      forYou: "Edtech builders, product people, coaches, and anyone who has sat through a tough interview",
      flow: [
        ["Pick a skill", "Interviewing, selling, driving, a language: something people want to get better at."],
        ["Cast the experts", "2–3 agents with different roles and opinions about the human."],
        ["Adapt live", "Agents confer and change difficulty, tone or questions based on performance."],
        ["Deliver the verdict", "A clear result plus feedback backed by evidence from the session."]
      ],
      musts: [
        "Agents play expert roles (interviewer, examiner, coach, boss…) as visible characters",
        "At least 2–3 agents coordinate about the human",
        "Agents adapt to how the human is performing",
        "The session ends with a clear result and evidence-based feedback"
      ],
      keyLabel: "Session ends with",
      map: { x: 600, y: 622, rx: 190, ry: 80 },
      agentReasons: [
        "volunteered to sit on tonight's interview panel",
        "is coaching a human through a sales pitch",
        "wants to examine a nervous driver",
        "is preparing tough questions for a thesis defense",
        "is rehearsing as a difficult client"
      ],
      ideas: [
        { t: "The Panel", log: "A 3D interview panel questions you, compares notes behind closed doors, then gives a verdict.", cast: ["Hiring Manager", "Tech Lead", "HR Partner"], key: "Hire or no-hire, with quotes from your answers as evidence.", up: "Show the panel's private deliberation as a replay after the verdict.", tags: ["3D", "Voice"] },
        { t: "Monday at the Office", log: "Your boss, two teammates and a difficult client all need something by 5pm.", cast: ["Boss", "Teammate", "Teammate", "Client"], key: "A performance review scoring prioritisation, communication and tact.", tags: ["Starter"] },
        { t: "Driving Examiner", log: "A simulated city drive with an agent examiner plus unpredictable agent drivers and pedestrians.", cast: ["Examiner", "Reckless Driver", "Pedestrian", "Cyclist"], key: "Pass or fail, with a replay of every mistake.", tags: ["3D", "ML"] },
        { t: "The Buying Committee", log: "Pitch to a CFO, a CTO and an end user who push back on every claim.", cast: ["CFO", "CTO", "End User"], key: "A deal decision listing each objection you handled, or didn't.", tags: ["Voice"] },
        { t: "Thesis Defense", log: "Three professors with different specialities grill you on your project.", cast: ["Supervisor", "Skeptic", "External Examiner"], key: "Pass, revise or fail, with each professor's written comments.", tags: ["Voice"] },
        { t: "Café Abroad", log: "Practise a language by ordering food, chatting with locals and asking for directions. Agents slow down or switch vocabulary to match you.", cast: ["Waiter", "Shopkeeper", "Local Friend"], key: "A fluency score and the exact phrases you should practise.", tags: ["Voice", "Starter"] },
        { t: "Salary Negotiation Dojo", log: "A recruiter and a hiring manager message each other privately about how far they can go.", cast: ["Recruiter", "Hiring Manager", "Coach"], key: "Your final offer vs. what was possible, and the moment you left money on the table.", tags: ["ML"] },
        { t: "Stage Fright", log: "Give a talk to an agent audience that reacts in real time while a coach watches from the wings.", cast: ["Coach", "Heckler", "Fan", "Bored Executive"], key: "A delivery score with timestamps of where you lost the room.", tags: ["Voice", "3D"] },
        { t: "Press Conference", log: "You're the spokesperson after a crisis. The journalists coordinate their follow-up questions.", cast: ["Tabloid Reporter", "Business Journalist", "Press Secretary"], key: "The headline the journalists would write about you.", tags: ["Voice"] },
        { t: "ER Triage Trainer", log: "A busy emergency room. A senior nurse and a doctor coach you as patients arrive.", cast: ["Senior Nurse", "Attending Doctor", "Patients"], key: "Triage accuracy and decision speed compared with protocol.", tags: ["3D"] },
        { t: "Debate Arena", log: "An opponent agent and a panel of judges who confer between rounds.", cast: ["Opponent", "Judge", "Judge", "Moderator"], key: "Round-by-round scores, with the argument that won or lost each round.", tags: ["Starter", "Voice"] },
        { t: "Hard Conversations", log: "Practise giving difficult feedback to an agent employee while an HR observer takes notes.", cast: ["Employee", "HR Observer", "Coach"], key: "Feedback on clarity and empathy, quoting what you actually said.", up: "ML: the employee's reactions depend on how it has been treated before.", tags: ["ML"] }
      ]
    }
  ],

  /* Idea generator slots per track */
  generator: {
    film: [
      ["World", ["a sinking spaceship", "a snowed-in mountain lodge", "a floating sky city", "an underwater research lab", "a medieval tavern", "a reality-TV villa", "the last subway train of the night", "a desert gas station"]],
      ["Cast", ["a heist crew of four", "rival chefs", "a royal family", "stranded astronauts", "a jury of strangers", "a touring band", "three estranged siblings", "a detective and five suspects"]],
      ["Opening event", ["the power goes out", "a body is found", "a stranger arrives with a map", "the money disappears", "a 10-minute countdown starts", "someone reads a secret letter aloud", "the only bridge collapses"]],
      ["Secret twist", ["one of them is lying about who they are", "two of them are secretly working together", "only one can leave", "someone already made a deal with the enemy", "one character isn't human", "the narrator is one of the agents"]]
    ],
    game: [
      ["World", ["a volcanic island", "a floating market", "a frozen research base", "a haunted castle", "a neon cyber-city", "a pirate archipelago", "a farming valley", "a crumbling space station"]],
      ["Agent players", ["three rival merchant guilds", "a tribe that remembers every insult", "a council of scheming lords", "robot crewmates with secret orders", "monster hunters for hire", "spirits who trade favours"]],
      ["Human goal", ["escape before the volcano erupts", "become the richest trader", "find the impostor", "defend the gate for 10 nights", "win the election", "build the first bridge to the mainland"]],
      ["Agent-caused event", ["a market crash", "a sudden alliance against the humans", "a mutiny", "a famine", "a declaration of war", "a secret treaty"]]
    ],
    grow: [
      ["Skill", ["job interviews", "public speaking", "sales pitching", "negotiating salary", "giving hard feedback", "a new language", "calming an angry customer", "leading a team meeting"]],
      ["Expert agents", ["a three-person hiring panel", "a skeptical buying committee", "a board of directors", "a coach and two sparring partners", "a professor and a teaching assistant", "a boss and a difficult client"]],
      ["Setting", ["a glass-walled boardroom", "a live TV studio", "a busy café", "a startup office", "a conference stage", "a courtroom"]],
      ["How agents adapt", ["questions get harder when you do well", "agents interrupt more when you ramble", "the client calms down when you show empathy", "the panel matches its language to your level", "one agent plays devil's advocate when you sound too sure"]]
    ]
  },

  checklist: {
    must: [
      ["Characters", "Each agent has a visual identity: avatar, sprite, or 2D/3D model"],
      ["Visual output", "An animated video, a running simulation or a playable game"],
      ["Movement & action", "Characters move, react and act on screen, not just output text"],
      ["3+ agents", "At least three agents with their own goals, roles or personalities"],
      ["Decision log", "A visible log or ledger of what the agents decided and why"]
    ],
    bonus: [
      ["3D", "2D is welcome, but 3D is encouraged and scores higher"],
      ["ML & trained agents", "RL, fine-tuning, learned behaviour or memory that changes decisions"],
      ["Voice", "Agents speak with their own voices"]
    ]
  },

  sponsors: [
    {
      id: "bruin", name: "Bruin", tier: "main", url: "https://getbruin.com",
      landmark: "Bruin HQ · Data Plaza", icon: "🏛️", color: "#ffc857",
      blurb: "Bruin is an all-in-one data and AI platform that eliminates fragmented data tools by bringing everything into one unified workspace. It transforms raw data into actionable AI-powered insights in seconds, directly within Slack, Microsoft Teams and your browser.",
      buildIdea: "Pipe every agent decision into one place and ask questions about your runs, like which ending happened most, right from Slack.",
      map: { x: 600, y: 352, w: 46, h: 72 }
    },
    {
      id: "adal", name: "AdaL", tier: "sponsor", url: "https://adalagent.ai",
      landmark: "AdaL's Workshop", icon: "🤖", color: "#c48bff",
      blurb: "AdaL is an automation-first agent harness designed to get more done with less of your time. She combines personality, skills and memory to become a personalized agent that can work alongside you.",
      buildIdea: "Give characters a persistent personality, skills and memory so they feel like the same person across sessions.",
      map: { x: 470, y: 335, w: 26, h: 34 }
    },
    {
      id: "band", name: "BAND", tier: "sponsor", url: "https://www.band.ai",
      landmark: "BAND Tower", icon: "📡", color: "#5c8dff", tower: true,
      blurb: "BAND helps AI agents and people work together in a shared environment. Its platform lets agents built with different tools communicate, delegate tasks and keep context in sync, while giving teams visibility and control over how that work gets done.",
      buildIdea: "Let agents built with different tools talk, delegate and stay in sync inside one shared world.",
      map: { x: 728, y: 330, w: 15, h: 82 }
    },
    {
      id: "finch", name: "Finch", tier: "sponsor", url: "https://www.finchtech.ai",
      landmark: "Finch Skill Shop", icon: "🪶", color: "#ff9f43",
      blurb: "Finch provides agent skills that give AI agents reusable capabilities for performing specific tasks. Skills can help make agents more useful, structured and consistent.",
      buildIdea: "Give agents reusable skills like negotiate, examine and trade instead of hand-coding every behaviour.",
      map: { x: 752, y: 418, w: 25, h: 30 }
    },
    {
      id: "casuro", name: "Casuro", tier: "sponsor", url: "https://casuro.ai",
      landmark: "Casuro Interview House", icon: "🎙️", color: "#ff6b6b",
      blurb: "Casuro.ai is an AI-powered recruitment platform that helps companies streamline hiring through intelligent assessments, voice AI interviews and real-world case study challenges, evaluating candidates on their skills, problem-solving and how well they work with AI.",
      buildIdea: "Inspiration for Track 3: voice interviews, case challenges and fair, evidence-based evaluation.",
      map: { x: 600, y: 455, w: 26, h: 28 }
    }
  ],

  agents: [
    { name: "Mira", color: "#ff4fa3", trait: "dramatic" },
    { name: "Kofi", color: "#3ee6ff", trait: "competitive" },
    { name: "Juno", color: "#b6ff5c", trait: "mentor" },
    { name: "Rex", color: "#ffc857", trait: "schemer" },
    { name: "Ada", color: "#c48bff", trait: "curious" },
    { name: "Pip", color: "#ff9f43", trait: "chaotic" },
    { name: "Sol", color: "#5c8dff", trait: "diplomat" },
    { name: "Nova", color: "#4fd1c5", trait: "analyst" }
  ]
};

/* ---------- sponsor tool visibility (per visitor) ----------
   HACK.allSponsors = every sponsor; HACK.sponsors = only the ones this visitor shows.
   Everything (maps, labs, track toolbars) reads HACK.sponsors, so hiding a tool
   removes it everywhere. Changed from the "⚙️ Tools" panel in the nav (site.js). */
(function (H) {
  H.allSponsors = H.sponsors.slice();
  let hidden = [];
  try { hidden = JSON.parse(localStorage.getItem("aimp_sponsors_hidden") || "[]"); } catch {}
  H.hiddenSponsors = Array.isArray(hidden) ? hidden.filter(id => H.allSponsors.some(s => s.id === id)) : [];
  H.sponsors = H.allSponsors.filter(s => !H.hiddenSponsors.includes(s.id));
  H.sponsorVisible = id => !H.hiddenSponsors.includes(id);
  H.setHiddenSponsors = ids => { try { localStorage.setItem("aimp_sponsors_hidden", JSON.stringify(ids || [])); } catch {} };
})(window.HACK);

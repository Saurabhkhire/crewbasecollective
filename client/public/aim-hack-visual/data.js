/* =========================================================
   Multiplayer AI — site content
   Edit this file to change tracks, ideas, sponsors, dates.
   ADD / REMOVE A SPONSOR OR PARTNER = edit ONE entry below.
   - Sponsor (a tool in the tracks): copy an entry in `sponsors`. Fields: id, name, tier, url, icon, color,
     landmark, blurb, buildIdea, role + tag (tool-coordination node), tracks { film|game|grow: { label, does } }
     (= its toggle in each track), mascot { name, look, action, home: center|film|game|grow }.
     Optional `comms` {...}: marks the sponsor as the event's official communication platform (mandatory for
     event chat and updates). It gets the "Teamily AI" tab (teamily.html), the home band and badges. Today: Teamily AI.
   - Partner (not a tool): copy an entry in `partners`. Fields: id, name, url, icon, color, scene, blurb, brings, mascot.
   - Host (the organiser, Crewbase Collective): the single `host` entry. Same fields as a partner.
   - Remove: delete the entry (or add its id to HIDDEN_SPONSORS / HIDDEN_PARTNERS at the bottom).
   Everything else follows automatically: world map + island views, home, sponsors/partners pages,
   track toolbars, tool coordination, labs list. Optional extras: custom art in mascots.js (ART[id], else a
   generic robot), a Sponsor Lab (labs*.js), a custom tool view (coord.js), on-stage effects (film/game/grow.js).
   ========================================================= */
window.HACK = {
  name: "Multiplayer AI",
  /* event details: shown on the home page, tracks page and submission section */
  event: {
    date: "Monday, November 23, 2026",
    dateShort: "Nov 23, 2026",
    time: "9:30 AM – 8:30 PM",
    venue: "AWS Loft",
    format: "Solo or teams of up to 4",
    comms: "Teamily AI"   /* official event chat (mandatory); details in the Teamily AI sponsor entry → comms */
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
      /* live cast on the tracks page: who is on stage and what they say. actor ids = PLAY.characters */
      cast: {
        scene: { base: "manor", time: "night", weather: "rain" },
        actors: [{ id: "kit", tag: "You · director" }, { id: "marlowe", tag: "Agent · detective" }, { id: "ashford", tag: "Agent · heiress" }, { id: "rook", tag: "Agent · smuggler" }],
        script: [
          [0, "Opening event: the lights go out at the Ashford dinner. That's all I write. Action!", "happy", "point"],
          [1, "Nobody leaves. Someone in this room knows where the necklace went.", "determined", "point"],
          [2, "How dare you. I was standing at the window the whole time.", "angry", "cross"],
          [3, "(privately, over a BAND channel) Back my story, Ashford, and we split it.", "sly", "shrug"],
          [1, "Investigate skill: your story changed twice, my lady.", "thinking", "raise"],
          [2, "…Fine. Rook took it. I'm done covering for him.", "sad", "slump"],
          [3, "Then I'm out the back door. Plan B.", "scared", "jump"],
          [0, "I didn't write that ending! Run it again and the agents might choose differently.", "shocked", "out"],
          [1, "Every choice is in the decision log. AdaL is cutting the trailer now.", "calm", "nod"]
        ]
      },
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
      name: "Create Co-op Games with Agents", short: "Game", island: "Arena Island",
      tagline: "Create the game. AI agents play it with you, as teammates and rivals.",
      pitch: "Create a co-op multiplayer game where humans and AI agents share one world as equal players. You design the world, the rules and the win condition. The agents aren't NPCs waiting for instructions: they have their own goals, memories and plans, they team up with you, compete with you, and keep playing whether or not a human is watching.",
      forYou: "Game devs, systems designers, multiplayer and simulation nerds",
      flow: [
        ["Create the game", "A map, resources, rules and a win condition that humans and agents both play by."],
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
      cast: {
        scene: { base: "city", time: "night", weather: "rain" },
        actors: [{ id: "kit", tag: "You · game creator" }, { id: "bolt", tag: "Agent · teammate" }, { id: "hale", tag: "Agent · teammate" }, { id: "nyx", tag: "Agent · rival" }],
        script: [
          [0, "I made this map ten minutes ago: a neon city, one supply drop, zombies at midnight.", "happy", "out"],
          [1, "Teammate online. I already have a plan for the north gate.", "calm", "nod"],
          [2, "Team radio: I hold the gate, BOLT covers the roof. Nobody goes solo.", "determined", "point"],
          [3, "Nobody? I'm taking the supply drop for my own team.", "sly", "shrug"],
          [1, "Medic skill equipped. Kit, you're at 30% health. Healing you first.", "calm", "raise"],
          [0, "Wait, the agents changed the plan without me?", "shocked", "out"],
          [2, "You weren't watching. The world doesn't pause.", "angry", "cross"],
          [3, "Truce for one wave? Then I betray you. Probably.", "sly", "wave"],
          [0, "Okay, coding agents, add level 2. They're too good at level 1.", "happy", "jump"]
        ]
      },
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
      tagline: "Agents that teach, coach, test and challenge you. For once, they train the human.",
      pitch: "The roles are reversed. Usually humans train AI. Here, a team of agents steps into expert roles (tutor, coach, examiner, interviewer, sparring partner, boss, client or language buddy) and the human learns, practises and improves through a visual, interactive simulation: a language café, a sales call, a pitch to investors, an exam, a negotiation, a hard conversation, a talk on stage, or a job interview.",
      forYou: "Edtech builders, product people, coaches, and anyone who has sat through a tough interview",
      flow: [
        ["Pick a skill", "Interviewing, selling, driving, a language: something people want to get better at."],
        ["Cast the experts", "2–3 agents with different roles and opinions about the human."],
        ["Adapt live", "Agents confer and change difficulty, tone or questions based on performance."],
        ["Deliver the verdict", "A clear result plus feedback backed by evidence from the session."]
      ],
      musts: [
        "Agents play expert roles (tutor, coach, examiner, interviewer, client…) as visible characters",
        "At least 2–3 agents coordinate about the human",
        "Agents adapt to how the human is performing",
        "The session ends with a clear result and evidence-based feedback"
      ],
      keyLabel: "Session ends with",
      cast: {
        scene: { base: "classroom", time: "day", weather: "clear" },
        actors: [{ id: "jax", tag: "You · learner" }, { id: "okafor", tag: "Agent · tutor" }, { id: "priya", tag: "Agent · coach" }, { id: "zorp", tag: "Agent · language buddy" }],
        script: [
          [1, "Today you choose: Spanish at the café, a sales pitch, or your thesis defense.", "happy", "out"],
          [0, "Can I do all three? I have a pitch on Friday and a trip next month.", "thinking", "shrug"],
          [3, "¡Hola! One coffee, please, in Spanish. I will take every idiom literally.", "happy", "wave"],
          [0, "Un café, por favor… y un croissant?", "calm", "nod"],
          [3, "Bien! Slowing down for you. Now ask me for directions.", "happy", "nod"],
          [2, "Pitch time. You have 60 seconds. I'm a skeptical buyer.", "determined", "cross"],
          [0, "We cut onboarding from two weeks to two days for 40 teams.", "determined", "point"],
          [2, "That's a number I can use. Your opening was vague, though.", "calm", "raise"],
          [1, "Our verdict: language B1, pitch 4/5. Here are the exact quotes behind each score.", "calm", "nod"]
        ]
      },
      map: { x: 600, y: 634, rx: 190, ry: 78 },
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

  /* Sponsors = tools you can use in the tracks and the Sponsor Labs.
     mascot: the character that walks around the world map (art in mascots.js, keyed by id).
       home = the island it hangs around most (center = AWS Loft town hall, or a track id).
     image (optional): a picture of the mascot shown in the sponsor card. */
  sponsors: [
    {
      id: "bruin", name: "Bruin", tier: "main", url: "https://getbruin.com",
      landmark: "Bruin HQ · Data Plaza", icon: "🏛️", color: "#ffc857",
      blurb: "Bruin is an all-in-one data and AI platform that eliminates fragmented data tools by bringing everything into one unified workspace. It transforms raw data into actionable AI-powered insights in seconds, directly within Slack, Microsoft Teams and your browser.",
      buildIdea: "Pipe every agent decision into one place and ask questions about your runs, like which ending happened most, right from Slack.",
      role: "Data & insights", tag: "DATA",
      tracks: {
        film: { label: "Insights", does: "A live dashboard of who spoke, who acted, and how endings compare across runs." },
        game: { label: "Analytics", does: "Analytics panel: live metrics, a data pipeline, quality checks and data governance for the run." },
        grow: { label: "Score analytics", does: "Charts of your scores per question and per skill." }
      },
      mascot: { name: "Bru the Data Bear", look: "A bear in a gold hoodie holding a live dashboard", action: "Pulls every agent's data into one place, models it and answers questions in Slack: an all-in-one agentic data platform.", home: "center" }
    },
    {
      id: "adal", name: "AdaL", tier: "sponsor", url: "https://adalagent.ai",
      landmark: "AdaL's Workshop", icon: "🤖", color: "#c48bff",
      image: "/aim-hack-visual/img/adal-mascot.png",
      blurb: "AdaL is an automation-first agent harness designed to get more done with less of your time. She combines personality, skills and memory to become a personalized agent that can work alongside you.",
      buildIdea: "Give characters a persistent personality, skills and memory so they feel like the same person across sessions.",
      role: "Images & video", tag: "MEDIA",
      tracks: {
        film: { label: "Poster & frames", does: "Generates a movie poster and key frames for your film." },
        game: { label: "Custom art", does: "Generates cover art for the game you create." }
      },
      mascot: { name: "AdaL", look: "Black bob with pink highlights, a black dress with sheer pink sleeves", action: "Turns a line of text into frames and a video: clapperboard, film strip, render bar.", home: "film" }
    },
    {
      id: "band", name: "BAND", tier: "sponsor", url: "https://www.band.ai",
      landmark: "BAND Tower", icon: "📡", color: "#5c8dff",
      blurb: "BAND helps AI agents and people work together in a shared environment. Its platform lets agents built with different tools communicate, delegate tasks and keep context in sync, while giving teams visibility and control over how that work gets done.",
      buildIdea: "Let agents built with different tools talk, delegate and stay in sync inside one shared world.",
      role: "Channels", tag: "CHANNELS",
      tracks: {
        film: { label: "Agent channel", does: "Agents send each other private messages; glowing lines show who is talking to whom." },
        game: { label: "Team radio", does: "Agent teammates coordinate in a shared channel; lines show callouts between them." },
        grow: { label: "Panel back-channel", does: "See the panel's private messages to each other while you answer." }
      },
      mascot: { name: "Volt", look: "A blue-headed alien with two glowing antennae", action: "Shoots electricity to the agents and people around him: messages, hand-offs and shared context.", home: "film" }
    },
    {
      id: "finch", name: "Finch", tier: "sponsor", url: "https://www.finchtech.ai",
      landmark: "Finch Skill Shop", icon: "🪶", color: "#ff9f43",
      blurb: "Finch provides agent skills that give AI agents reusable capabilities for performing specific tasks. Skills can help make agents more useful, structured and consistent.",
      buildIdea: "Give agents reusable skills like negotiate, examine and trade instead of hand-coding every behaviour.",
      role: "Skills", tag: "SKILLS",
      tracks: {
        film: { label: "Skills", does: "Each agent gets a skill (Persuade, Deceive, Investigate…) and uses it on screen." },
        game: { label: "Skills", does: "Agents get a special skill (Medic, Sharpshooter, Lucky…) that changes how they play." },
        grow: { label: "Examiner skills", does: "Each panelist uses a scoring skill (STAR method, clarity, confidence…)." }
      },
      mascot: { name: "Pip the Finch", look: "A little orange finch with a skill card in its beak", action: "Flies over the islands, picks up a skill card and drops it on an agent.", home: "game" }
    },
    {
      id: "casuro", name: "Casuro", tier: "sponsor", url: "https://casuro.ai",
      landmark: "Casuro Interview House", icon: "🎙️", color: "#ff6b6b",
      blurb: "Casuro.ai is an AI-powered recruitment platform that helps companies streamline hiring through intelligent assessments, voice AI interviews and real-world case study challenges, evaluating candidates on their skills, problem-solving and how well they work with AI.",
      buildIdea: "Inspiration for Track 3: voice interviews, case challenges and fair, evidence-based evaluation.",
      role: "Voice & evaluation", tag: "VOICE · EVAL",
      tracks: {
        grow: { label: "Voice interview", does: "Answer out loud with your microphone and hear the panel speak. Fair, evidence-based scoring." }
      },
      mascot: { name: "Cass the Cassowary", look: "A cassowary interviewer with a microphone and a clipboard", action: "Runs a voice interview and scores each answer with evidence.", home: "grow" }
    },
    {
      id: "glasser", name: "Glasser", tier: "sponsor", url: "https://glasser.ai",
      landmark: "Glasser Data Exchange", icon: "🔭", color: "#7cc8ff",
      blurb: "Glasser gives AI agents real-world data through one API key: 2,000+ endpoints for people, companies, web search, SEO, social and e-commerce data. Agents see the price before each call and pay as they go, with no subscriptions. Connect it as a Skill, an MCP server or a CLI.",
      buildIdea: "Ground your agents in reality: let a character research a real company before an interview, price real products in a trading game, or look up real facts mid-story, and show the cost of every call in the decision log.",
      role: "Real-world data", tag: "REAL DATA",
      tracks: {
        film: { label: "Real-world facts", does: "Characters pull one real-world fact or statistic into a scene through Glasser; every lookup shows its provider and price (simulated)." },
        game: { label: "Real data", does: "Agents look up real-world data (prices, trends, places) mid-game and cite it in their plans; each call shows its cost (simulated)." },
        grow: { label: "Company research", does: "Before you start, the panel researches the company and role through Glasser and grounds its questions in what it found (simulated)." }
      },
      mascot: { name: "Gus the Lookout Monkey", look: "An orange monkey in black glasses with a telescope", action: "Spots the right data source, shows the price before the call, then brings back real rows.", home: "grow" }
    },
    {
      id: "telem", name: "Telem AI", tier: "sponsor", url: "https://telem.ai",
      landmark: "Telem Signal Tower", icon: "🛰️", color: "#e86bff",
      blurb: "Telem AI is web infrastructure designed to help AI agents access and understand live web data. It provides intelligent search, clean page fetching, automated monitoring for new information, and end-to-end tracing of agent activity, making AI workflows more reliable, efficient, and transparent.",
      buildIdea: "Let agents look things up on the live web mid-run: a detective searches real 1920s slang, a game agent pulls today's news into a plot twist, an interview panel reads the company's latest launch before asking. Show the trace of every search and fetch so judges can see where each fact came from.",
      role: "Live web search", tag: "WEB SEARCH",
      tracks: {
        film: { label: "Live research", does: "Characters search the live web for facts, slang or news and work them into the scene; every search and fetch is traced (simulated)." },
        game: { label: "Web search", does: "Agents search the web mid-game for strategies and real-world twists, and a monitor drops breaking news into the round (simulated)." },
        grow: { label: "Fresh research", does: "The panel searches and reads the company's latest pages before asking, and cites the source in its questions (simulated)." }
      },
      mascot: { name: "Scout the Signal Owl", look: "A violet owl with a radar dish on its head and a magnifying glass", action: "Routes every search to the best engine, fetches clean pages, keeps watch for new information and traces each step.", home: "film" }
    },
    {
      id: "runware", name: "Runware", tier: "sponsor", url: "https://runware.ai",
      landmark: "Runware Sonic Pod", icon: "⚡", color: "#2ee6a6",
      blurb: "Runware provides cost-efficient AI infrastructure with on-demand model APIs, serverless and dedicated compute for AI workloads. Powered by next-generation modular data centers, it helps developers and businesses run AI workloads at up to half the cost of traditional neocloud infrastructure.",
      buildIdea: "Run every model your project needs through one API: images, video, voice, 3D and text. Render a whole storyboard, voice every NPC or generate the interview panel's avatars without blowing your budget, and show the cost of each run next to the result.",
      role: "AI inference & compute", tag: "COMPUTE",
      tracks: {
        film: { label: "Fast renders", does: "Frames, voice lines and teaser clips render through one Runware API; the stage shows each job's time and cost (simulated)." },
        game: { label: "Low-cost inference", does: "Agent turns, NPC voices and art run as Runware jobs; a meter shows the cost per round next to a typical neocloud (simulated)." },
        grow: { label: "Voice & avatars", does: "The panel's questions, spoken voices and avatars run as Runware jobs that scale to zero between answers (simulated)." }
      },
      mascot: { name: "Modi the Pod Bot", look: "A mint robot built from stacked GPU modules, with a lightning antenna", action: "Catches jobs from every agent, runs them in its modular pod and sends back images, video, voice and text at about half the usual price.", home: "game" }
    },
    {
      id: "teamily", name: "Teamily AI", tier: "sponsor", url: "https://teamily.ai",
      landmark: "Teamily Commons", icon: "💬", color: "#8b7bff",
      blurb: "Teamily AI is a human+AI social platform and AI-native workspace: people and always-on AI agents collaborate in one unified messaging space. Agents are first-class members of your chats. You can @mention them, assign them tasks and let them run jobs in parallel, and you can create your own agents or whole agent teams in seconds with \"+ New Agent\". Everyone shares one connected context and a living memory, so no one has to repeat themselves.",
      buildIdea: "Run your whole team on Teamily: humans and your role agents (marketing, research, design, engineering, video, QA, coach…) in one group. Your agents don't just talk: @mention one and it builds the website, cuts the demo video, designs the poster or drafts the deck right in the thread. Let agents hand work to each other in the thread, and show the judges how your human+agent team worked together.",
      role: "Human + agent workspace", tag: "TEAM CHAT",
      /* official event communication: every hacker joins it to get updates and talk */
      comms: {
        headline: "All hackathon communication happens on Teamily AI.",
        replaces: "Discord and Slack",
        why: "Teamily AI is the official communication platform of the Multiplayer AI hackathon. It replaces Discord and Slack for this event: announcements, team chat, mentor help and questions all happen there. Join before you arrive.",
        mandatory: [
          "Join the Multiplayer AI hackathon on Teamily AI before the event starts",
          "Follow announcements there: schedule, room changes, deadlines and demo order",
          "Talk with your team in a Teamily AI group instead of Discord, Slack or WhatsApp",
          "Ask organizers, mentors and sponsor teams for help there"
        ],
        perks: [
          "Agents can be members of your team group: @mention them, assign tasks, let them work in parallel",
          "Agents build, not just chat: ask for a website, a demo video, a poster or a pitch deck and it lands in the thread",
          "Living memory: the chat remembers decisions, so nobody repeats themselves",
          "Web, desktop and mobile, so updates reach you anywhere in the Loft"
        ],
        /* "Your agents build things": shown on teamily.html. [icon, what, your message, agent icon, agent, agent reply, preview kind] */
        builds: [
          ["🌐", "A website", "@Engineer build a landing page for our project, with the demo and a join button", "💻", "Engineer Agent", "Page is live in preview: hero, demo video, sign-up. @QA can you check mobile?", "site"],
          ["🎬", "A demo video", "@Video make a 60-second demo video from our screen recordings", "🎬", "Video Agent", "Cut a 0:58 demo: hook, 3 features, the agents deciding live, the ending. Captions on.", "video"],
          ["🖼️", "A poster & visuals", "@Design poster and thumbnails for our film, night-neon", "🎨", "Design Agent", "Poster v2 + 4 thumbnails + palette posted. Pick one and I'll make the variants.", "poster"],
          ["📊", "A pitch deck", "@Producer turn this thread into our 5-slide judging deck", "📋", "Producer Agent", "Deck ready: problem, demo, how the agents work, tools used, what's next.", "deck"],
          ["🐞", "Fixes & tests", "@QA playtest the build and file what breaks", "🧪", "QA Agent", "5 runs done. 2 bugs found, @Engineer patched both, new build is up.", "tests"],
          ["📣", "Launch posts", "@Marketing write the launch posts for after the demo", "📣", "Marketing Agent", "3 posts drafted (X, LinkedIn, Teamily community), with the video attached.", "posts"]
        ],
        join: [
          ["Get the app", "Sign up at teamily.ai. It works on web, desktop and mobile."],
          ["Join the event", "Open the invite link the organizers share with registered hackers and at check-in."],
          ["Make your team group", "Create one group for your team and add your teammates."],
          ["Say hi", "Post an intro so mentors and other builders can find you."]
        ],
        spaces: [
          ["📣", "Announcements", "Schedule, room changes, deadlines and demo order, straight from the organizers."],
          ["🆘", "Help desk", "Ask organizers and mentors anything, all day."],
          ["🤝", "Find a team", "Looking for teammates? Post your idea or your skills."],
          ["🧪", "Sponsor Q&A", "Ask the sponsor teams about their tools."],
          ["👥", "Your team group", "Your team's own chat, with your agents as members too."],
          ["🎬", "Showcase", "Share screenshots and demos while you build."]
        ],
        swap: [
          ["Event Discord server", "Teamily AI event space"],
          ["Slack or WhatsApp group for your team", "Teamily AI team group"],
          ["DM a mentor", "Teamily AI help desk"],
          ["Bots bolted onto a chat app", "AI agents as real members of your group"]
        ],
        faq: [
          ["Is Teamily AI mandatory?", "Yes. Every hacker joins it: all event announcements, updates, help and team chat happen there instead of Discord or Slack."],
          ["Can we keep using Discord or Slack?", "No: announcements, updates and help are only posted on Teamily AI, so you would miss deadlines and the demo order."],
          ["Can AI agents join our team chat?", "Yes. Create agents with any role and @mention them like teammates. Try it first in the Sponsor Lab."],
          ["Is Teamily AI only for chatting?", "No. Your agents can build for you right in the group: a website, a demo video, a poster, a pitch deck, tests and bug fixes, launch posts. Show the judges the thread where your human + agent team made it."]
        ]
      },
      tracks: {
        film: { label: "Crew chat", does: "You and the film's role agents share one Teamily group: a Producer Agent pins the timeline, a Design Agent posts the poster, a Video Agent cuts the trailer and an Engineer Agent ships the premiere page, all in the same thread (simulated)." },
        game: { label: "Squad chat", does: "Players and AI teammates coordinate in one Teamily group: @mention an agent to patch the build or plan the next wave, and it reports back in the thread (simulated)." },
        grow: { label: "Study group", does: "You, your coach and research agents in one Teamily group: they remember your weak spots, share findings and post your next practice session (simulated)." }
      },
      mascot: { name: "Roo the Team Kangaroo", look: "A kangaroo in a violet scarf with a phone full of chat bubbles and a pouch of little agent joeys, each with its own role", action: "Opens a group chat anywhere, lets the agent joeys out of the pouch and each one does its role: marketing, design, code.", home: "game" }
    }
  ],

  /* Host = the organiser. Shown first everywhere (map, home, partners page) and labelled "Host & organizer". */
  host: {
    id: "crewbase", name: "Crewbase Collective", kind: "Host & organizer", url: "https://crewbasecollective.com",
    icon: "🛡️", color: "#3ea8ff", scene: { base: "office", time: "night" },
    blurb: "Crewbase Collective is the community that hosts and organises the Multiplayer AI hackathon. It runs hackathons, pitch competitions, workshops and mixers for builders, and brings the sponsors, partners, judges and hackers together in one room.",
    brings: "Hosts and runs the whole day: the tracks, the schedule, the judging and the crew on the floor.",
    mascot: { name: "Captain Circuit", look: "A blue armored hero with glowing circuit lines and a light core in the chest", action: "Runs the day from the town hall: powers up circuits that connect sponsors, partners and builders across every island.", home: "center" }
  },

  /* Partners = communities and companies that support the event (not tools in the tracks).
     Same mascot fields as sponsors. "brings" = what they bring to the hackathon. */
  partners: [
    {
      id: "aws", name: "AWS", kind: "Partner", url: "https://aws.amazon.com/startups/lofts",
      icon: "☁️", color: "#ff9900", scene: { base: "office", time: "day" },
      blurb: "Amazon Web Services hosts the hackathon at the AWS Loft, a space where builders and startups meet, learn and ship. For one day it is the town hall of our world: every track island is a bridge away.",
      brings: "The venue: the AWS Loft, our town hall for the day (9:30 AM – 8:30 PM).",
      mascot: { name: "Nimbus the Cloud", look: "A friendly cloud in an orange scarf carrying the Loft's key", action: "Opens the Loft doors in the morning and spins up servers for every team.", home: "center" }
    },
    {
      id: "twopercent", name: "2% Tech", kind: "Partner", url: "https://www.2percent.tech",
      icon: "🔥", color: "#ff7a1a", image: "/aim-hack-visual/img/2percent-mascot.jpg", scene: { base: "stage", time: "night" },
      blurb: "2%Tech is Silicon Valley's AI builders community: a network of 170K+ AI builders, founders and investors, with hackathons, conferences, research salons and private dinners, including AWS Builder Nights at the AWS Builder Loft.",
      brings: "Brings builders from its network into the room and helps spread the word.",
      mascot: { name: "Blaze", look: "A flame with white goggles and a white scarf", action: "Sparks up the crowd: the builder community gathering at the Loft.", home: "center" }
    },
    {
      id: "nerdconf", name: "NERDCONF", kind: "Partner", url: "https://www.nerdconf.com",
      icon: "🤓", color: "#8fe3a1", scene: { base: "classroom", time: "day" },
      blurb: "NERDCONF is a community for tech nerds and builders: talks, meetups and events for people who love making things.",
      brings: "Brings speakers, mentors and community energy.",
      mascot: { name: "Nerdo", look: "A green alien with big taped glasses, a bow tie and a conference badge", action: "Gives lightning talks on a pocket projector.", home: "grow" }
    },
    {
      id: "marvelous", name: "Marvelous", kind: "Partner", url: "https://www.themarvelo.us",
      icon: "🦸", color: "#e05cff", scene: { base: "manor", time: "night" },
      blurb: "Marvelous is an agent-first GTM platform for real-world B2B activations. Its agent, Maven, finds and prioritises the right guests, prepares outreach and coordinates execution, while the team approves every brand-sensitive decision.",
      brings: "Helps get the right people into the room.",
      mascot: { name: "Maven the Marvelous", look: "An original caped hero in purple and gold with a star emblem", action: "Flies over the islands inviting the right guests and builds the right room.", home: "film" }
    },
    {
      id: "hirey", name: "Hirey", kind: "Partner", url: "https://www.hirey.com",
      icon: "🐙", color: "#4fd1c5", scene: { base: "cafe", time: "day" },
      blurb: "Hirey is an agent-native introduction network: AI agents find the people you should meet (cofounders, early hires, mentors, design partners) and explain why it's a good match.",
      brings: "Helps hackers find teammates, mentors and warm intros.",
      mascot: { name: "Ollie the Intro Octopus", look: "A teal octopus in a bow tie, a contact card in every arm", action: "Has an arm for everyone: finds who should meet (cofounder, mentor, first hire) and ties them together with a warm intro.", home: "center" }
    },
    {
      id: "partnr", name: "Partnr Network", kind: "Partner", url: "https://www.partnr.network",
      icon: "🌉", color: "#ff8fab", scene: { base: "beach", time: "sunset" },
      blurb: "Partnr Network is a talent layer for borderless societies. It connects skilled talent from emerging economies with startup societies, special economic zones and digital nomad hubs, with SkillGraph proof-of-work profiles.",
      brings: "Connects builders with global opportunities after the hackathon.",
      mascot: { name: "Brix the Bridge Beaver", look: "A beaver in a hard hat with a passport and a plank", action: "Builds bridges plank by plank between islands so talent can cross to new opportunities.", home: "game" }
    },
    /* LingCode and HarnessRouter are partners, not track tools: they have no toggles in the tracks, labs or build guide.
       Optional and lowest priority; use the sponsor tools first. */
    {
      id: "lingcode", name: "LingCode", kind: "Partner", url: "https://lingcode.dev",
      icon: "📱", color: "#5ce1e6", scene: { base: "lab", time: "day" },
      blurb: "LingCode turns your app idea into a real iPhone, Android or web app that's live and taking payments. Describe what you want and the agent builds it, with the app running beside the chat. Sign-in, backend, payments, signing and App Store submission are included. You're done when your app is in the store, not when the code is written.",
      brings: "After the hackathon: a path from demo to a real app in the App Store. Optional and low priority on the day; build with the sponsor tools first.",
      mascot: { name: "Appy the Phone Bot", look: "A cyan phone with little legs, a chat bubble on its screen and an App Store badge", action: "Listens to your app idea, builds it on its own screen and ships it to the store.", home: "game" }
    },
    {
      id: "harnessrouter", name: "HarnessRouter", kind: "Partner", url: "https://harnessrouter.ai",
      icon: "🔀", color: "#f6a04d", scene: { base: "office", time: "night" },
      blurb: "HarnessRouter is a unified API and infrastructure layer that runs, manages and routes tasks across different AI agent harnesses.",
      brings: "Infrastructure for teams that already run several agent harnesses. Optional and low priority on the day; build with the sponsor tools first.",
      mascot: { name: "Switch the Router Crab", look: "An orange crab with a switchboard shell and three glowing cables", action: "Catches each task and routes it down the right cable to the right agent harness.", home: "center" }
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

/* ---------- sponsor visibility (ORGANISERS ONLY, not shown to visitors) ----------
   To hide a sponsor everywhere (maps, labs, home strip, track toolbars), add its id to
   HIDDEN_SPONSORS below and redeploy. Example: ["casuro"]. Leave [] to show all.
   Partners work the same way with HIDDEN_PARTNERS.
   HACK.allSponsors = every sponsor; HACK.sponsors = the visible ones (what every page reads). */
(function (H) {
  const HIDDEN_SPONSORS = [];
  const HIDDEN_PARTNERS = [];
  H.allSponsors = H.sponsors.slice();
  /* the official communication platform (sponsor with `comms`), or null */
  H.commsTool = () => H.sponsors.find(s => s.comms) || null;
  H.hiddenSponsors = HIDDEN_SPONSORS.filter(id => H.allSponsors.some(s => s.id === id));
  H.sponsors = H.allSponsors.filter(s => !H.hiddenSponsors.includes(s.id));
  H.sponsorVisible = id => !H.hiddenSponsors.includes(id);
  H.allPartners = (H.partners || []).slice();
  H.partners = H.allPartners.filter(p => !HIDDEN_PARTNERS.includes(p.id));
  /* host + partners in display order (the host always comes first) */
  H.people = (H.host ? [H.host] : []).concat(H.partners);
  /* sponsor, partner or host by id (visible ones only) */
  H.findOrg = id => H.sponsors.find(s => s.id === id) || H.people.find(p => p.id === id);
  try { localStorage.removeItem("aimp_sponsors_hidden"); } catch {}
})(window.HACK);

/* =========================================================
   Playground content: characters, story modes, game worlds.
   Everything here is editable. Users can also write their own.
   ========================================================= */
window.PLAY = {
  avatars: ["👩‍✈️", "🦹", "👩‍⚕️", "🤖", "🧒", "🕵️", "👸", "🧑‍🔧", "👨‍🏫", "🦊", "🎖️", "🎤", "🧙", "🧛", "👽", "🐉", "🧑‍💼", "🧌", "🔮", "🧑‍🌾", "👵", "🐱", "🦉", "🤠"],
  colors: ["#ff4fa3", "#3ee6ff", "#b6ff5c", "#ffc857", "#c48bff", "#ff9f43", "#5c8dff", "#4fd1c5", "#ff6b6b", "#f2f2f2"],

  /* ---------------- TRACK 1 · FILM ---------------- */
  filmCast: [
    { name: "Captain Vega", avatar: "👩‍✈️", role: "Captain", personality: "Duty-bound, calm under pressure, hates losing anyone under her command.", secret: "The disaster was her fault, and she will do anything to keep that hidden." },
    { name: "Rook", avatar: "🦹", role: "Smuggler", personality: "Charming, selfish, always has an exit plan.", secret: "A buyer is waiting for the valuable cargo. Rook intends to escape with it." },
    { name: "Dr. Imani", avatar: "👩‍⚕️", role: "Medic", personality: "Compassionate, logical, steady voice in a crisis.", secret: "Carries an experimental cure worth millions and can't let it be lost." },
    { name: "BOLT-9", avatar: "🤖", role: "Android", personality: "Literal, polite, curious about human emotions.", secret: "Has hidden orders to protect the cargo above every human life." },
    { name: "Kit", avatar: "🧒", role: "Stowaway kid", personality: "Brave, sneaky, cracks jokes when scared.", secret: "Overheard everyone's secrets and is deciding whom to trust." },
    { name: "Marlowe", avatar: "🕵️", role: "Detective", personality: "Sharp, cynical, notices everything.", secret: "Was paid to frame someone in this room." },
    { name: "Lady Ashford", avatar: "👸", role: "Heiress", personality: "Proud, elegant, quietly manipulative.", secret: "Is completely broke and desperate for money." },
    { name: "Jax", avatar: "🧑‍🔧", role: "Engineer", personality: "Grumpy genius, blunt, secretly soft-hearted.", secret: "Can fix everything but needs someone to stay behind and help." },
    { name: "Prof. Okafor", avatar: "👨‍🏫", role: "Scientist", personality: "Brilliant, reckless, talks too much.", secret: "Their experiment caused all of this." },
    { name: "Nyx", avatar: "🦊", role: "Thief", personality: "Playful, quick, impossible to read.", secret: "Is an undercover police informant." },
    { name: "General Hale", avatar: "🎖️", role: "Soldier", personality: "Aggressive, protective, gives orders to everyone.", secret: "Deserted his last post and fears being found out." },
    { name: "Luna Star", avatar: "🎤", role: "Pop star", personality: "Dramatic, attention-seeking, surprisingly brave.", secret: "Wants to vanish and start a new life under a new name." }
  ],

  storyModes: [
    {
      id: "pod", icon: "🚀", title: "The Last Escape Pod", theme: "space",
      setting: "A research starship tearing apart in deep space.",
      opening: "The hull breach alarm screams. Ten minutes of air left, and the only escape pod has ONE seat.",
      spots: [{ label: "the escape pod", icon: "🚀", x: 88 }, { label: "the control console", icon: "🖥️", x: 10 }]
    },
    {
      id: "heist", icon: "💰", title: "The Inside Job", theme: "vault",
      setting: "The vault room of the most secure bank in the city, at midnight.",
      opening: "The vault swings open, but the silent alarm was tripped early. Someone in the crew tipped off the police.",
      spots: [{ label: "the open vault", icon: "💰", x: 88 }, { label: "the getaway van", icon: "🚐", x: 10 }]
    },
    {
      id: "manor", icon: "🕯️", title: "Dinner at the Manor", theme: "manor",
      setting: "A candle-lit dining hall in an isolated manor during a thunderstorm.",
      opening: "The host collapses face-first into dessert. The doors are locked from the outside.",
      spots: [{ label: "the locked study", icon: "🚪", x: 88 }, { label: "the fireplace", icon: "🔥", x: 10 }]
    },
    {
      id: "court", icon: "⚖️", title: "The Verdict", theme: "court",
      setting: "A packed courtroom on the final day of a famous trial.",
      opening: "New evidence arrives: a recording proving one of the people in this room committed sabotage.",
      spots: [{ label: "the witness stand", icon: "🪑", x: 88 }, { label: "the judge's bench", icon: "⚖️", x: 10 }]
    }
  ],
  tones: ["Thriller", "Comedy", "Noir", "Heartfelt", "Absolute chaos"],
  lengths: [{ label: "Short", beats: 6 }, { label: "Medium", beats: 10 }, { label: "Epic", beats: 14 }],
  inspiration: ["trust", "greed", "sacrifice", "a lie", "an old debt", "a misunderstanding", "redemption", "jealousy", "a hidden weapon", "an unexpected kindness", "panic", "a confession"],

  /* ---------------- TRACK 2 · GAME ---------------- */
  gameWorlds: [
    {
      id: "market", icon: "🏪", title: "Grudge Market", theme: "market",
      desc: "A trading town where merchants set prices, strike deals and never forget a bad trade.",
      locations: ["Spice Bazaar", "Bank", "Docks", "Tavern"],
      events: [
        { id: "market_crash", icon: "📉", title: "Market Crash", text: "Everyone loses 40% of their coins.", fx: { who: "all", coinsPct: -40 } },
        { id: "boycott", icon: "🚫", title: "Boycott of the Humans", text: "Merchants refuse to trade with humans. Humans lose 2 coins and 2 influence.", fx: { who: "humans", coins: -2, influence: -2 } },
        { id: "caravan", icon: "🐫", title: "Golden Caravan", text: "The instigator hijacks a caravan and gains 6 coins.", fx: { who: "causer", coins: 6 } }
      ]
    },
    {
      id: "island", icon: "🏝️", title: "Betrayal Island", theme: "island",
      desc: "Shipwrecked on an island with rival tribes who remember everything you do.",
      locations: ["Beach Camp", "Jungle", "Volcano Temple", "Lagoon"],
      events: [
        { id: "tribe_war", icon: "⚔️", title: "Tribe War", text: "War breaks out. Everyone loses 3 health.", fx: { who: "all", health: -3 } },
        { id: "raid", icon: "🔥", title: "Raid on the Human Camp", text: "Humans lose 3 coins and 2 health.", fx: { who: "humans", coins: -3, health: -2 } },
        { id: "feast", icon: "🍖", title: "Great Feast", text: "Everyone heals 2. The host gains 2 influence.", fx: { who: "all", health: 2, causerInfluence: 2 } }
      ]
    },
    {
      id: "station", icon: "🛰️", title: "Station Zero", theme: "station",
      desc: "A failing space station. Ration oxygen, repair systems and watch your back.",
      locations: ["Bridge", "Reactor", "Greenhouse", "Airlock"],
      events: [
        { id: "mutiny", icon: "🏴", title: "Mutiny", text: "The instigator seizes the Bridge. Humans lose 2 influence and the leader gains 3.", fx: { who: "humans", influence: -2, causerInfluence: 3 } },
        { id: "leak", icon: "☢️", title: "Reactor Leak", text: "Everyone loses 3 health.", fx: { who: "all", health: -3 } },
        { id: "sealed", icon: "🔒", title: "Section Sealed", text: "Humans are locked out of the supplies and lose 2 health.", fx: { who: "humans", health: -2 } }
      ]
    }
  ],
  customEvents: [
    { id: "chaos", icon: "🌪️", title: "Chaos Erupts", text: "Everyone loses 2 health.", fx: { who: "all", health: -2 } },
    { id: "uprising", icon: "✊", title: "Agent Uprising", text: "Humans lose 2 influence and the leader gains 2.", fx: { who: "humans", influence: -2, causerInfluence: 2 } },
    { id: "windfall", icon: "💎", title: "Windfall", text: "The instigator gains 5 coins.", fx: { who: "causer", coins: 5 } }
  ],

  gameAgents: [
    { name: "Mira", avatar: "🧑‍💼", role: "Merchant", personality: "Shrewd, charming, never forgets a bad deal.", goal: "Become the richest player.", style: { trade: 4, gather: 2, ally: 2, steal: 1, talk: 2 } },
    { name: "Brakka", avatar: "🧌", role: "Warlord", personality: "Loud, aggressive, respects only strength.", goal: "Be the most feared player.", style: { attack: 4, steal: 2, move: 2, talk: 1 } },
    { name: "Fen", avatar: "🦊", role: "Trickster", personality: "Funny, unpredictable, loves chaos.", goal: "Win by betraying allies at the perfect moment.", style: { ally: 3, betray: 3, steal: 2, talk: 2 } },
    { name: "Sable", avatar: "🔮", role: "Oracle", personality: "Calm, mysterious, keeps every promise.", goal: "Gain the most influence through alliances.", style: { ally: 4, talk: 3, trade: 1, move: 1 } },
    { name: "Tomo", avatar: "🧑‍🌾", role: "Builder", personality: "Kind, hard-working, hates thieves.", goal: "Help the group survive, punish cheaters.", style: { gather: 4, ally: 2, trade: 2, attack: 1 } },
    { name: "Quill", avatar: "🕵️", role: "Spy", personality: "Quiet, observant, sells information.", goal: "Know everything and profit from it.", style: { talk: 3, steal: 2, trade: 2, move: 2 } },
    { name: "Unit-7", avatar: "🤖", role: "Logic bot", personality: "Cold, efficient, precise.", goal: "Maximize its own score with minimal risk.", style: { gather: 3, trade: 3, steal: 1 } },
    { name: "Granny Pell", avatar: "👵", role: "Elder", personality: "Sweet, wise, terrifying when crossed.", goal: "Protect her friends, ruin her enemies.", style: { ally: 3, gather: 2, attack: 1, talk: 2 } }
  ],

  actions: {
    move: { icon: "🚶", label: "Move", needs: "location", help: "Go to another location." },
    gather: { icon: "⛏️", label: "Work", needs: null, help: "+2 coins." },
    trade: { icon: "🤝", label: "Trade", needs: "player", help: "+1 coin each, +1 trust." },
    ally: { icon: "🛡️", label: "Ally", needs: "player", help: "+2 trust each, +1 influence." },
    talk: { icon: "💬", label: "Talk", needs: "player", help: "Send a message, +1 trust." },
    steal: { icon: "🫳", label: "Steal", needs: "player", help: "Take 3 coins. They'll remember." },
    attack: { icon: "⚔️", label: "Attack", needs: "player", help: "-3 health to them, -1 to you." },
    betray: { icon: "🗡️", label: "Betray", needs: "player", help: "Works on allies: take 5 coins." }
  }
};

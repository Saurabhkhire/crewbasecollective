/* =========================================================
   STUDIO · Characters & Scenes
   Two ways to create: ✋ Manual (pick every detail) or
   ✨ Describe it (an AI agent designs it from your idea).
   window.Studio = { start(sub), characterModal({initial,onSave}), sceneModal({initial,onSave}) }
   Routes: #studio (characters) · #studio/scenes
   ========================================================= */
window.Studio = (function () {
  const { $, esc, rand } = UI;
  const L = Puppet.LOOK;
  const C = "#c48bff";
  const BADGES = ["", "⭐", "🔥", "💎", "🎵", "⚡", "🍀", "❤️", "🛡️", "🧪", "🍕", "🎮", "📷", "🌙", "🏆", "🗝️"];
  const EMO = [["happy", "😄"], ["angry", "😠"], ["scared", "😨"], ["sad", "😢"], ["sly", "😏"], ["shocked", "😱"], ["determined", "😤"], ["thinking", "💭"]];
  const BACKDROPS = [{ base: "stage", time: "night" }, { base: "park", time: "day" }, { base: "city", time: "night" }, { base: "office", time: "day" }, { base: "forest", time: "sunset" }, { base: "space", time: "night" }];
  const LABEL = {
    species: "Species", skin: "Skin", hair: "Hair style", hairColor: "Hair colour", eyes: "Eyes", eyeColor: "Eye colour", facial: "Facial hair",
    outfit: "Outfit", outfitColor: "Outfit colour", acc: "Accessory", build: "Build", badge: "Badge"
  };
  const NICE = { none: "None", tshirt: "T-shirt", labcoat: "Lab coat", tophat: "Top hat", wizardhat: "Wizard hat", eyepatch: "Eye patch", sunglasses: "Shades" };
  const nice = v => NICE[v] || (v.charAt(0).toUpperCase() + v.slice(1));
  const clone = o => JSON.parse(JSON.stringify(o || {}));
  const clip = (s, n) => String(s == null ? "" : s).trim().slice(0, n);

  /* ---------- random personality material ---------- */
  const FIRST = ["Zara", "Milo", "Ines", "Otto", "Kai", "Noor", "Felix", "Ruby", "Theo", "Yuki", "Sol", "Bea", "Arlo", "Mina", "Gus", "Ivy", "Dex", "Lumi", "Pax", "Rosa"];
  const ROLES = ["Pilot", "Chef", "Detective", "Inventor", "Spy", "Librarian", "Pirate", "Mechanic", "Gardener", "Journalist", "Astronaut", "Coach", "Magician", "Barista", "Architect", "Ranger"];
  const TRAITS = ["Fearless, sarcastic and fiercely loyal to friends.", "Gentle, curious and asks far too many questions.", "Loud, funny and always the first to volunteer.", "Calm, calculating and never shows their cards.", "Anxious but brilliant; plans for every disaster.", "Charming, vain and secretly insecure.", "Grumpy on the outside, soft-hearted on the inside.", "Optimistic to a fault and impossible to discourage."];
  const SECRETS = ["Is hiding a debt that could ruin everyone.", "Once betrayed someone in this room and fears they'll find out.", "Is not who they say they are.", "Knows the way out but wants to be the only one who uses it.", "Is secretly in love with their biggest rival.", "Has been recording everything for a mysterious buyer."];
  const GOALS = ["Win, but never betray a friend.", "Collect the most treasure.", "Protect the weakest player.", "Be the last one standing.", "Make everyone laugh at least once.", "Learn every other player's secret."];
  function randomPersona() {
    return { name: rand(FIRST), role: rand(ROLES), personality: rand(TRAITS), secret: rand(SECRETS), goal: rand(GOALS) };
  }
  function newChar() { return Object.assign(randomPersona(), { look: Puppet.randomLook() }); }

  const skinsFor = sp => sp === "robot" ? L.robotSkin : sp === "alien" ? L.alienSkin : sp === "cat" || sp === "bear" ? L.furSkin : L.skin;
  function fixLook(l) {
    l = Object.assign({}, Puppet.fullLook({ name: "x", look: l }), { badge: l.badge || "" });
    if (!skinsFor(l.species).includes(l.skin) && !(l.skin && /^#[0-9a-f]{6}$/i.test(l.skin) && l._customSkin)) l.skin = skinsFor(l.species)[0];
    if (l.species === "robot" || l.species === "cat" || l.species === "bear") { l.hair = "none"; l.facial = "none"; }
    if (l.species !== "human") l.facial = "none";
    delete l._customSkin;
    return l;
  }

  /* ---------- mini thumbnails: crop a puppet to its head / body ---------- */
  function thumb(c, crop) {
    const vb = crop === "head" ? "14 -16 92 100" : crop === "body" ? "14 80 92 82" : "0 -18 120 218";
    return Puppet.svg(c).replace('viewBox="0 -18 120 218"', `viewBox="${vb}"`).replace('class="puppet"', 'class="puppet st-th"');
  }

  /* =========================================================
     AI: CHARACTER
     ========================================================= */
  const KEYWORDS = [
    [/\brobot|android|droid|\bbot\b|cyborg|machine/i, { species: "robot", skin: "#c9d3e0", eyes: "big" }, "Made them a robot with big glowing eyes."],
    [/\balien|martian|extraterrestrial|envoy/i, { species: "alien", skin: "#8fe3a1" }, "Gave them green alien skin and antennae."],
    [/\bcat\b|kitten|feline/i, { species: "cat", skin: "#f2b36b" }, "Turned them into a cat, ears and whiskers included."],
    [/\bbear\b|grizzly|panda/i, { species: "bear", skin: "#8a5a3b" }, "Made them a big friendly bear."],
    [/pirate|captain hook|sailor/i, { acc: "eyepatch", outfit: "jacket", outfitColor: "#8b5e3c", facial: "beard" }, "An eye patch and a weathered jacket for the pirate life."],
    [/chef|cook|baker|bakery|kitchen/i, { outfit: "labcoat", outfitColor: "#f2f2f2" }, "A crisp white chef's jacket, ready for service."],
    [/wizard|witch|mage|sorcer|magic/i, { outfit: "robe", acc: "wizardhat", outfitColor: "#5c8dff" }, "A starry wizard hat and a flowing robe."],
    [/doctor|nurse|medic|scientist|professor|lab/i, { outfit: "labcoat", acc: "glasses" }, "A lab coat and glasses: this one reads the fine print."],
    [/king|queen|prince|princess|royal|heir/i, { acc: "crown", outfit: "dress", outfitColor: "#c48bff" }, "A golden crown, because royalty."],
    [/soldier|general|guard|army|knight/i, { outfit: "armor", build: "broad" }, "Armour and a broad build for the front line."],
    [/superhero|hero|vigilante/i, { outfit: "uniform", outfitColor: "#ff4f6d", build: "broad", badge: "⚡" }, "A bold red suit with a lightning badge."],
    [/detective|investigator|sleuth|spy/i, { outfit: "suit", outfitColor: "#2d3142", acc: "tophat" }, "A sharp dark suit for blending into shadows."],
    [/intern|student|kid|teen|young/i, { outfit: "hoodie", acc: "cap", build: "slim", eyes: "big" }, "A hoodie and big, eager eyes."],
    [/business|ceo|manager|boss|banker|lawyer|founder|investor/i, { outfit: "suit", outfitColor: "#5c8dff" }, "A tailored suit that means business."],
    [/farmer|gardener|builder|mechanic|engineer|plumber/i, { outfit: "overalls", outfitColor: "#ffc857" }, "Work overalls with pockets for every tool."],
    [/pop star|singer|musician|rockstar|dj|band/i, { acc: "sunglasses", outfit: "jacket", outfitColor: "#ff4fa3", hair: "ponytail", hairColor: "#ff5fa2" }, "Shades and pink hair: stage-ready."],
    [/astronaut|pilot|space/i, { acc: "helmet", outfit: "uniform", outfitColor: "#f2f2f2" }, "A space helmet and flight uniform."],
    [/gamer|streamer|hacker|coder|programmer/i, { acc: "headset", outfit: "hoodie", outfitColor: "#2d3142" }, "A headset and a dark hoodie for long nights online."],
    [/old|retired|grandma|grandpa|elder|ancient/i, { hairColor: "#e8e8e8", eyes: "sleepy" }, "Silver hair from a long, eventful life."],
    [/grumpy|angry|cranky/i, { eyes: "sleepy" }, "Heavy eyelids for that permanent grumpy stare."],
    [/nervous|shy|anxious|scared/i, { eyes: "big" }, "Big worried eyes that give away every feeling."],
    [/poet|writer|author|artist|painter/i, { acc: "beanie", outfit: "sweater" }, "A beanie and a cosy sweater for an artist's soul."],
    [/flower|hippie|nature|ranger/i, { acc: "flower", outfitColor: "#3d8a4f" }, "A flower tucked behind the ear."]
  ];
  const ADJ = { grumpy: "Grumpy and blunt", nervous: "Nervous and over-prepared", cheerful: "Cheerful and loud", shy: "Shy and observant", lazy: "Lazy but secretly clever", brave: "Brave and reckless", evil: "Cold and scheming", kind: "Kind and patient", sarcastic: "Sarcastic and quick-witted", retired: "Retired, restless and full of stories", clumsy: "Clumsy and enthusiastic", proud: "Proud and stubborn" };

  function offlineCharacter(idea) {
    const look = Puppet.randomLook(idea), notes = [];
    const taken = new Set();
    for (const [re, patch, note] of KEYWORDS) {
      if (!re.test(idea)) continue;
      let used = false;
      for (const k in patch) if (!taken.has(k)) { look[k] = patch[k]; taken.add(k); used = true; }
      if (used && notes.length < 3) notes.push(note);
    }
    if (/\bred\b/i.test(idea)) look.outfitColor = "#ff6b6b";
    if (/\bblue\b/i.test(idea)) look.outfitColor = "#5c8dff";
    if (/\bgreen\b/i.test(idea)) look.outfitColor = "#3d8a4f";
    if (/\bblack\b|dark/i.test(idea)) look.outfitColor = "#2d3142";
    if (!/robot|alien|cat|bear/i.test(idea) && look.species !== "human") { look.species = "human"; look.skin = rand(L.skin); }
    while (notes.length < 3) notes.push(rand(["Picked colours that pop on any stage.", "Matched the outfit to how they'd spend a normal day.", "Chose a build that fits their attitude.", "Added a small detail people will remember."]));
    // role: a known role word, or the main noun phrase
    const RW = /\b(pirate|chef|robot|wizard|witch|doctor|nurse|scientist|professor|king|queen|prince|princess|soldier|general|knight|superhero|hero|detective|spy|intern|student|ceo|manager|founder|farmer|gardener|mechanic|engineer|singer|musician|astronaut|pilot|hacker|gamer|poet|writer|artist|baker|ranger|teacher|lawyer|cat|bear|alien|dj)\b/gi;
    const ms = [...idea.matchAll(RW)];
    let roleWord = ms[0] ? ms[0][1] : "";
    if (ms[1] && /^\s+$/.test(idea.slice(ms[0].index + ms[0][1].length, ms[1].index))) roleWord += " " + ms[1][1];
    roleWord = roleWord.replace(/\bdj\b/i, "DJ");
    const role = roleWord ? roleWord.charAt(0).toUpperCase() + roleWord.slice(1).toLowerCase().replace(/\bdj\b/, "DJ") : clip(idea.replace(/^(a|an|the)\s+/i, "").split(/\s+(who|that|with|and)\s+/i)[0], 28) || "Wanderer";
    const adj = Object.keys(ADJ).find(a => new RegExp("\\b" + a, "i").test(idea));
    const secretM = idea.match(/secretly\s+([^.,;]+)/i);
    return {
      name: rand(FIRST) + (/robot|android/i.test(idea) ? "-" + Math.floor(Math.random() * 90 + 10) : ""),
      role,
      personality: (adj ? ADJ[adj] : rand(["Curious and warm", "Bold and dramatic", "Quiet and sharp", "Funny and restless"])) + `; a ${role.toLowerCase().replace(/\bdj\b/, "DJ")} through and through.`.replace(/; a ([aeiou])/i, "; an $1"),
      secret: secretM ? "Secretly " + secretM[1].trim() + " and would die of embarrassment if anyone found out." : rand(SECRETS),
      goal: rand(GOALS),
      look,
      design_notes: notes.slice(0, 3)
    };
  }

  function lookSpec() {
    return `species: ${L.species.join(", ")}
skin (hex; pick from the palette that matches the species): human ${L.skin.join(" ")} | alien ${L.alienSkin.join(" ")} | robot ${L.robotSkin.join(" ")} | cat/bear ${L.furSkin.join(" ")}
hair (only shown for human/alien): ${L.hair.join(", ")}
hairColor (hex): ${L.hairColor.join(" ")}
eyes: ${L.eyes.join(", ")}
eyeColor (hex): ${L.eyeColor.join(" ")}
facial (human only): ${L.facial.join(", ")}
outfit: ${L.outfit.join(", ")}
outfitColor (hex): ${L.outfitColor.join(" ")}
acc: ${L.acc.join(", ")}
build: ${L.build.join(", ")}
badge: one emoji shown on the chest, or ""`;
  }

  async function aiCharacter(idea) {
    const system = `You are a character-design agent for an animated film and game playground. Turn the user's idea into ONE memorable character that AI agents can role-play.
Design the look ONLY from these allowed values:
${lookSpec()}
Reply with JSON only:
{"name":"short memorable name","role":"job or archetype, max 3 words","personality":"how they think and talk, max 20 words","secret":"a dramatic secret only they know, max 22 words","goal":"what they want to win in a game, max 14 words","look":{"species":"","skin":"","hair":"","hairColor":"","eyes":"","eyeColor":"","facial":"","outfit":"","outfitColor":"","acc":"","build":"","badge":""},"design_notes":["3 short notes (max 14 words each) explaining the look choices, first person, e.g. 'Gave her a beanie because she writes poetry in cold cafés.'"]}`;
    const out = await Brain.ask(system, `Idea: ${idea}`, 0.95, () => offlineCharacter(idea));
    return sanitizeChar(out, idea);
  }
  function sanitizeChar(o, idea) {
    const fb = offlineCharacter(idea || "");
    const lk = Object.assign({}, fb.look);
    const src = o.look || {};
    for (const k of ["species", "hair", "eyes", "facial", "outfit", "acc", "build"]) if (L[k].includes(src[k])) lk[k] = src[k];
    for (const k of ["skin", "hairColor", "eyeColor", "outfitColor"]) if (/^#[0-9a-f]{6}$/i.test(src[k] || "")) lk[k] = src[k].toLowerCase();
    lk.badge = typeof src.badge === "string" && [...src.badge].length <= 2 ? src.badge : "";
    if (!skinsFor(lk.species).map(s => s.toLowerCase()).includes(lk.skin)) lk.skin = skinsFor(lk.species)[0];
    return {
      name: clip(o.name, 24) || fb.name, role: clip(o.role, 28) || fb.role,
      personality: clip(o.personality, 220) || fb.personality, secret: clip(o.secret, 220) || fb.secret, goal: clip(o.goal, 160) || fb.goal,
      look: fixLook(lk),
      design_notes: (Array.isArray(o.design_notes) ? o.design_notes : fb.design_notes).map(n => clip(n, 120)).filter(Boolean).slice(0, 3),
      _src: o._src
    };
  }

  /* =========================================================
     AI: SCENE
     ========================================================= */
  const SCENE_KW = [
    [/office|startup|desk|cubicle|workplace|company/i, "office"], [/forest|woods|jungle|grove|trees/i, "forest"], [/space|starship|spaceship|station|galaxy|rocket/i, "space"],
    [/city|street|downtown|alley|neon|tokyo|new york/i, "city"], [/castle|throne|kingdom|medieval|palace/i, "castle"], [/beach|island|ocean|sea|tropical|shore/i, "beach"],
    [/class|school|lecture|university|lesson/i, "classroom"], [/court|trial|judge|jury/i, "courtroom"], [/kitchen|restaurant|cook|chef|diner/i, "kitchen"],
    [/desert|dune|sahara|wasteland|canyon/i, "desert"], [/snow|mountain|ski|arctic|winter|summit|ice/i, "snow"], [/stage|concert|theater|theatre|show|gig/i, "stage"],
    [/manor|mansion|dinner|dining|mystery|haunted/i, "manor"], [/lab|laboratory|science|experiment/i, "lab"], [/board ?room|meeting|interview|pitch|conference/i, "boardroom"], [/park|garden|pond|picnic|bench/i, "park"]
  ];
  function offlineScene(idea) {
    const hit = SCENE_KW.find(([re]) => re.test(idea));
    const base = hit ? hit[1] : rand(Scenes.BASES).id;
    const time = /night|midnight|dark|neon|moon|stars/i.test(idea) ? "night" : /sunset|dusk|evening|golden|dawn/i.test(idea) ? "sunset" : "day";
    const weather = /rain|storm|thunder|wet/i.test(idea) ? "rain" : /snow|blizzard|frost/i.test(idea) ? "snow" : /fog|mist|haze|spooky/i.test(idea) ? "fog" : /firefl|magic|enchant/i.test(idea) ? "fireflies" : /fire|ember|burn|lava|volcano|torch/i.test(idea) ? "embers" : "clear";
    const B = Scenes.BASES.find(b => b.id === base);
    const words = idea.replace(/^(a|an|the)\s+/i, "").split(/\s+(?:on|in|at|with|during|full|under|of|near|by|where|that|who)\s+/i)[0].split(/\s+/).slice(0, 4).join(" ");
    return {
      name: clip(words.charAt(0).toUpperCase() + words.slice(1), 32) || B.name, base, time, weather,
      desc: clip(`${B.desc.replace(/\.$/, "")}${time !== "day" ? `, at ${time === "night" ? "night" : "sunset"}` : ""}${weather !== "clear" ? `, with ${weather === "fireflies" ? "fireflies drifting" : weather === "embers" ? "embers in the air" : weather}` : ""}. ${idea}`, 240),
      design_notes: [
        `Started from the ${B.name.toLowerCase()} set because your idea mentions it.`,
        time === "day" ? "Kept it in daylight so every character is easy to read." : `Set it at ${time} for a moodier feel.`,
        weather === "clear" ? "Clear skies so the action stays the focus." : `Added ${weather} to make the scene feel alive.`
      ]
    };
  }
  async function aiScene(idea) {
    const system = `You are a set-design agent. Turn the user's idea into one scene for an animated playground.
Allowed values:
base: ${Scenes.BASES.map(b => `${b.id} (${b.desc})`).join("; ")}
time: ${Scenes.TIMES.join(", ")}
weather: ${Scenes.WEATHER.join(", ")}
Pick the base that best fits. Reply with JSON only: {"name":"scene name, max 4 words","base":"","time":"","weather":"","desc":"one vivid sentence a storyteller can use, max 28 words","design_notes":["3 short first-person notes (max 14 words each) explaining your choices"]}`;
    const o = await Brain.ask(system, `Idea: ${idea}`, 0.9, () => offlineScene(idea));
    const fb = offlineScene(idea);
    return {
      name: clip(o.name, 32) || fb.name,
      base: Scenes.BASES.some(b => b.id === o.base) ? o.base : fb.base,
      time: Scenes.TIMES.includes(o.time) ? o.time : fb.time,
      weather: Scenes.WEATHER.includes(o.weather) ? o.weather : fb.weather,
      desc: clip(o.desc, 240) || fb.desc,
      design_notes: (Array.isArray(o.design_notes) ? o.design_notes : fb.design_notes).map(n => clip(n, 120)).filter(Boolean).slice(0, 3),
      _src: o._src
    };
  }

  /* downscale a data URL for storage */
  function shrink(dataUrl, size) {
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement("canvas"); cv.width = size; cv.height = size;
        cv.getContext("2d").drawImage(img, 0, 0, size, size);
        try { res(cv.toDataURL("image/jpeg", 0.82)); } catch { res(null); }
      };
      img.onerror = () => res(null);
      img.src = dataUrl;
    });
  }

  /* =========================================================
     CHARACTER EDITOR (page + modal)
     ========================================================= */
  function charEditor(host, opts) {
    let c = opts.initial ? clone(opts.initial) : newChar();
    c.look = fixLook(c.look || Puppet.fullLook(c));
    let mode = opts.mode || "manual", bd = 0, lastAI = null;
    const isPreset = !!(opts.initial && opts.initial.id && !opts.initial.custom && PLAY.characters.some(p => p.id === opts.initial.id));
    if (isPreset) { delete c.id; c.name = c.name + " (remix)"; }

    host.innerHTML = `
      <div class="st-ed ${opts.compact ? "compact" : ""}">
        <div class="st-prev">
          <div class="st-stage" id="stStage"><div class="st-pup" id="stPup"></div><img class="st-portrait" id="stPortrait" alt="" hidden>
            <div class="st-nameplate"><b id="stNm"></b><small id="stRl"></small></div></div>
          <div class="st-acts">
            ${EMO.map(([e, i]) => `<button data-emo="${e}" title="${e}">${i}</button>`).join("")}
            <button data-g="wave" title="Wave">👋</button><button data-g="jump" title="Jump">🦘</button><button data-g="talk" title="Talk">🗣️</button>
            <button data-bd title="Change backdrop">🖼️</button>
          </div>
          ${Brain.images ? `<button class="btn ghost btn-sm st-portrait-btn" id="stPortraitBtn">🎨 AI portrait</button>` : ""}
          <div class="st-card-preview" id="stCardPrev"></div>
        </div>
        <div class="st-ctrl">
          <div class="tabs st-modes"><button data-mode="manual">✋ Manual</button><button data-mode="ai">✨ Describe it (AI)</button></div>
          <div class="st-pane" id="stPane"></div>
          <div class="st-foot">
            ${opts.onCancel ? `<button class="btn ghost btn-sm" id="stCancel">Cancel</button>` : ""}
            <button class="btn ghost btn-sm" id="stNew">↺ Start over</button>
            <button class="btn" id="stSave">💾 Save character</button>
          </div>
        </div>
      </div>`;
    const pupEl = host.querySelector("#stPup");
    const stage = host.querySelector("#stStage");
    const drawBackdrop = () => Scenes.mount(stage, BACKDROPS[bd % BACKDROPS.length]);
    const drawPreview = pop => {
      Puppet.mount(pupEl, c);
      host.querySelector("#stNm").textContent = c.name || "Unnamed";
      host.querySelector("#stRl").textContent = c.role || "";
      const pi = host.querySelector("#stPortrait");
      if (c.portrait) { pi.src = c.portrait; pi.hidden = false; } else pi.hidden = true;
      if (pop) { pupEl.classList.remove("st-pop"); void pupEl.offsetWidth; pupEl.classList.add("st-pop"); setTimeout(() => Puppet.gesture(pupEl, "wave", 2200), 500); }
    };

    /* ----- manual pane ----- */
    function group(key, opts2) {
      const val = c.look[key];
      const body = opts2.render(val);
      return `<div class="st-grp"><div class="st-gh">${LABEL[key]}${opts2.sub ? `<small>${opts2.sub}</small>` : ""}</div><div class="st-opts ${opts2.cls || ""}">${body}</div></div>`;
    }
    const swatches = (key, list) => list.map(h => `<button class="sw ${c.look[key] === h ? "on" : ""}" data-k="${key}" data-v="${h}" style="--sw:${h}" title="${h}"></button>`).join("");
    const variant = (key, v) => ({ name: c.name, role: c.role, look: key === "species" ? fixLook(Object.assign({}, c.look, { species: v })) : Object.assign({}, c.look, { [key]: v }) });
    const thumbs = (key, list, crop) => list.map(v => `<button class="tb ${c.look[key] === v ? "on" : ""}" data-k="${key}" data-v="${v}" title="${nice(v)}">${thumb(variant(key, v), crop)}<span>${nice(v)}</span></button>`).join("");
    const chips = (key, list) => list.map(v => `<button class="chip ${c.look[key] === v ? "on" : ""}" data-k="${key}" data-v="${v}">${nice(v)}</button>`).join("");

    function manualHTML() {
      const sp = c.look.species, hasHair = sp === "human" || sp === "alien";
      return `
        <div class="st-fields">
          <div class="two"><div><label>Name</label><input data-f="name" maxlength="24" value="${esc(c.name)}"></div>
          <div><label>Role</label><input data-f="role" maxlength="28" value="${esc(c.role)}"></div></div>
          <label>Personality <small>how they think and talk</small></label><textarea data-f="personality" rows="2" maxlength="220">${esc(c.personality)}</textarea>
          <div class="two"><div><label>🔒 Secret <small>for films</small></label><textarea data-f="secret" rows="2" maxlength="220">${esc(c.secret)}</textarea></div>
          <div><label>🎯 Goal <small>for games</small></label><textarea data-f="goal" rows="2" maxlength="160">${esc(c.goal)}</textarea></div></div>
          <div class="st-rand"><button class="btn ghost btn-sm" data-rlook>🎲 Randomize look</button><button class="btn ghost btn-sm" data-rpers>🎲 Random personality</button></div>
        </div>
        <div class="st-groups">
          ${group("species", { render: () => thumbs("species", L.species, "head"), cls: "thumbs" })}
          ${group("skin", { render: () => swatches("skin", skinsFor(sp)) })}
          ${hasHair ? group("hair", { render: () => thumbs("hair", L.hair, "head"), cls: "thumbs" }) : ""}
          ${hasHair || sp === "human" ? group("hairColor", { render: () => swatches("hairColor", L.hairColor), sub: sp === "human" ? "also beard & brows" : "" }) : ""}
          ${group("eyes", { render: () => chips("eyes", L.eyes) })}
          ${sp !== "robot" && sp !== "alien" ? group("eyeColor", { render: () => swatches("eyeColor", L.eyeColor) }) : ""}
          ${sp === "human" ? group("facial", { render: () => chips("facial", L.facial) }) : ""}
          ${group("outfit", { render: () => thumbs("outfit", L.outfit, "body"), cls: "thumbs" })}
          ${group("outfitColor", { render: () => swatches("outfitColor", L.outfitColor) })}
          ${group("acc", { render: () => thumbs("acc", L.acc, "head"), cls: "thumbs" })}
          ${group("build", { render: () => chips("build", L.build) })}
          ${group("badge", { render: () => BADGES.map(b => `<button class="chip em ${c.look.badge === b ? "on" : ""}" data-k="badge" data-v="${b}">${b || "None"}</button>`).join("") })}
        </div>`;
    }

    /* ----- AI pane ----- */
    const EX = ["a grumpy pirate chef who secretly writes poetry", "a nervous robot intern on its first day", "a retired superhero running a bakery", "a queen who is secretly a spy", "a laid-back alien DJ", "a cat detective in a trench coat", "an ancient wizard who forgot every spell", "a teenage hacker in a dark hoodie"];
    function aiHTML() {
      return `
        <p class="muted st-lead">Describe a character in plain words. An AI agent ${Brain.mode === "llm" ? `(<b>${esc(Brain.model)}</b>)` : "(offline demo agent)"} reads your idea, chooses every detail of the look, and writes a personality, a secret and a goal.</p>
        <textarea id="stIdea" rows="3" maxlength="300" placeholder="e.g. a grumpy pirate chef who secretly writes poetry">${esc(opts._idea || "")}</textarea>
        <div class="ex-chips">${EX.map(e => `<button data-ex="${esc(e)}">${esc(e)}</button>`).join("")}</div>
        <div class="st-ai-go"><button class="btn ai" id="stGen">✨ Create my character</button></div>
        <div id="stWork"></div>
        <div id="stResult">${lastAI ? resultHTML(lastAI) : ""}</div>`;
    }
    function resultHTML(r) {
      return `<div class="st-result">
        <div class="st-r-h"><b>${esc(r.name)}</b><span class="role">${esc(r.role)}</span>${r._src === "offline" && Brain.mode === "llm" ? `<span class="warn-s">⚠ LLM failed, used offline agent</span>` : ""}</div>
        <p>${esc(r.personality)}</p>
        <p class="secret">🔒 ${esc(r.secret)}</p><p class="goal">🎯 ${esc(r.goal)}</p>
        ${r.design_notes.length ? `<div class="st-notes"><small>DESIGN NOTES FROM THE AGENT</small><ul>${r.design_notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul></div>` : ""}
        <div class="st-r-btns"><button class="btn ghost btn-sm" data-tweak>✋ Tweak by hand</button><button class="btn ghost btn-sm" data-again>🔁 Another take</button></div>
      </div>`;
    }

    const pane = host.querySelector("#stPane");
    function drawPane() {
      host.querySelectorAll("[data-mode]").forEach(b => b.classList.toggle("on", b.dataset.mode === mode));
      const sc = pane.querySelector(".st-groups") ? pane.querySelector(".st-groups").scrollTop : 0;
      pane.innerHTML = mode === "manual" ? manualHTML() : aiHTML();
      const g = pane.querySelector(".st-groups"); if (g) g.scrollTop = sc;
    }

    async function generate() {
      const ideaEl = pane.querySelector("#stIdea");
      const idea = ideaEl.value.trim();
      if (!idea) { ideaEl.focus(); ideaEl.classList.add("shake"); setTimeout(() => ideaEl.classList.remove("shake"), 500); return; }
      opts._idea = idea;
      const btn = pane.querySelector("#stGen"); btn.disabled = true; btn.textContent = "Designing…";
      pane.querySelector("#stResult").innerHTML = "";
      pupEl.classList.add("st-thinking");
      const r = await UI.aiRun(pane.querySelector("#stWork"), ["Reading your idea", "Choosing a look", "Writing a personality", "Giving them a secret"], aiCharacter(idea));
      pupEl.classList.remove("st-thinking");
      if (mode !== "ai" || !host.isConnected) return;
      lastAI = r;
      c = Object.assign({}, c, { name: r.name, role: r.role, personality: r.personality, secret: r.secret, goal: r.goal, look: r.look });
      delete c.portrait;
      const work = pane.querySelector("#stWork .ai-work");
      if (work) { work.querySelectorAll("li").forEach(li => { li.className = "done"; li.querySelector("i").textContent = "✓"; }); }
      pane.querySelector("#stResult").innerHTML = resultHTML(r);
      btn.disabled = false; btn.textContent = "✨ Create another";
      drawPreview(true);
      Puppet.emotion(pupEl, "happy");
    }

    async function portrait() {
      const b = host.querySelector("#stPortraitBtn"); if (!b) return;
      b.disabled = true; b.textContent = "🎨 Painting…";
      const l = c.look;
      const url = await Brain.image(`Friendly 2D cartoon character portrait, bold clean outlines, vibrant colours, soft studio lighting, simple gradient background. ${c.name}, a ${c.role}. ${c.personality} Species: ${l.species}. Wearing a ${nice(l.outfit).toLowerCase()} in ${l.outfitColor}${l.acc !== "none" ? `, with ${nice(l.acc).toLowerCase()}` : ""}${l.hair !== "none" && l.species === "human" ? `, ${l.hair} hair` : ""}. No text.`);
      b.disabled = false; b.textContent = "🎨 AI portrait";
      if (!url) { b.textContent = "🎨 Portrait failed, retry"; return; }
      c.portrait = (await shrink(url, 320)) || url;
      drawPreview(false);
    }

    host.onclick = e => {
      const t = e.target;
      const m = t.closest("[data-mode]"); if (m) { mode = m.dataset.mode; drawPane(); return; }
      const o = t.closest("[data-k]");
      if (o) {
        const k = o.dataset.k, v = o.dataset.v;
        c.look[k] = v;
        if (k === "species") c.look = fixLook(c.look);
        drawPane(); drawPreview(false);
        if (k === "acc" || k === "outfit" || k === "species") Puppet.gesture(pupEl, "jump", 700);
        return;
      }
      const em = t.closest("[data-emo]"); if (em) { Puppet.emotion(pupEl, em.dataset.emo); return; }
      const g = t.closest("[data-g]");
      if (g) { if (g.dataset.g === "talk") { Puppet.talk(pupEl, 1800); UI.speak(`Hi, I'm ${c.name}. ${c.personality}`, 2, { force: true }); } else Puppet.gesture(pupEl, g.dataset.g, 2000); return; }
      if (t.closest("[data-bd]")) { bd++; drawBackdrop(); return; }
      if (t.closest("[data-rlook]")) { c.look = fixLook(Puppet.randomLook()); delete c.portrait; drawPane(); drawPreview(true); return; }
      if (t.closest("[data-rpers]")) { Object.assign(c, randomPersona()); drawPane(); drawPreview(false); return; }
      const ex = t.closest("[data-ex]"); if (ex) { pane.querySelector("#stIdea").value = ex.dataset.ex; return; }
      if (t.closest("#stGen")) { generate(); return; }
      if (t.closest("[data-tweak]")) { mode = "manual"; drawPane(); return; }
      if (t.closest("[data-again]")) { generate(); return; }
      if (t.closest("#stPortraitBtn")) { portrait(); return; }
      if (t.closest("#stNew")) { c = newChar(); c.look = fixLook(c.look); lastAI = null; opts._idea = ""; drawPane(); drawPreview(true); return; }
      if (t.closest("#stCancel")) { opts.onCancel(); return; }
      if (t.closest("#stSave")) {
        if (!clip(c.name, 24)) { mode = "manual"; drawPane(); pane.querySelector('[data-f="name"]').focus(); return; }
        const out = { ...c, name: clip(c.name, 24), role: clip(c.role, 28) || "Wanderer", personality: clip(c.personality, 220) || rand(TRAITS), secret: clip(c.secret, 220) || rand(SECRETS), goal: clip(c.goal, 160) || rand(GOALS), look: fixLook(c.look), custom: true };
        delete out.design_notes; delete out._src;
        opts.onSave(out);
      }
    };
    host.oninput = e => {
      const f = e.target.dataset && e.target.dataset.f;
      if (f) { c[f] = e.target.value; if (f === "name" || f === "role") { host.querySelector("#stNm").textContent = c.name || "Unnamed"; host.querySelector("#stRl").textContent = c.role; } }
    };
    host.onkeydown = e => { if (e.target.id === "stIdea" && e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); };

    drawBackdrop(); drawPane(); drawPreview(true);
  }

  /* =========================================================
     SCENE EDITOR (page + modal)
     ========================================================= */
  const SAMPLE = ["kit", "priya", "bolt"];
  function sceneEditor(host, opts) {
    let s = opts.initial ? clone(opts.initial) : { name: "My scene", base: "office", time: "day", weather: "clear", desc: Scenes.BASES[0].desc };
    const isPreset = !!(opts.initial && opts.initial.id && !opts.initial.custom && PLAY.scenes.some(p => p.id === opts.initial.id));
    if (isPreset) { delete s.id; s.name += " (remix)"; }
    let mode = opts.mode || "manual", lastAI = null, art = null;

    host.innerHTML = `
      <div class="st-ed scene ${opts.compact ? "compact" : ""}">
        <div class="st-prev">
          <div class="st-scene" id="ssStage">${SAMPLE.map((id, i) => `<div class="ss-pup" style="left:${18 + i * 30}%"></div>`).join("")}
            <div class="st-nameplate"><b id="ssNm"></b><small id="ssMeta"></small></div></div>
          <p class="muted st-sdesc" id="ssDesc"></p>
          ${Brain.images ? `<button class="btn ghost btn-sm" id="ssArtBtn">🎨 AI concept art</button><img class="st-art" id="ssArt" alt="" hidden>` : ""}
        </div>
        <div class="st-ctrl">
          <div class="tabs st-modes"><button data-mode="manual">✋ Manual</button><button data-mode="ai">✨ Describe it (AI)</button></div>
          <div class="st-pane" id="ssPane"></div>
          <div class="st-foot">
            ${opts.onCancel ? `<button class="btn ghost btn-sm" id="ssCancel">Cancel</button>` : ""}
            <button class="btn" id="ssSave">💾 Save scene</button>
          </div>
        </div>
      </div>`;
    const stage = host.querySelector("#ssStage");
    const pups = [...host.querySelectorAll(".ss-pup")];
    pups.forEach((el, i) => { Puppet.mount(el, PLAY.characters.find(c => c.id === SAMPLE[i])); });
    const drawPreview = pop => {
      Scenes.mount(stage, s);
      host.querySelector("#ssNm").textContent = s.name || "Untitled scene";
      host.querySelector("#ssMeta").textContent = `${(Scenes.BASES.find(b => b.id === s.base) || {}).name} · ${s.time} · ${s.weather}`;
      host.querySelector("#ssDesc").textContent = s.desc || "";
      if (pop) { stage.classList.remove("ss-flash"); void stage.offsetWidth; stage.classList.add("ss-flash"); pups.forEach((p, i) => setTimeout(() => Puppet.gesture(p, ["wave", "jump", "nod"][i], 1600), 300 + i * 200)); }
    };

    const EX = ["a cosy office on a rainy night", "an enchanted forest full of fireflies", "a spaceship bridge under attack", "a beach party at sunset", "a spooky haunted manor in the fog", "a frozen mountain pass in a blizzard", "a tense job interview in a glass boardroom", "a desert outpost at dusk"];
    function manualHTML() {
      return `
        <div class="st-grp"><div class="st-gh">Place</div><div class="st-bases">${Scenes.BASES.map(b => `<button class="sb ${s.base === b.id ? "on" : ""}" data-b="${b.id}"><div class="sb-th">${Scenes.svg({ base: b.id, time: s.time })}</div><span>${b.icon} ${esc(b.name)}</span></button>`).join("")}</div></div>
        <div class="st-grp"><div class="st-gh">Time of day</div><div class="st-opts">${Scenes.TIMES.map(t => `<button class="chip ${s.time === t ? "on" : ""}" data-t="${t}">${{ day: "☀️ Day", sunset: "🌇 Sunset", night: "🌙 Night" }[t]}</button>`).join("")}</div></div>
        <div class="st-grp"><div class="st-gh">Weather & mood</div><div class="st-opts">${Scenes.WEATHER.map(w => `<button class="chip ${s.weather === w ? "on" : ""}" data-w="${w}">${{ clear: "✨ Clear", rain: "🌧️ Rain", snow: "❄️ Snow", fog: "🌫️ Fog", fireflies: "🪲 Fireflies", embers: "🔥 Embers" }[w]}</button>`).join("")}</div></div>
        <div class="st-fields">
          <label>Scene name</label><input data-f="name" maxlength="32" value="${esc(s.name)}">
          <label>Description <small>agents read this to understand where they are</small></label><textarea data-f="desc" rows="2" maxlength="240">${esc(s.desc)}</textarea>
        </div>`;
    }
    function aiHTML() {
      return `
        <p class="muted st-lead">Describe a place. An AI set-design agent ${Brain.mode === "llm" ? `(<b>${esc(Brain.model)}</b>)` : "(offline demo agent)"} picks the location, the time of day and the weather, and writes a description the actors can use.</p>
        <textarea id="ssIdea" rows="3" maxlength="300" placeholder="e.g. an enchanted forest full of fireflies">${esc(opts._idea || "")}</textarea>
        <div class="ex-chips">${EX.map(e => `<button data-ex="${esc(e)}">${esc(e)}</button>`).join("")}</div>
        <div class="st-ai-go"><button class="btn ai" id="ssGen">✨ Build my scene</button></div>
        <div id="ssWork"></div>
        <div id="ssResult">${lastAI ? resultHTML(lastAI) : ""}</div>`;
    }
    function resultHTML(r) {
      return `<div class="st-result"><div class="st-r-h"><b>${esc(r.name)}</b><span class="role">${esc(r.base)} · ${esc(r.time)} · ${esc(r.weather)}</span>${r._src === "offline" && Brain.mode === "llm" ? `<span class="warn-s">⚠ LLM failed, used offline agent</span>` : ""}</div>
        <p>${esc(r.desc)}</p>
        ${r.design_notes.length ? `<div class="st-notes"><small>DESIGN NOTES FROM THE AGENT</small><ul>${r.design_notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul></div>` : ""}
        <div class="st-r-btns"><button class="btn ghost btn-sm" data-tweak>✋ Tweak by hand</button><button class="btn ghost btn-sm" data-again>🔁 Another take</button></div></div>`;
    }
    const pane = host.querySelector("#ssPane");
    const drawPane = () => {
      host.querySelectorAll("[data-mode]").forEach(b => b.classList.toggle("on", b.dataset.mode === mode));
      pane.innerHTML = mode === "manual" ? manualHTML() : aiHTML();
    };
    async function generate() {
      const ideaEl = pane.querySelector("#ssIdea"), idea = ideaEl.value.trim();
      if (!idea) { ideaEl.focus(); return; }
      opts._idea = idea;
      const btn = pane.querySelector("#ssGen"); btn.disabled = true; btn.textContent = "Building…";
      pane.querySelector("#ssResult").innerHTML = "";
      const r = await UI.aiRun(pane.querySelector("#ssWork"), ["Reading your idea", "Choosing the location", "Setting light & weather", "Writing the description"], aiScene(idea));
      if (mode !== "ai" || !host.isConnected) return;
      lastAI = r;
      s = Object.assign({}, s, { name: r.name, base: r.base, time: r.time, weather: r.weather, desc: r.desc });
      const work = pane.querySelector("#ssWork .ai-work");
      if (work) work.querySelectorAll("li").forEach(li => { li.className = "done"; li.querySelector("i").textContent = "✓"; });
      pane.querySelector("#ssResult").innerHTML = resultHTML(r);
      btn.disabled = false; btn.textContent = "✨ Build another";
      drawPreview(true);
    }
    async function conceptArt() {
      const b = host.querySelector("#ssArtBtn"); b.disabled = true; b.textContent = "🎨 Painting…";
      const url = await Brain.image(`Wide cinematic illustration of a scene for an animated film, vibrant stylised 2D art, no characters, no text: ${s.name}. ${s.desc} Time of day: ${s.time}. Weather: ${s.weather}.`);
      b.disabled = false; b.textContent = "🎨 AI concept art";
      if (!url) { b.textContent = "🎨 Art failed, retry"; return; }
      art = url; const im = host.querySelector("#ssArt"); im.src = url; im.hidden = false;
    }
    host.onclick = e => {
      const t = e.target;
      const m = t.closest("[data-mode]"); if (m) { mode = m.dataset.mode; drawPane(); return; }
      const b = t.closest("[data-b]"); if (b) { const B = Scenes.BASES.find(x => x.id === b.dataset.b); const wasDefault = !s.desc || Scenes.BASES.some(x => x.desc === s.desc); s.base = B.id; if (wasDefault) s.desc = B.desc; if (/^My scene|^Untitled/.test(s.name) || Scenes.BASES.some(x => x.name === s.name)) s.name = B.name; drawPane(); drawPreview(true); return; }
      const tm = t.closest("[data-t]"); if (tm) { s.time = tm.dataset.t; drawPane(); drawPreview(false); return; }
      const w = t.closest("[data-w]"); if (w) { s.weather = w.dataset.w; drawPane(); drawPreview(false); return; }
      const ex = t.closest("[data-ex]"); if (ex) { pane.querySelector("#ssIdea").value = ex.dataset.ex; return; }
      if (t.closest("#ssGen") || t.closest("[data-again]")) { generate(); return; }
      if (t.closest("[data-tweak]")) { mode = "manual"; drawPane(); return; }
      if (t.closest("#ssArtBtn")) { conceptArt(); return; }
      if (t.closest("#ssCancel")) { opts.onCancel(); return; }
      if (t.closest("#ssSave")) {
        const out = { ...s, name: clip(s.name, 32) || "My scene", desc: clip(s.desc, 240), custom: true };
        delete out.design_notes; delete out._src;
        opts.onSave(out);
      }
    };
    host.oninput = e => { const f = e.target.dataset && e.target.dataset.f; if (f) { s[f] = e.target.value; host.querySelector("#ssNm").textContent = s.name; host.querySelector("#ssDesc").textContent = s.desc; } };
    drawPane(); drawPreview(true);
  }

  /* =========================================================
     MODALS
     ========================================================= */
  function characterModal(o) {
    const d = UI.modal(`<span class="lm">Studio</span><h3>Create a character</h3><div id="stModalBody"></div>`, d => {
      charEditor(d.querySelector("#stModalBody"), { initial: o.initial, compact: true, onCancel: () => d.close(), onSave: c => { d.close(); o.onSave(c); } });
    }, "st-modal");
    d.style.setProperty("--c", C);
    return d;
  }
  function sceneModal(o) {
    const d = UI.modal(`<span class="lm">Studio</span><h3>Create a scene</h3><div id="ssModalBody"></div>`, d => {
      sceneEditor(d.querySelector("#ssModalBody"), { initial: o.initial, compact: true, onCancel: () => d.close(), onSave: s => { d.close(); o.onSave(s); } });
    }, "st-modal");
    d.style.setProperty("--c", C);
    return d;
  }

  /* =========================================================
     STUDIO PAGE
     ========================================================= */
  function toast(msg) {
    let t = document.querySelector(".st-toast");
    if (!t) { t = document.createElement("div"); t.className = "st-toast"; document.body.appendChild(t); }
    t.innerHTML = msg; t.classList.remove("on"); void t.offsetWidth; t.classList.add("on");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 4200);
  }
  const USE = `<span class="st-use">Use in <a href="#film">🎬 Film</a><a href="#game">🎮 Games</a><a href="#grow">🎓 Interview</a></span>`;

  function start(sub) {
    UI.steps(null);
    const tab = sub === "scenes" ? "scenes" : "chars";
    UI.app().innerHTML = `
      <div class="st-head">
        <div><span class="kicker" style="color:${C}">✨ Studio</span><h2>${tab === "chars" ? "Create characters" : "Create scenes"}</h2>
        <p class="muted">${tab === "chars" ? "Build a character two ways: pick every detail by hand, or describe an idea and watch an AI agent design it. Every character you save can act in films, play games and sit on interview panels." : "Build the world your agents live in: an office, a forest, a starship… pick it by hand or describe it and let an AI set-design agent build it."}</p></div>
        <div class="tabs st-pagetabs"><a href="#studio" class="${tab === "chars" ? "on" : ""}">🎭 Characters</a><a href="#studio/scenes" class="${tab === "scenes" ? "on" : ""}">🏞️ Scenes</a></div>
      </div>
      <div class="card st-editor-card" id="stEditor"></div>
      <section class="st-sec"><div class="st-sec-h"><h3 id="stMineH"></h3>${USE}</div><div id="stMine"></div></section>
      <section class="st-sec"><div class="st-sec-h"><h3>${tab === "chars" ? "Starter cast" : "Starter scenes"}</h3><span class="muted">Remix any of these into your own.</span></div><div id="stPresets"></div></section>`;
    tab === "chars" ? charsPage() : scenesPage();
  }

  function charsPage(edit, mode) {
    const ed = $("#stEditor");
    charEditor(ed, {
      initial: edit, mode,
      onSave: c => {
        const saved = UI.Lib.saveChar(c);
        toast(`✅ <b>${esc(saved.name)}</b> saved. They now appear in every cast picker. ${USE}`);
        charsPage(null, "manual");
      }
    });
    const mine = UI.Lib.chars().filter(c => c.custom);
    $("#stMineH").textContent = `Your characters (${mine.length})`;
    const card = (c, own) => `<div class="st-card" data-id="${esc(c.id)}">
      <div class="st-card-fig">${c.portrait ? `<img src="${c.portrait}" alt="">` : ""}<div class="st-card-pup"></div></div>
      <b>${esc(c.name)}</b><span class="role">${esc(c.role)}</span><p>${esc(c.personality)}</p>
      <div class="st-card-btns">${own ? `<button class="btn ghost btn-sm" data-edit>✏️ Edit</button><button class="btn ghost btn-sm" data-del>🗑️</button>` : `<button class="btn ghost btn-sm" data-remix>🎨 Remix</button>`}</div></div>`;
    $("#stMine").innerHTML = mine.length ? `<div class="st-cards">${mine.map(c => card(c, true)).join("")}</div>` : `<div class="st-empty">No characters yet. Make one above: try <b>✨ Describe it</b> and type “a nervous robot intern on its first day”.</div>`;
    $("#stPresets").innerHTML = `<div class="st-cards">${PLAY.characters.map(c => card(c, false)).join("")}</div>`;
    document.querySelectorAll(".st-card").forEach(el => Puppet.mount(el.querySelector(".st-card-pup"), UI.Lib.char(el.dataset.id)));
    const onCard = e => {
      const card = e.target.closest(".st-card"); if (!card) return;
      const c = UI.Lib.char(card.dataset.id);
      if (e.target.closest("[data-del]")) { if (confirm(`Delete ${c.name}?`)) { UI.Lib.removeChar(c.id); charsPage(); } return; }
      if (e.target.closest("[data-edit]") || e.target.closest("[data-remix]")) { charsPage(c, "manual"); $("#stEditor").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      const p = card.querySelector(".st-card-pup"); Puppet.gesture(p, "wave", 1600);
    };
    $("#stMine").onclick = onCard; $("#stPresets").onclick = onCard;
  }

  function scenesPage(edit, mode) {
    sceneEditor($("#stEditor"), {
      initial: edit, mode,
      onSave: s => { const saved = UI.Lib.saveScene(s); toast(`✅ Scene <b>${esc(saved.name)}</b> saved. Pick it when you make a film or an interview. ${USE}`); scenesPage(null, "manual"); }
    });
    const mine = UI.Lib.scenes().filter(s => s.custom);
    $("#stMineH").textContent = `Your scenes (${mine.length})`;
    const card = (s, own) => `<div class="st-scard" data-id="${esc(s.id)}"><div class="st-scard-th">${Scenes.svg(s)}</div>
      <div class="st-scard-b"><b>${esc(s.name)}</b><small>${esc(s.desc || "")}</small>
      <div class="st-card-btns">${own ? `<button class="btn ghost btn-sm" data-edit>✏️ Edit</button><button class="btn ghost btn-sm" data-del>🗑️</button>` : `<button class="btn ghost btn-sm" data-remix>🎨 Remix</button>`}</div></div></div>`;
    $("#stMine").innerHTML = mine.length ? `<div class="st-scards">${mine.map(s => card(s, true)).join("")}</div>` : `<div class="st-empty">No scenes yet. Try <b>✨ Describe it</b> with “an enchanted forest full of fireflies”.</div>`;
    $("#stPresets").innerHTML = `<div class="st-scards">${PLAY.scenes.map(s => card(s, false)).join("")}</div>`;
    const onCard = e => {
      const card = e.target.closest(".st-scard"); if (!card) return;
      const s = UI.Lib.scene(card.dataset.id);
      if (e.target.closest("[data-del]")) { if (confirm(`Delete ${s.name}?`)) { UI.Lib.removeScene(s.id); scenesPage(); } return; }
      if (e.target.closest("[data-edit]") || e.target.closest("[data-remix]")) { scenesPage(s, "manual"); $("#stEditor").scrollIntoView({ behavior: "smooth", block: "start" }); }
    };
    $("#stMine").onclick = onCard; $("#stPresets").onclick = onCard;
  }

  return { start, characterModal, sceneModal, aiCharacter, aiScene };
})();

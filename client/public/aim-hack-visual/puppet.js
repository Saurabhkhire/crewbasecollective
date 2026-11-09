/* =========================================================
   Puppet: parametric, animated SVG characters.
   A character = { name, role, ..., look: { species, skin, hair, hairColor, eyes, facial,
                   outfit, outfitColor, acc, build, badge } }
   Missing look fields are derived from the name, so any character renders.
   API:
     Puppet.svg(c)               → SVG markup string
     Puppet.mount(el, c)         → renders into el (adds .pup)
     Puppet.emotion(el, e) / talk(el, ms) / stopTalk(el) / gesture(el, g, ms) / walk(el, on) / face(el, dir)
     Puppet.LOOK                 → option lists for every look field (for editors / LLM prompts)
     Puppet.randomLook(seed?)    → a random complete look
     Puppet.fullLook(c)          → c.look with every field filled in
     Puppet.toImage(c, h)        → Promise<HTMLImageElement> (for canvas games)
     Puppet.face(...)            → flip direction
   ========================================================= */
window.Puppet = (function () {
  const LOOK = {
    species: ["human", "robot", "alien", "cat", "bear"],
    skin: ["#ffe0c7", "#f6c9a4", "#e8b08a", "#d29a6c", "#b97a56", "#8d5a3b", "#6b4229", "#4a2c1d"],
    alienSkin: ["#8fe3a1", "#9ad4ff", "#c9a7ff", "#ffb3d9"],
    robotSkin: ["#c9d3e0", "#9fb0c4", "#e6c27a", "#7f8ea3"],
    furSkin: ["#f2b36b", "#9b9b9b", "#3b3b3b", "#f4efe6", "#8a5a3b"],
    hair: ["none", "buzz", "short", "side", "curly", "afro", "long", "bob", "bun", "ponytail", "spiky", "mohawk"],
    hairColor: ["#1d1410", "#3d2618", "#6b3e22", "#a8642f", "#d9a441", "#f1d27a", "#b5462f", "#e8e8e8", "#7a7a7a", "#6b4fa0", "#2f7dd1", "#ff5fa2"],
    eyes: ["normal", "big", "sleepy"],
    eyeColor: ["#2a1d14", "#3f6db3", "#3d8a4f", "#6b4a2e"],
    facial: ["none", "stubble", "mustache", "beard"],
    outfit: ["tshirt", "hoodie", "suit", "dress", "labcoat", "armor", "uniform", "sweater", "overalls", "robe", "jacket"],
    outfitColor: ["#ff4fa3", "#3ee6ff", "#b6ff5c", "#ffc857", "#c48bff", "#ff9f43", "#5c8dff", "#4fd1c5", "#ff6b6b", "#2d3142", "#f2f2f2", "#8b5e3c"],
    acc: ["none", "glasses", "sunglasses", "cap", "tophat", "crown", "headset", "beanie", "eyepatch", "wizardhat", "helmet", "flower", "earrings"],
    build: ["slim", "regular", "broad"]
  };
  const PANTS = ["#23283d", "#3b2f4a", "#1f3a3a", "#4a3326", "#2d2d2d", "#30476b"];
  const INK = "#1b1530";

  const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h; };
  const pick = (a, n) => a[n % a.length];
  const shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16);
    const f = v => Math.max(0, Math.min(255, Math.round(v + 255 * amt)));
    return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, "0")).join("");
  };

  function deriveLook(c) {
    const h = hash((c.name || "") + "|" + (c.role || ""));
    const txt = `${c.role || ""} ${c.name || ""}`;
    const species = /android|robot|\bbot\b|cyborg|droid|unit-|bolt/i.test(txt) ? "robot" : /alien|envoy/i.test(txt) ? "alien" : "human";
    return {
      species,
      skin: pick(species === "robot" ? LOOK.robotSkin : species === "alien" ? LOOK.alienSkin : LOOK.skin, h),
      hair: pick(LOOK.hair.slice(1), h >>> 3),
      hairColor: pick(LOOK.hairColor, h >>> 5),
      eyes: "normal",
      eyeColor: pick(LOOK.eyeColor, h >>> 7),
      facial: (h >>> 9) % 5 === 0 ? pick(LOOK.facial.slice(1), h >>> 11) : "none",
      outfit: pick(LOOK.outfit, h >>> 13),
      outfitColor: c.color || pick(LOOK.outfitColor, h >>> 15),
      acc: (h >>> 17) % 3 === 0 ? pick(LOOK.acc.slice(1), h >>> 19) : "none",
      build: pick(LOOK.build, h >>> 21),
      badge: ""
    };
  }
  function fullLook(c) {
    const base = deriveLook(c || {});
    const l = Object.assign({}, base, (c && c.look) || {});
    for (const k of ["species", "hair", "eyes", "facial", "outfit", "acc", "build"]) if (!LOOK[k].includes(l[k])) l[k] = base[k];
    if (!/^#[0-9a-f]{6}$/i.test(l.skin || "")) l.skin = base.skin;
    if (!/^#[0-9a-f]{6}$/i.test(l.hairColor || "")) l.hairColor = base.hairColor;
    if (!/^#[0-9a-f]{6}$/i.test(l.outfitColor || "")) l.outfitColor = base.outfitColor;
    if (!/^#[0-9a-f]{6}$/i.test(l.eyeColor || "")) l.eyeColor = base.eyeColor;
    return l;
  }
  function randomLook(seed) {
    const r = seed == null ? () => Math.random() : (() => { let s = hash(seed); return () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296); })();
    const R = a => a[Math.floor(r() * a.length)];
    const species = r() < 0.78 ? "human" : R(["robot", "alien", "cat", "bear"]);
    return {
      species,
      skin: R(species === "robot" ? LOOK.robotSkin : species === "alien" ? LOOK.alienSkin : species === "human" ? LOOK.skin : LOOK.furSkin),
      hair: species === "human" || species === "alien" ? R(LOOK.hair) : "none",
      hairColor: R(LOOK.hairColor), eyes: R(LOOK.eyes), eyeColor: R(LOOK.eyeColor),
      facial: species === "human" && r() < 0.25 ? R(LOOK.facial.slice(1)) : "none",
      outfit: R(LOOK.outfit), outfitColor: R(LOOK.outfitColor),
      acc: r() < 0.45 ? R(LOOK.acc.slice(1)) : "none", build: R(LOOK.build), badge: ""
    };
  }

  /* ---------- face parts that change with emotion ---------- */
  const MOUTH = {
    neutral: "M53 75 Q60 78 67 75", happy: "M50 72 Q60 85 70 72", angry: "M52 79 Q60 72 68 79", sad: "M52 80 Q60 73 68 80",
    scared: "M54 77 Q60 71 66 77 Q60 81 54 77", shocked: "M57 76 Q60 75 63 76", sly: "M51 76 Q63 80 70 69",
    calm: "M53 74 Q60 79 67 74", determined: "M52 76 L68 76", thinking: "M54 77 Q60 75 66 78"
  };
  const BROW = {
    neutral: [0, 0, 0, 0], happy: [-4, -3, 4, -3], angry: [18, 3, -18, 3], sad: [-15, 0, 15, 0], scared: [-10, -6, 10, -6],
    shocked: [0, -8, 0, -8], sly: [0, -6, -14, 1], calm: [0, -1, 0, -1], determined: [13, 2, -13, 2], thinking: [-8, -4, 5, 1]
  };
  const TILT = { sad: 7, sly: -6, thinking: -8, scared: 3, shocked: -3, happy: -2 };
  const EYE_RY = { shocked: 1.35, scared: 1.25, angry: 0.7, determined: 0.8, sly: 0.6, happy: 0.75, calm: 0.6, sad: 0.85 };

  /* ---------- drawing ---------- */
  function hairBack(l) {
    const c = l.hairColor;
    if (l.hair === "long") return `<path d="M27 56 Q22 112 38 122 L82 122 Q98 112 93 56 Z" fill="${c}" stroke="${INK}" stroke-width="2"/>`;
    if (l.hair === "bob") return `<path d="M27 54 Q24 92 36 96 L84 96 Q96 92 93 54 Z" fill="${c}" stroke="${INK}" stroke-width="2"/>`;
    if (l.hair === "ponytail") return `<path d="M86 44 Q112 52 100 96 Q96 70 84 60 Z" fill="${c}" stroke="${INK}" stroke-width="2"/>`;
    if (l.hair === "afro") return `<circle cx="60" cy="48" r="40" fill="${c}" stroke="${INK}" stroke-width="2"/>`;
    return "";
  }
  function hairFront(l) {
    const c = l.hairColor, s = `fill="${c}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"`;
    switch (l.hair) {
      case "buzz": return `<path d="M31 52 Q32 26 60 26 Q88 26 89 52 Q76 40 60 40 Q44 40 31 52Z" ${s} opacity=".9"/>`;
      case "short": return `<path d="M29 56 Q30 22 60 22 Q90 22 91 56 Q86 38 72 36 Q58 44 40 40 Q32 46 29 56Z" ${s}/>`;
      case "side": return `<path d="M29 58 Q28 20 62 21 Q92 22 91 56 Q84 34 68 33 Q50 46 34 44 Q31 50 29 58Z" ${s}/><path d="M66 24 Q60 34 50 40" stroke="${shade(c, -0.15)}" stroke-width="2" fill="none"/>`;
      case "curly": return `<g ${s}><circle cx="36" cy="40" r="10"/><circle cx="48" cy="30" r="11"/><circle cx="62" cy="27" r="11"/><circle cx="76" cy="31" r="11"/><circle cx="86" cy="42" r="9"/></g>`;
      case "afro": return `<path d="M30 52 Q36 34 60 34 Q84 34 90 52" fill="${c}" stroke="none"/>`;
      case "long": case "bob": return `<path d="M29 58 Q29 22 60 22 Q91 22 91 58 Q84 36 60 36 Q38 36 29 58Z" ${s}/>`;
      case "bun": return `<circle cx="60" cy="18" r="12" ${s}/><path d="M30 52 Q31 25 60 25 Q89 25 90 52 Q76 38 60 38 Q44 38 30 52Z" ${s}/>`;
      case "ponytail": return `<path d="M30 54 Q31 24 60 24 Q89 24 90 54 Q78 38 60 38 Q42 38 30 54Z" ${s}/>`;
      case "spiky": return `<path d="M30 52 L32 28 L42 36 L46 18 L56 32 L62 14 L68 32 L77 18 L80 36 L89 28 L90 52 Q76 40 60 40 Q44 40 30 52Z" ${s}/>`;
      case "mohawk": return `<path d="M52 40 L50 14 L58 22 L60 8 L64 22 L70 14 L68 40 Z" ${s}/>`;
      default: return "";
    }
  }
  function headShape(l) {
    const sk = l.skin, dk = shade(sk, -0.12), s = `stroke="${INK}" stroke-width="2.2"`;
    if (l.species === "robot") return `<rect x="30" y="27" width="60" height="60" rx="16" fill="${sk}" ${s}/><rect x="30" y="27" width="60" height="22" rx="16" fill="#fff" opacity=".18"/><rect x="37" y="46" width="46" height="22" rx="10" fill="#0b1630"/><circle cx="27" cy="58" r="5" fill="${dk}" ${s}/><circle cx="93" cy="58" r="5" fill="${dk}" ${s}/>`;
    const ears = l.species === "cat"
      ? `<path d="M32 44 L30 14 L54 32 Z" fill="${sk}" ${s}/><path d="M36 38 L35 22 L48 32 Z" fill="#ff9fb5"/><path d="M88 44 L90 14 L66 32 Z" fill="${sk}" ${s}/><path d="M84 38 L85 22 L72 32 Z" fill="#ff9fb5"/>`
      : l.species === "bear" ? `<circle cx="34" cy="32" r="11" fill="${sk}" ${s}/><circle cx="34" cy="32" r="5" fill="${dk}"/><circle cx="86" cy="32" r="11" fill="${sk}" ${s}/><circle cx="86" cy="32" r="5" fill="${dk}"/>`
      : l.species === "alien" ? `<line x1="46" y1="30" x2="38" y2="10" stroke="${INK}" stroke-width="2"/><circle cx="38" cy="9" r="4" fill="${sk}" ${s}/><line x1="74" y1="30" x2="82" y2="10" stroke="${INK}" stroke-width="2"/><circle cx="82" cy="9" r="4" fill="${sk}" ${s}/>`
      : `<ellipse cx="30" cy="61" rx="5" ry="7" fill="${sk}" ${s}/><ellipse cx="90" cy="61" rx="5" ry="7" fill="${sk}" ${s}/>`;
    const face = l.species === "alien" ? `<ellipse cx="60" cy="58" rx="31" ry="32" fill="${sk}" ${s}/>` : `<circle cx="60" cy="58" r="30" fill="${sk}" ${s}/>`;
    const muzzle = l.species === "cat" || l.species === "bear" ? `<ellipse cx="60" cy="72" rx="13" ry="9" fill="${shade(sk, 0.18)}"/><path d="M57 66 L63 66 L60 70 Z" fill="${INK}"/>` : "";
    const whisk = l.species === "cat" ? `<g stroke="${INK}" stroke-width="1" opacity=".6"><line x1="44" y1="70" x2="30" y2="67"/><line x1="44" y1="73" x2="30" y2="75"/><line x1="76" y1="70" x2="90" y2="67"/><line x1="76" y1="73" x2="90" y2="75"/></g>` : "";
    return ears + face + `<ellipse cx="60" cy="44" rx="20" ry="9" fill="#fff" opacity=".12"/>` + muzzle + whisk;
  }
  function facial(l) {
    const c = l.hairColor;
    if (l.species !== "human" || l.facial === "none") return "";
    if (l.facial === "stubble") return `<path d="M38 70 Q60 96 82 70 Q78 86 60 88 Q42 86 38 70Z" fill="${c}" opacity=".28"/>`;
    if (l.facial === "mustache") return `<path d="M48 70 Q54 66 60 70 Q66 66 72 70 Q66 74 60 71 Q54 74 48 70Z" fill="${c}" stroke="${INK}" stroke-width="1.2"/>`;
    return `<path d="M33 62 Q34 92 60 94 Q86 92 87 62 Q80 80 70 80 L50 80 Q40 80 33 62Z" fill="${c}" stroke="${INK}" stroke-width="2"/>`;
  }
  function accessory(l) {
    const s = `stroke="${INK}" stroke-width="2"`;
    switch (l.acc) {
      case "glasses": return `<g fill="none" ${s}><circle cx="49" cy="58" r="8.5"/><circle cx="71" cy="58" r="8.5"/><line x1="57.5" y1="58" x2="62.5" y2="58"/></g>`;
      case "sunglasses": return `<g ${s}><rect x="38" y="51" width="19" height="12" rx="5" fill="#111"/><rect x="63" y="51" width="19" height="12" rx="5" fill="#111"/><line x1="57" y1="56" x2="63" y2="56"/></g><path d="M41 54 L47 54" stroke="#fff" opacity=".5" stroke-width="2"/>`;
      case "cap": return `<path d="M29 46 Q30 20 60 20 Q90 20 91 46 Z" fill="${l.outfitColor}" ${s}/><path d="M60 41 Q92 38 104 46 Q90 50 60 47Z" fill="${shade(l.outfitColor, -0.2)}" ${s}/>`;
      case "tophat": return `<rect x="38" y="2" width="44" height="30" rx="3" fill="#1a1a22" ${s}/><rect x="38" y="22" width="44" height="6" fill="${l.outfitColor}"/><rect x="26" y="29" width="68" height="7" rx="3" fill="#1a1a22" ${s}/>`;
      case "crown": return `<path d="M36 34 L38 12 L49 24 L60 8 L71 24 L82 12 L84 34 Z" fill="#ffd34d" ${s}/><circle cx="60" cy="20" r="3" fill="#ff4f6d"/>`;
      case "headset": return `<path d="M28 58 Q28 22 60 22 Q92 22 92 58" fill="none" stroke="#222" stroke-width="5"/><rect x="22" y="50" width="10" height="18" rx="4" fill="#333" ${s}/><rect x="88" y="50" width="10" height="18" rx="4" fill="#333" ${s}/><path d="M27 66 Q32 84 50 82" fill="none" stroke="#333" stroke-width="3"/><circle cx="51" cy="82" r="3" fill="#3ee6ff"/>`;
      case "beanie": return `<path d="M28 48 Q28 14 60 14 Q92 14 92 48 Z" fill="${l.outfitColor}" ${s}/><rect x="26" y="40" width="68" height="10" rx="5" fill="${shade(l.outfitColor, -0.18)}" ${s}/><circle cx="60" cy="12" r="6" fill="#fff" ${s}/>`;
      case "eyepatch": return `<line x1="30" y1="46" x2="90" y2="62" stroke="#111" stroke-width="2.5"/><ellipse cx="49" cy="58" rx="9" ry="8" fill="#111" ${s}/>`;
      case "wizardhat": return `<path d="M60 -14 L84 36 L36 36 Z" fill="${l.outfitColor}" ${s}/><rect x="24" y="32" width="72" height="8" rx="4" fill="${shade(l.outfitColor, -0.2)}" ${s}/><text x="62" y="26" font-size="10" text-anchor="middle">★</text>`;
      case "helmet": return `<circle cx="60" cy="58" r="40" fill="#bfe9ff" fill-opacity=".18" stroke="#dff4ff" stroke-width="3"/><path d="M34 34 Q46 22 60 22" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/>`;
      case "flower": return `<g transform="translate(82 30)"><circle r="5" cx="-6" fill="#ff7eb6"/><circle r="5" cx="6" fill="#ff7eb6"/><circle r="5" cy="-6" fill="#ff7eb6"/><circle r="5" cy="6" fill="#ff7eb6"/><circle r="4" fill="#ffd34d"/></g>`;
      case "earrings": return `<circle cx="30" cy="70" r="3.5" fill="#ffd34d" ${s}/><circle cx="90" cy="70" r="3.5" fill="#ffd34d" ${s}/>`;
      default: return "";
    }
  }
  function torso(l) {
    const c = l.outfitColor, dk = shade(c, -0.18), s = `stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"`;
    const w = l.build === "slim" ? -4 : l.build === "broad" ? 5 : 0;
    const body = `M${36 - w} 92 Q60 82 ${84 + w} 92 L${88 + w} 146 Q60 154 ${32 - w} 146 Z`;
    const dress = `M${36 - w} 92 Q60 82 ${84 + w} 92 L${96 + w} 160 Q60 168 ${24 - w} 160 Z`;
    let extra = "";
    switch (l.outfit) {
      case "hoodie": extra = `<path d="M44 90 Q60 104 76 90" fill="none" stroke="${dk}" stroke-width="5"/><rect x="46" y="122" width="28" height="14" rx="5" fill="${dk}"/><line x1="55" y1="96" x2="54" y2="112" stroke="#fff" stroke-width="2"/><line x1="65" y1="96" x2="66" y2="112" stroke="#fff" stroke-width="2"/>`; break;
      case "suit": extra = `<path d="M50 88 L60 112 L70 88 Z" fill="#fff"/><path d="M58 94 L62 94 L64 124 L60 130 L56 124 Z" fill="#c8303c"/><path d="M${36 - w} 92 L52 88 L60 122 L56 148 L${32 - w} 146Z" fill="${dk}" opacity=".55"/><path d="M${84 + w} 92 L68 88 L60 122 L64 148 L${88 + w} 146Z" fill="${dk}" opacity=".55"/>`; break;
      case "labcoat": extra = `<path d="M${36 - w} 92 L54 88 L58 152 L${30 - w} 150Z" fill="#f4f7ff" ${s}/><path d="M${84 + w} 92 L66 88 L62 152 L${90 + w} 150Z" fill="#f4f7ff" ${s}/><rect x="70" y="112" width="10" height="8" fill="none" stroke="#9ab" stroke-width="1.5"/>`; break;
      case "armor": extra = `<path d="M40 96 Q60 88 80 96 L78 124 Q60 132 42 124 Z" fill="#c9d1dc" ${s}/><path d="M48 104 L72 104 M46 114 L74 114" stroke="#8b96a6" stroke-width="2"/><circle cx="${33 - w}" cy="96" r="9" fill="#c9d1dc" ${s}/><circle cx="${87 + w}" cy="96" r="9" fill="#c9d1dc" ${s}/>`; break;
      case "uniform": extra = `<line x1="60" y1="90" x2="60" y2="148" stroke="${dk}" stroke-width="2"/><circle cx="60" cy="104" r="2" fill="#ffd34d"/><circle cx="60" cy="118" r="2" fill="#ffd34d"/><circle cx="60" cy="132" r="2" fill="#ffd34d"/><rect x="40" y="100" width="12" height="4" fill="#ffd34d"/><path d="M${36 - w} 92 L44 86 L48 94Z M${84 + w} 92 L76 86 L72 94Z" fill="#ffd34d"/>`; break;
      case "sweater": extra = `<path d="M44 89 Q60 99 76 89" fill="none" stroke="${dk}" stroke-width="5"/><path d="M38 116 L82 116 M37 124 L83 124" stroke="${shade(c, 0.2)}" stroke-width="3" stroke-dasharray="4 3"/>`; break;
      case "overalls": extra = `<path d="M42 110 L78 110 L82 146 Q60 152 38 146Z" fill="#30476b" ${s}/><line x1="46" y1="90" x2="46" y2="112" stroke="#30476b" stroke-width="5"/><line x1="74" y1="90" x2="74" y2="112" stroke="#30476b" stroke-width="5"/><circle cx="46" cy="112" r="2.5" fill="#ffd34d"/><circle cx="74" cy="112" r="2.5" fill="#ffd34d"/>`; break;
      case "robe": extra = `<path d="M50 88 L60 150 L70 88" fill="none" stroke="${shade(c, 0.25)}" stroke-width="3"/><path d="M${30 - w} 130 L${90 + w} 130" stroke="#ffd34d" stroke-width="3"/>`; break;
      case "jacket": extra = `<path d="M52 88 L60 100 L68 88" fill="#f2f2f2"/><line x1="60" y1="100" x2="60" y2="148" stroke="${INK}" stroke-width="2"/><path d="M${36 - w} 92 L52 88 L56 108 L${34 - w} 112Z" fill="${dk}"/><path d="M${84 + w} 92 L68 88 L64 108 L${86 + w} 112Z" fill="${dk}"/>`; break;
      case "dress": extra = `<path d="M${30 - w} 128 Q60 136 ${90 + w} 128" fill="none" stroke="${shade(c, 0.25)}" stroke-width="3"/><circle cx="60" cy="96" r="3" fill="#fff"/>`; break;
      default: extra = `<path d="M48 88 Q60 96 72 88" fill="none" stroke="${dk}" stroke-width="3"/>`;
    }
    const isDress = l.outfit === "dress" || l.outfit === "robe";
    const g = `<linearGradient id="og" x1="0" x2="1"><stop offset="0" stop-color="${shade(c, 0.08)}"/><stop offset="1" stop-color="${dk}"/></linearGradient>`;
    return { defs: g, html: `<path d="${isDress ? dress : body}" fill="url(#og)" ${s}/>${extra}`, isDress, w };
  }

  let uid = 0;
  function svg(c) {
    const l = fullLook(c);
    const id = "p" + (++uid);
    const t = torso(l);
    const sleeve = l.outfit === "armor" ? "#c9d1dc" : l.outfit === "labcoat" ? "#f4f7ff" : l.outfitColor;
    const hand = l.species === "robot" ? shade(l.skin, -0.1) : l.skin;
    const pants = l.outfit === "overalls" ? "#30476b" : pick(PANTS, hash(c.name || "") >>> 4);
    const s = `stroke="${INK}" stroke-width="2.2"`;
    const eyeR = l.eyes === "big" ? 6.2 : 4.6;
    const eyeFill = l.species === "robot" ? "#3ee6ff" : l.species === "alien" ? "#111" : l.eyeColor;
    const eyeRy = l.species === "alien" ? eyeR * 1.8 : eyeR * (l.eyes === "sleepy" ? 0.55 : 1.15);
    const brow = l.species === "robot" ? "#7d93ab" : l.species === "human" || l.species === "alien" ? shade(l.hairColor, -0.1) : shade(l.skin, -0.35);
    const ink = l.species === "robot" ? "#3ee6ff" : "#3a1020";
    const html = `<svg class="puppet" viewBox="0 -18 120 218" aria-hidden="true">
      <defs>${t.defs.replace(/id="og"/, `id="og${id}"`)}</defs>
      <ellipse class="shadow" cx="60" cy="195" rx="34" ry="5.5" fill="#000" opacity=".35"/>
      <g class="rig">
        ${t.isDress ? "" : `<g class="leg l"><rect x="45" y="138" width="13" height="52" rx="6" fill="${pants}" ${s}/><path d="M38 190 Q38 183 50 183 Q60 183 59 192 L38 192Z" fill="#1d1d24" ${s}/></g>
        <g class="leg r"><rect x="62" y="138" width="13" height="52" rx="6" fill="${pants}" ${s}/><path d="M61 192 Q60 183 70 183 Q82 183 82 190 L82 192Z" fill="#1d1d24" ${s}/></g>`}
        ${t.isDress ? `<g class="leg l"><rect x="47" y="150" width="11" height="40" rx="5" fill="${l.skin}" ${s}/><ellipse cx="51" cy="191" rx="9" ry="4" fill="#1d1d24"/></g><g class="leg r"><rect x="62" y="150" width="11" height="40" rx="5" fill="${l.skin}" ${s}/><ellipse cx="69" cy="191" rx="9" ry="4" fill="#1d1d24"/></g>` : ""}
        <g class="arm b"><rect x="${29 - t.w}" y="91" width="13" height="48" rx="6.5" fill="${shade(sleeve, -0.22)}" ${s}/><circle cx="${35.5 - t.w}" cy="141" r="7" fill="${hand}" ${s}/></g>
        <g class="torso">${t.html.replace("url(#og)", `url(#og${id})`)}${l.badge ? `<text x="74" y="124" font-size="13" text-anchor="middle">${l.badge}</text>` : ""}</g>
        <g class="arm f"><rect x="${78 + t.w}" y="91" width="13" height="48" rx="6.5" fill="${sleeve}" ${s}/><circle cx="${84.5 + t.w}" cy="141" r="7" fill="${hand}" ${s}/></g>
        <g class="head">
          ${l.species === "human" || l.species === "alien" ? hairBack(l) : ""}
          <rect x="53" y="80" width="14" height="12" fill="${shade(l.skin, -0.1)}" ${s}/>
          ${headShape(l)}
          ${l.species === "human" || l.species === "alien" ? hairFront(l) : ""}
          <g class="eyes">
            <ellipse class="eye" cx="49" cy="58" rx="${eyeR}" ry="${eyeRy}" data-ry="${eyeRy}" fill="${eyeFill}"/>
            <ellipse class="eye" cx="71" cy="58" rx="${eyeR}" ry="${eyeRy}" data-ry="${eyeRy}" fill="${eyeFill}"/>
            ${l.species === "robot" ? "" : `<circle cx="${50.8}" cy="55.5" r="${eyeR * 0.35}" fill="#fff"/><circle cx="${72.8}" cy="55.5" r="${eyeR * 0.35}" fill="#fff"/>`}
          </g>
          <path class="brow l" d="M42 46 L55 45" stroke="${brow}" stroke-width="3.5" stroke-linecap="round"/>
          <path class="brow r" d="M65 45 L78 46" stroke="${brow}" stroke-width="3.5" stroke-linecap="round"/>
          ${l.species === "human" || l.species === "cat" ? `<ellipse cx="40" cy="68" rx="5.5" ry="3" fill="#ff6b8a" opacity=".3"/><ellipse cx="80" cy="68" rx="5.5" ry="3" fill="#ff6b8a" opacity=".3"/>` : ""}
          ${l.species === "human" ? `<path d="M59 62 Q57 68 61 68" fill="none" stroke="${shade(l.skin, -0.25)}" stroke-width="1.8" stroke-linecap="round"/>` : ""}
          ${facial(l)}
          <path class="mouth" d="${MOUTH.neutral}" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>
          <ellipse class="mouth-o" cx="60" cy="77" rx="6" ry="5" fill="${ink}"/>
          ${accessory(l)}
        </g>
      </g>
    </svg>`;
    return html;
  }

  const P = { LOOK, svg, fullLook, randomLook };
  P.mount = function (el, c) {
    el.classList.add("pup");
    el.innerHTML = `<div class="flip">${svg(c)}</div>`;
    el.style.setProperty("--blink", (2.5 + (hash(c.name || "") % 30) / 10) + "s");
    P.emotion(el, "neutral");
    return el;
  };
  P.emotion = function (el, e) {
    const s = el.querySelector("svg"); if (!s) return;
    e = MOUTH[e] ? e : "neutral";
    s.querySelector(".mouth").setAttribute("d", MOUTH[e]);
    s.querySelector(".mouth-o").setAttribute("ry", e === "shocked" ? 8 : e === "scared" ? 6 : 5);
    const [lr, ld, rr, rd] = BROW[e];
    s.querySelector(".brow.l").setAttribute("transform", `rotate(${lr} 48 45) translate(0 ${ld})`);
    s.querySelector(".brow.r").setAttribute("transform", `rotate(${rr} 72 45) translate(0 ${rd})`);
    s.querySelectorAll(".eye").forEach(x => x.setAttribute("ry", (+x.dataset.ry) * (EYE_RY[e] || 1)));
    el.dataset.emo = e;
    const head = el.querySelector(".head");
    if (head) head.style.transform = el.classList.contains("g-slump") ? "rotate(12deg) translateY(4px)" : `rotate(${TILT[e] || 0}deg)`;
    el.classList.toggle("shocked", e === "shocked");
  };
  P.talk = function (el, ms) {
    el.classList.add("talking");
    clearTimeout(el._talk);
    el._talk = setTimeout(() => el.classList.remove("talking"), ms);
  };
  P.stopTalk = el => { clearTimeout(el._talk); el.classList.remove("talking"); };
  const GESTURES = ["point", "raise", "out", "cross", "shrug", "wave", "slump", "jump", "nod"];
  P.gesture = function (el, g, ms) {
    GESTURES.forEach(x => el.classList.remove("g-" + x));
    clearTimeout(el._g);
    if (!GESTURES.includes(g)) return;
    void el.offsetWidth;
    el.classList.add("g-" + g);
    P.emotion(el, el.dataset.emo || "neutral");
    if (ms !== 0) el._g = setTimeout(() => { el.classList.remove("g-" + g); P.emotion(el, el.dataset.emo || "neutral"); }, ms || 2200);
  };
  P.walk = (el, on) => el.classList.toggle("walking", !!on);
  P.face = (el, dir) => { const f = el.querySelector(".flip"); if (f) f.style.transform = dir < 0 ? "scaleX(-1)" : ""; };
  P.GESTURES = GESTURES;

  /* static image of a character (for <canvas> games). h = pixel height. */
  const imgCache = new Map();
  P.toImage = function (c, h) {
    const key = JSON.stringify([c.name, c.role, fullLook(c), h]);
    if (imgCache.has(key)) return imgCache.get(key);
    const markup = svg(c).replace('<svg class="puppet"', `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(h * 120 / 218)}" height="${h}"`);
    const p = new Promise(res => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup);
    });
    imgCache.set(key, p);
    return p;
  };
  return P;
})();

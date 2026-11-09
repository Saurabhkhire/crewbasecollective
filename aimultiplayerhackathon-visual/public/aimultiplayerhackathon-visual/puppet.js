/* =========================================================
   Puppet: animated SVG characters (walk, gesture, emote, talk)
   Used by Track 1 (film stage) and Track 3 (expert panel).
   ========================================================= */
window.Puppet = (function () {
  const SKIN = ["#f1c7a5", "#e0a87e", "#c68642", "#8d5524", "#ffdbac", "#b97a56"];
  const HAIR = ["#2b1d14", "#5a3825", "#d9a441", "#1a1a2e", "#b5462f", "#e8e8e8", "#6b4fa0", "#0f0f0f"];
  const PANTS = ["#23283d", "#3b2f4a", "#1f3a3a", "#4a3326", "#2d2d2d"];
  const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h; };

  const MOUTH = {
    neutral: "M52 73 Q60 76 68 73", happy: "M49 70 Q60 83 71 70", angry: "M52 77 Q60 70 68 77", sad: "M52 78 Q60 71 68 78",
    scared: "M54 75 Q60 69 66 75 Q60 79 54 75", shocked: "M57 74 Q60 73 63 74", sly: "M51 74 Q63 78 70 67",
    calm: "M53 72 Q60 77 67 72", determined: "M52 74 L68 74", thinking: "M54 75 Q60 73 66 76"
  };
  // [left rot, left dy, right rot, right dy]
  const BROW = {
    neutral: [0, 0, 0, 0], happy: [-4, -3, 4, -3], angry: [18, 3, -18, 3], sad: [-15, 0, 15, 0], scared: [-10, -6, 10, -6],
    shocked: [0, -8, 0, -8], sly: [0, -6, -14, 1], calm: [0, -1, 0, -1], determined: [13, 2, -13, 2], thinking: [-8, -4, 5, 1]
  };
  const TILT = { sad: 8, sly: -6, thinking: -9, scared: 3, shocked: -3, happy: -2 };
  const EYE_RY = { shocked: 7, scared: 6.5, angry: 3.5, determined: 4, sly: 3.2, happy: 3.5, calm: 3 };

  function svg(c) {
    const h = hash(c.name + "|" + c.role);
    const robot = /android|robot|\bbot\b|cyborg|droid|unit-|\bai\b|bolt/i.test(c.role + " " + c.name);
    const skin = robot ? "#a9bccf" : SKIN[h % SKIN.length];
    const hair = HAIR[(h >> 3) % HAIR.length];
    const style = (h >> 6) % 5;
    const outfit = c.color || "#5c8dff";
    const pants = PANTS[(h >> 9) % PANTS.length];
    const hairBack = !robot && style === 1 ? `<path d="M29 56 Q26 104 40 110 L80 110 Q94 104 91 56 Z" fill="${hair}"/>` : "";
    const hairFront = robot
      ? `<line x1="60" y1="28" x2="60" y2="14" stroke="#cdd6e4" stroke-width="3"/><circle class="ant" cx="60" cy="12" r="4.5" fill="#3ee6ff"/>`
      : [
          `<path d="M30 54 Q31 24 60 24 Q89 24 90 54 Q80 39 60 39 Q40 39 30 54Z" fill="${hair}"/>`,
          `<path d="M29 58 Q30 21 60 21 Q90 21 91 58 Q85 35 67 35 Q52 45 34 44 Q31 50 29 58Z" fill="${hair}"/>`,
          `<circle cx="60" cy="19" r="11" fill="${hair}"/><path d="M30 52 Q32 26 60 26 Q88 26 90 52 Q76 38 60 38 Q44 38 30 52Z" fill="${hair}"/>`,
          `<path d="M30 52 L33 29 L42 37 L47 20 L56 33 L62 16 L68 33 L76 20 L80 37 L88 29 L90 52 Q76 40 60 40 Q44 40 30 52Z" fill="${hair}"/>`,
          `<path d="M28 47 Q30 21 60 21 Q90 21 92 47 Z" fill="${outfit}"/><path d="M28 47 Q30 21 60 21 Q90 21 92 47 Z" fill="#000" opacity=".25"/><rect x="22" y="43" width="76" height="8" rx="4" fill="${outfit}"/>`
        ][style];
    const head = robot
      ? `<rect x="31" y="28" width="58" height="58" rx="17" fill="${skin}" stroke="#7d93ab" stroke-width="2.5"/><rect x="38" y="48" width="44" height="18" rx="9" fill="#0b1630"/>`
      : `<ellipse cx="30" cy="61" rx="4.5" ry="6.5" fill="${skin}"/><ellipse cx="90" cy="61" rx="4.5" ry="6.5" fill="${skin}"/><circle cx="60" cy="58" r="30" fill="${skin}"/>`;
    const eye = robot ? "#3ee6ff" : "#1b1b2a";
    const ink = robot ? "#3ee6ff" : "#3a1020";
    return `<svg class="puppet" viewBox="0 0 120 200" aria-hidden="true">
      <ellipse class="shadow" cx="60" cy="195" rx="32" ry="5" fill="#000" opacity=".4"/>
      <g class="rig">
        <g class="leg l"><rect x="45" y="138" width="13" height="52" rx="6" fill="${pants}"/><ellipse cx="50" cy="191" rx="11" ry="5" fill="#111"/></g>
        <g class="leg r"><rect x="62" y="138" width="13" height="52" rx="6" fill="${pants}"/><ellipse cx="70" cy="191" rx="11" ry="5" fill="#111"/></g>
        <g class="arm b"><rect x="30" y="91" width="12" height="47" rx="6" fill="${outfit}"/><rect x="30" y="91" width="12" height="47" rx="6" fill="#000" opacity=".25"/><circle cx="36" cy="140" r="6.5" fill="${skin}"/></g>
        <path d="M36 91 Q60 81 84 91 L88 146 Q60 154 32 146 Z" fill="${outfit}"/>
        <path d="M60 86 L60 150" stroke="#000" stroke-opacity=".15" stroke-width="2"/>
        <path d="M49 88 L60 101 L71 88" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linejoin="round"/>
        <rect x="33" y="134" width="54" height="7" rx="3" fill="#000" opacity=".3"/>
        <text x="73" y="124" font-size="15" text-anchor="middle">${c.avatar || ""}</text>
        <g class="arm f"><rect x="78" y="91" width="12" height="47" rx="6" fill="${outfit}"/><circle cx="84" cy="140" r="6.5" fill="${skin}"/></g>
        <g class="head">
          ${hairBack}
          <rect x="53" y="80" width="14" height="12" fill="${skin}"/>
          ${head}
          ${hairFront}
          <g class="eyes"><ellipse class="eye" cx="49" cy="57" rx="4" ry="5" fill="${eye}"/><ellipse class="eye" cx="71" cy="57" rx="4" ry="5" fill="${eye}"/>
            ${robot ? "" : `<circle cx="50.5" cy="55" r="1.4" fill="#fff"/><circle cx="72.5" cy="55" r="1.4" fill="#fff"/>`}</g>
          <path class="brow l" d="M42 45 L55 44" stroke="${robot ? "#7d93ab" : hair}" stroke-width="3.5" stroke-linecap="round"/>
          <path class="brow r" d="M65 44 L78 45" stroke="${robot ? "#7d93ab" : hair}" stroke-width="3.5" stroke-linecap="round"/>
          ${robot ? "" : `<ellipse cx="41" cy="67" rx="5" ry="3" fill="#ff6b8a" opacity=".28"/><ellipse cx="79" cy="67" rx="5" ry="3" fill="#ff6b8a" opacity=".28"/>`}
          <path class="mouth" d="${MOUTH.neutral}" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>
          <ellipse class="mouth-o" cx="60" cy="75" rx="6" ry="5" fill="${ink}"/>
        </g>
      </g>
    </svg>`;
  }

  const P = {};
  P.mount = function (el, c) {
    el.classList.add("pup");
    el.innerHTML = `<div class="flip">${svg(c)}</div>`;
    P.emotion(el, "neutral");
    return el;
  };
  P.emotion = function (el, e) {
    const s = el.querySelector("svg"); if (!s) return;
    e = MOUTH[e] ? e : "neutral";
    s.querySelector(".mouth").setAttribute("d", MOUTH[e]);
    s.querySelector(".mouth-o").setAttribute("ry", e === "shocked" ? 8 : e === "scared" ? 6 : 5);
    const [lr, ld, rr, rd] = BROW[e];
    s.querySelector(".brow.l").setAttribute("transform", `rotate(${lr} 48 44) translate(0 ${ld})`);
    s.querySelector(".brow.r").setAttribute("transform", `rotate(${rr} 72 44) translate(0 ${rd})`);
    s.querySelectorAll(".eye").forEach(x => x.setAttribute("ry", EYE_RY[e] || 5));
    el.dataset.emo = e;
    el.querySelector(".head").style.transform = el.classList.contains("g-slump") ? "rotate(12deg) translateY(4px)" : `rotate(${TILT[e] || 0}deg)`;
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
  return P;
})();

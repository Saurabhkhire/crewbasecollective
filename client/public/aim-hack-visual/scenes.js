/* =========================================================
   Scenes: illustrated SVG backdrops (office, forest, space…).
   A scene = { id, name, base, time: "day"|"sunset"|"night", weather: "clear"|"rain"|"snow"|"fog"|"fireflies"|"embers", desc }
   API:
     Scenes.BASES                 → [{ id, name, icon, indoor, desc }]
     Scenes.svg(scene)            → SVG markup (viewBox 0 0 1600 900; floor line at y≈660)
     Scenes.mount(el, scene)      → backdrop + weather particles inside el (el gets .scene-host)
     Scenes.toImage(scene, w, h)  → Promise<HTMLImageElement> (for canvas)
     Scenes.FLOOR                 → fraction from the bottom where characters stand (≈0.1–0.26)
   ========================================================= */
window.Scenes = (function () {
  const BASES = [
    { id: "office", name: "Office", icon: "🏢", indoor: true, desc: "An open-plan startup office with desks, plants and a city view." },
    { id: "forest", name: "Forest", icon: "🌲", indoor: false, desc: "A deep pine forest with a winding path." },
    { id: "space", name: "Spaceship", icon: "🚀", indoor: true, desc: "The bridge of a starship, stars streaking past the window." },
    { id: "city", name: "City street", icon: "🌆", indoor: false, desc: "A downtown street lined with towers and neon signs." },
    { id: "castle", name: "Castle hall", icon: "🏰", indoor: true, desc: "A stone throne hall with banners and torches." },
    { id: "beach", name: "Beach", icon: "🏖️", indoor: false, desc: "A sandy beach with palm trees and rolling waves." },
    { id: "classroom", name: "Classroom", icon: "🏫", indoor: true, desc: "A classroom with a chalkboard and rows of desks." },
    { id: "courtroom", name: "Courtroom", icon: "⚖️", indoor: true, desc: "A wood-panelled courtroom with the judge's bench." },
    { id: "kitchen", name: "Restaurant kitchen", icon: "🍳", indoor: true, desc: "A busy steel kitchen with pans and a service pass." },
    { id: "desert", name: "Desert", icon: "🏜️", indoor: false, desc: "Endless dunes, cacti and a blazing sky." },
    { id: "snow", name: "Snowy mountain", icon: "🏔️", indoor: false, desc: "A mountain pass with snowy peaks and pines." },
    { id: "stage", name: "Concert stage", icon: "🎤", indoor: true, desc: "A concert stage with spotlights and speakers." },
    { id: "manor", name: "Manor dining room", icon: "🕯️", indoor: true, desc: "A candle-lit dining hall in an old manor." },
    { id: "lab", name: "Science lab", icon: "🧪", indoor: true, desc: "A high-tech lab with screens and glowing tubes." },
    { id: "boardroom", name: "Boardroom", icon: "💼", indoor: true, desc: "A glass-walled boardroom with a long table." },
    { id: "park", name: "City park", icon: "🌳", indoor: false, desc: "A sunny park with trees, a bench and a pond." }
  ];
  const TIMES = ["day", "sunset", "night"];
  const WEATHER = ["clear", "rain", "snow", "fog", "fireflies", "embers"];

  const SKY = {
    day: ["#7cc8ff", "#cdeeff"], sunset: ["#3b2a6b", "#ff8a5c"], night: ["#060a1c", "#1c2550"]
  };
  const r = (x, y, w, h, f, extra) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${extra || ""}/>`;
  const stars = n => { let s = ""; for (let i = 0; i < n; i++) s += `<circle cx="${(i * 397) % 1600}" cy="${(i * 211) % 520}" r="${(i % 3) * 0.7 + 0.6}" fill="#fff" opacity="${0.4 + (i % 5) / 10}"/>`; return s; };
  const skyRect = t => `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SKY[t][0]}"/><stop offset="1" stop-color="${SKY[t][1]}"/></linearGradient>`;
  const sunMoon = t => t === "day" ? `<circle cx="1320" cy="150" r="70" fill="#fff6c9"/><circle cx="1320" cy="150" r="110" fill="#fff6c9" opacity=".25"/>`
    : t === "sunset" ? `<circle cx="1250" cy="520" r="120" fill="#ffd27a"/><circle cx="1250" cy="520" r="190" fill="#ffb36b" opacity=".3"/>`
    : `<circle cx="1300" cy="140" r="52" fill="#f4f1de"/><circle cx="1322" cy="128" r="50" fill="${SKY.night[0]}"/>` + stars(80);
  const windowView = t => t === "night" ? "#0d1430" : t === "sunset" ? "#ff9e6b" : "#9fd8ff";

  function pine(x, y, s, c) { return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-8" y="-10" width="16" height="40" fill="#4a3020"/><path d="M0 -190 L70 -60 L35 -60 L85 20 L-85 20 L-35 -60 L-70 -60 Z" fill="${c}"/></g>`; }
  function palm(x, y, s) { return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 Q14 -120 -10 -240" stroke="#8a5a2b" stroke-width="18" fill="none"/><g fill="#2f9e5b"><path d="M-10 -240 Q-110 -260 -170 -190 Q-90 -230 -10 -230Z"/><path d="M-10 -240 Q90 -280 160 -200 Q70 -240 -10 -232Z"/><path d="M-10 -240 Q-60 -330 -150 -330 Q-70 -300 -12 -238Z"/><path d="M-10 -240 Q50 -330 140 -320 Q60 -300 -8 -238Z"/></g></g>`; }
  function person_silhouette(x) { return `<g transform="translate(${x} 560)" fill="#000" opacity=".25"><circle cy="-60" r="16"/><rect x="-16" y="-44" width="32" height="60" rx="12"/></g>`; }

  const DRAW = {
    office(t) {
      return `${r(0, 0, 1600, 900, "#e9e4dc")}${r(0, 0, 1600, 900, t === "night" ? "#10142a" : "#000", 'opacity="' + (t === "night" ? 0.55 : 0) + '"')}
        ${[120, 520, 920].map(x => `${r(x, 110, 340, 300, windowView(t), 'rx="6"')}<g opacity=".7">${[0, 1, 2, 3, 4].map(i => r(x + 20 + i * 64, 260 - (i % 3) * 60, 44, 150 + (i % 3) * 60, t === "night" ? "#1f2a55" : "#6c8fb8"))}</g>${t === "night" ? [0, 1, 2, 3, 4, 5].map(i => r(x + 30 + i * 50, 300 + (i % 2) * 40, 8, 10, "#ffd96b")).join("") : ""}${r(x - 6, 104, 352, 312, "none", 'stroke="#c9c2b6" stroke-width="12" rx="8"')}<line x1="${x + 170}" y1="110" x2="${x + 170}" y2="410" stroke="#c9c2b6" stroke-width="8"/>`).join("")}
        ${r(1330, 120, 180, 120, "#fff", 'rx="6" stroke="#bbb" stroke-width="4"')}<path d="M1350 210 L1400 170 L1440 190 L1490 140" stroke="#ff4fa3" stroke-width="6" fill="none"/>
        ${r(0, 640, 1600, 260, "#b9a58c")}${r(0, 640, 1600, 14, "#9c8a72")}
        ${[200, 760, 1260].map(x => `<g>${r(x, 560, 300, 22, "#f4f1ea", 'rx="6"')}${r(x + 20, 582, 12, 90, "#666")}${r(x + 268, 582, 12, 90, "#666")}${r(x + 110, 470, 120, 84, "#20242f", 'rx="6"')}${r(x + 118, 478, 104, 66, t === "night" ? "#3ee6ff" : "#5c8dff", 'opacity=".85" rx="3"')}${r(x + 160, 554, 24, 10, "#333")}</g>`).join("")}
        <g transform="translate(90 640)"><path d="M-30 0 L30 0 L22 -60 L-22 -60Z" fill="#c76b3e"/><g fill="#3c9c58"><ellipse cx="0" cy="-100" rx="22" ry="50"/><ellipse cx="-30" cy="-90" rx="16" ry="44" transform="rotate(-25 -30 -90)"/><ellipse cx="30" cy="-90" rx="16" ry="44" transform="rotate(25 30 -90)"/></g></g>
        <g transform="translate(1520 640)"><path d="M-30 0 L30 0 L22 -60 L-22 -60Z" fill="#c76b3e"/><g fill="#3c9c58"><ellipse cx="0" cy="-100" rx="22" ry="50"/><ellipse cx="-30" cy="-90" rx="16" ry="44" transform="rotate(-25 -30 -90)"/><ellipse cx="30" cy="-90" rx="16" ry="44" transform="rotate(25 30 -90)"/></g></g>`;
    },
    forest(t) {
      const far = t === "night" ? "#10243a" : t === "sunset" ? "#5a3a5e" : "#5f9c7a", mid = t === "night" ? "#0c1c26" : t === "sunset" ? "#3c2a46" : "#2f7a52", near = t === "night" ? "#07131a" : t === "sunset" ? "#2a1d33" : "#1f5c3c";
      return `${r(0, 0, 1600, 900, "url(#sky)")}${sunMoon(t)}
        ${Array.from({ length: 14 }, (_, i) => pine(60 + i * 120, 600, 0.9 + (i % 3) * 0.15, far)).join("")}
        ${Array.from({ length: 9 }, (_, i) => pine(i * 200 + 40, 680, 1.4 + (i % 2) * 0.3, mid)).join("")}
        ${r(0, 650, 1600, 250, t === "night" ? "#0d1f16" : "#3f7a3a")}
        <path d="M600 900 Q760 760 800 650 L860 650 Q880 760 1060 900Z" fill="${t === "night" ? "#2a2a1c" : "#b99a62"}" opacity=".85"/>
        ${pine(-20, 900, 2.6, near)}${pine(1640, 900, 2.6, near)}${pine(1450, 940, 1.9, near)}
        ${[180, 420, 1200, 1380].map(x => `<ellipse cx="${x}" cy="720" rx="60" ry="22" fill="${near}"/>`).join("")}`;
    },
    space(t) {
      return `${r(0, 0, 1600, 900, "#0b1020")}
        <path d="M200 90 L1400 90 L1500 470 L100 470Z" fill="#02040c" stroke="#5c6f99" stroke-width="16"/>
        <g>${stars(120).replace(/cy="(\d+)"/g, (m, y) => `cy="${100 + (+y % 360)}"`)}</g>
        <circle cx="1180" cy="300" r="110" fill="#ff8a5c"/><circle cx="1180" cy="300" r="110" fill="url(#plan)"/><ellipse cx="1180" cy="300" rx="190" ry="34" fill="none" stroke="#ffd2a8" stroke-width="8" opacity=".7"/>
        <line x1="800" y1="90" x2="800" y2="470" stroke="#5c6f99" stroke-width="10"/>
        ${r(0, 470, 1600, 200, "#1a2238")}${[0, 1, 2, 3, 4, 5, 6, 7].map(i => r(60 + i * 190, 500, 140, 70, i % 2 ? "#3ee6ff" : "#ff4fa3", 'opacity=".55" rx="8"')).join("")}
        ${r(0, 650, 1600, 250, "#232c46")}${Array.from({ length: 16 }, (_, i) => `<line x1="${i * 100}" y1="650" x2="${i * 140 - 320}" y2="900" stroke="#2f3a5c" stroke-width="3"/>`).join("")}
        ${r(0, 650, 1600, 8, "#3ee6ff", 'opacity=".6"')}
        <circle cx="800" cy="610" r="40" fill="#11182c" stroke="#3ee6ff" stroke-width="4"/><circle cx="800" cy="610" r="14" fill="#3ee6ff" opacity=".8"/>`;
    },
    city(t) {
      const b = t === "night" ? ["#131a33", "#1b2447", "#0e1430"] : t === "sunset" ? ["#4a2f5e", "#5e3a66", "#3a2550"] : ["#7a8db3", "#90a3c7", "#6b7ea6"];
      let towers = ""; for (let i = 0; i < 13; i++) { const x = i * 128 - 20, h = 260 + ((i * 97) % 260); towers += r(x, 650 - h, 118, h, b[i % 3]); for (let k = 0; k < 8; k++) towers += r(x + 14 + (k % 3) * 34, 650 - h + 26 + Math.floor(k / 3) * 46, 18, 24, t === "night" ? (k % 2 ? "#ffd96b" : "#3ee6ff") : "#cfe3ff", `opacity="${t === "night" ? 0.8 : 0.5}"`); }
      return `${r(0, 0, 1600, 900, "url(#sky)")}${sunMoon(t)}${towers}
        ${t === "night" ? `<g><rect x="250" y="420" width="190" height="60" rx="10" fill="#0a0d1a" stroke="#ff4fa3" stroke-width="5"/><text x="345" y="462" fill="#ff4fa3" font-size="34" font-family="sans-serif" text-anchor="middle" font-weight="700">OPEN</text><rect x="1120" y="380" width="220" height="60" rx="10" fill="#0a0d1a" stroke="#3ee6ff" stroke-width="5"/><text x="1230" y="422" fill="#3ee6ff" font-size="30" font-family="sans-serif" text-anchor="middle" font-weight="700">NOODLES</text></g>` : ""}
        ${r(0, 650, 1600, 70, "#8a8f9c")}${r(0, 720, 1600, 180, "#3a3d45")}${Array.from({ length: 8 }, (_, i) => r(i * 220 + 40, 805, 120, 12, "#e8e8e8")).join("")}
        ${[150, 750, 1350].map(x => `<g><rect x="${x}" y="480" width="10" height="170" fill="#2b2e36"/><rect x="${x - 20}" y="470" width="50" height="14" rx="6" fill="#2b2e36"/>${t !== "day" ? `<circle cx="${x + 5}" cy="490" r="70" fill="#ffd96b" opacity=".15"/>` : ""}</g>`).join("")}`;
    },
    castle(t) {
      return `${r(0, 0, 1600, 900, "#3b3540")}${Array.from({ length: 12 }, (_, row) => Array.from({ length: 9 }, (_, i) => r(i * 190 - (row % 2) * 95, row * 56, 186, 52, row % 3 ? "#4a4350" : "#443d4a")).join("")).join("")}
        ${[260, 1340].map(x => `<path d="M${x - 70} 120 Q${x} 20 ${x + 70} 120 L${x + 70} 400 L${x - 70} 400Z" fill="${windowView(t)}" stroke="#2a242e" stroke-width="12"/>`).join("")}
        ${[560, 1040].map((x, i) => `<path d="M${x - 60} 60 L${x + 60} 60 L${x + 60} 380 L${x} 340 L${x - 60} 380Z" fill="${i ? "#2f5fb5" : "#b5303c"}"/><circle cx="${x}" cy="180" r="30" fill="#ffd34d"/>`).join("")}
        ${[420, 1180].map(x => `<g><rect x="${x - 8}" y="300" width="16" height="50" fill="#5a3a22"/><path d="M${x} 250 Q${x - 22} 285 ${x} 305 Q${x + 22} 285 ${x} 250Z" fill="#ffb347"/><circle cx="${x}" cy="285" r="90" fill="#ffb347" opacity=".14"/></g>`).join("")}
        <path d="M720 640 L720 420 Q800 360 880 420 L880 640Z" fill="#7a2e3a" stroke="#ffd34d" stroke-width="8"/>
        ${r(0, 640, 1600, 260, "#2a2430")}<path d="M640 900 L700 640 L900 640 L960 900Z" fill="#8a1f2e"/>`;
    },
    beach(t) {
      const sea = t === "night" ? "#0d2240" : t === "sunset" ? "#7a4a7a" : "#2aa5d8";
      return `${r(0, 0, 1600, 900, "url(#sky)")}${sunMoon(t)}
        ${r(0, 470, 1600, 200, sea)}${[0, 1, 2, 3].map(i => `<path d="M0 ${510 + i * 40} Q200 ${495 + i * 40} 400 ${510 + i * 40} T800 ${510 + i * 40} T1200 ${510 + i * 40} T1600 ${510 + i * 40}" stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none"/>`).join("")}
        <path d="M0 640 Q400 600 800 630 T1600 620 L1600 900 L0 900Z" fill="${t === "night" ? "#8a7a5a" : "#f2d59b"}"/>
        ${palm(160, 720, 1.2)}${palm(1440, 700, 1.05)}${palm(1320, 760, 0.8)}
        <g transform="translate(1100 700)"><path d="M0 0 L0 -150" stroke="#eee" stroke-width="6"/><path d="M-120 -120 Q0 -200 120 -120Z" fill="#ff4fa3"/></g>`;
    },
    classroom(t) {
      return `${r(0, 0, 1600, 900, "#f0e6c8")}${r(0, 0, 1600, 900, "#000", `opacity="${t === "night" ? 0.45 : 0}"`)}
        ${r(380, 120, 840, 330, "#2e4a3a", 'stroke="#8a5a2b" stroke-width="18" rx="6"')}
        <text x="440" y="210" fill="#fff" opacity=".8" font-family="Comic Sans MS, cursive" font-size="48">E = mc²</text><text x="440" y="300" fill="#fff" opacity=".7" font-family="Comic Sans MS, cursive" font-size="38">Today: Agents 101</text><path d="M900 360 L1100 230" stroke="#fff" opacity=".5" stroke-width="5"/>
        ${r(1300, 140, 220, 260, windowView(t), 'stroke="#c9b48a" stroke-width="12"')}<circle cx="200" cy="200" r="70" fill="#fff" stroke="#333" stroke-width="8"/><path d="M200 200 L200 150 M200 200 L235 215" stroke="#333" stroke-width="6"/>
        ${r(0, 640, 1600, 260, "#b88a5a")}${Array.from({ length: 12 }, (_, i) => r(i * 140, 640, 6, 260, "#a07548")).join("")}
        ${[220, 620, 1020, 1380].map(x => `<g>${r(x - 90, 600, 180, 18, "#c99a62", 'rx="4"')}${r(x - 80, 618, 10, 70, "#666")}${r(x + 70, 618, 10, 70, "#666")}</g>`).join("")}`;
    },
    courtroom(t) {
      return `${r(0, 0, 1600, 900, "#6b4a32")}${Array.from({ length: 10 }, (_, i) => r(i * 170, 0, 160, 640, i % 2 ? "#734f36" : "#6b4a32")).join("")}
        <circle cx="800" cy="140" r="70" fill="#d9b25a" stroke="#8a6a2a" stroke-width="8"/><text x="800" y="162" font-size="64" text-anchor="middle">⚖️</text>
        ${r(560, 300, 480, 240, "#4a301e", 'stroke="#2e1e12" stroke-width="10"')}${r(540, 290, 520, 26, "#5a3a24")}
        ${r(160, 220, 200, 260, windowView(t), 'stroke="#3a2616" stroke-width="12"')}${r(1240, 220, 200, 260, windowView(t), 'stroke="#3a2616" stroke-width="12"')}
        ${r(0, 640, 1600, 260, "#3e2a1c")}${r(0, 560, 420, 90, "#4a301e")}${r(1180, 560, 420, 90, "#4a301e")}`;
    },
    kitchen(t) {
      return `${r(0, 0, 1600, 900, "#dfe6ea")}${Array.from({ length: 16 }, (_, row) => Array.from({ length: 22 }, (_, i) => r(i * 76, row * 40, 74, 38, "#f2f6f8")).join("")).join("")}
        ${r(100, 120, 1400, 30, "#9aa6ad")}${[200, 420, 640, 960, 1180].map((x, i) => `<g><path d="M${x} 150 L${x} 200" stroke="#555" stroke-width="4"/><ellipse cx="${x}" cy="230" rx="${40 + (i % 2) * 14}" ry="18" fill="#3a3a3a"/><rect x="${x + 30}" y="222" width="70" height="10" rx="4" fill="#222"/></g>`).join("")}
        ${r(0, 470, 1600, 180, "#b7c1c7")}${r(0, 460, 1600, 18, "#e7edf0")}${[300, 800, 1300].map(x => `<g><circle cx="${x}" cy="440" r="36" fill="#333"/><path d="M${x - 10} 400 Q${x - 30} 360 ${x} 330 Q${x + 20} 360 ${x + 6} 400" stroke="#fff" stroke-opacity=".5" stroke-width="6" fill="none"/></g>`).join("")}
        ${r(0, 650, 1600, 250, "#5b6b73")}${Array.from({ length: 9 }, (_, i) => r(i * 200, 650, 100, 250, "#4f5f67")).join("")}`;
    },
    desert(t) {
      const d1 = t === "night" ? "#4a3a5a" : t === "sunset" ? "#d17a4a" : "#f0c27a", d2 = t === "night" ? "#3a2c48" : t === "sunset" ? "#b8603a" : "#e3a95a";
      const cac = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#3f8a4a"><rect x="-14" y="-160" width="28" height="160" rx="14"/><rect x="-60" y="-110" width="24" height="60" rx="12"/><rect x="-60" y="-62" width="50" height="22" rx="11"/><rect x="36" y="-130" width="24" height="70" rx="12"/><rect x="10" y="-82" width="50" height="22" rx="11"/></g>`;
      return `${r(0, 0, 1600, 900, "url(#sky)")}${sunMoon(t)}<path d="M0 560 Q300 460 600 540 T1200 500 T1600 540 L1600 900 L0 900Z" fill="${d2}"/><path d="M0 660 Q400 580 800 650 T1600 630 L1600 900 L0 900Z" fill="${d1}"/>${cac(230, 700, 1.1)}${cac(1380, 690, 0.9)}${cac(1100, 600, 0.5)}`;
    },
    snow(t) {
      const m = t === "night" ? "#2a3550" : t === "sunset" ? "#6a5a8a" : "#8fa8c8";
      return `${r(0, 0, 1600, 900, "url(#sky)")}${sunMoon(t)}
        <path d="M-100 620 L300 200 L520 420 L800 120 L1100 460 L1300 260 L1700 620Z" fill="${m}"/>
        <path d="M300 200 L240 264 L300 250 L350 290 L380 262Z M800 120 L720 205 L790 190 L850 240 L880 180Z M1300 260 L1250 314 L1300 300 L1340 330Z" fill="#fff"/>
        ${Array.from({ length: 10 }, (_, i) => pine(70 + i * 170, 690, 0.9 + (i % 3) * 0.2, t === "night" ? "#15302a" : "#2a5a4a")).join("")}
        <path d="M0 650 Q400 610 800 650 T1600 640 L1600 900 L0 900Z" fill="${t === "night" ? "#c9d4e8" : "#f4f8ff"}"/>`;
    },
    stage(t) {
      return `${r(0, 0, 1600, 900, "#0b0a14")}<path d="M0 0 L240 0 Q200 300 260 640 L0 640Z" fill="#7a1530"/><path d="M1600 0 L1360 0 Q1400 300 1340 640 L1600 640Z" fill="#7a1530"/>
        ${[400, 800, 1200].map((x, i) => `<path d="M${x} 0 L${x - 220} 660 L${x + 220} 660Z" fill="${["#ff4fa3", "#3ee6ff", "#ffc857"][i]}" opacity=".16"/><circle cx="${x}" cy="10" r="20" fill="#fff"/>`).join("")}
        ${r(160, 500, 110, 160, "#16151c", 'rx="10"')}<circle cx="215" cy="560" r="34" fill="#2a2933"/><circle cx="215" cy="625" r="18" fill="#2a2933"/>${r(1330, 500, 110, 160, "#16151c", 'rx="10"')}<circle cx="1385" cy="560" r="34" fill="#2a2933"/><circle cx="1385" cy="625" r="18" fill="#2a2933"/>
        ${r(0, 640, 1600, 260, "#2a2230")}${r(0, 640, 1600, 12, "#ffc857", 'opacity=".6"')}${[0, 1, 2, 3, 4, 5, 6, 7].map(i => person_silhouette(100 + i * 200).replace("560", "940")).join("")}`;
    },
    manor(t) {
      return `${r(0, 0, 1600, 900, "#2a1518")}${Array.from({ length: 8 }, (_, i) => r(i * 210, 0, 200, 640, i % 2 ? "#33191d" : "#2c1619")).join("")}
        ${[300, 1300].map(x => `<path d="M${x - 90} 100 L${x + 90} 100 L${x + 90} 420 L${x - 90} 420Z" fill="${t === "day" ? "#5a7ab0" : "#0c1024"}" stroke="#5a3a22" stroke-width="12"/>${t !== "day" ? `<path d="M${x - 40} 140 L${x - 10} 230 L${x - 30} 230 L${x + 10} 330" stroke="#dfe8ff" stroke-width="5" fill="none" opacity=".8"/>` : ""}`).join("")}
        <g transform="translate(800 130)"><path d="M-160 0 L160 0" stroke="#c9a14a" stroke-width="8"/>${[-120, -60, 0, 60, 120].map(x => `<g transform="translate(${x} 0)"><line y1="0" y2="40" stroke="#c9a14a" stroke-width="4"/><path d="M0 22 Q-10 38 0 48 Q10 38 0 22Z" fill="#ffb347"/></g>`).join("")}<circle r="200" cy="40" fill="#ffb347" opacity=".08"/></g>
        ${r(0, 640, 1600, 260, "#1d0e10")}${r(260, 540, 1080, 40, "#5a3020", 'rx="10"')}${r(290, 580, 30, 110, "#3a1d14")}${r(1280, 580, 30, 110, "#3a1d14")}
        ${[500, 800, 1100].map(x => `<g><rect x="${x - 4}" y="495" width="8" height="45" fill="#f4efe0"/><path d="M${x} 478 Q${x - 8} 490 ${x} 497 Q${x + 8} 490 ${x} 478Z" fill="#ffb347"/></g>`).join("")}`;
    },
    lab(t) {
      return `${r(0, 0, 1600, 900, "#0f1a24")}${Array.from({ length: 6 }, (_, i) => `<g>${r(100 + i * 240, 120, 200, 130, "#0a2a36", 'stroke="#3ee6ff" stroke-width="4" rx="8"')}<path d="M${120 + i * 240} 220 L${160 + i * 240} 180 L${200 + i * 240} 200 L${240 + i * 240} 150 L${280 + i * 240} 170" stroke="#3ee6ff" stroke-width="4" fill="none"/></g>`).join("")}
        ${[260, 640, 1020, 1380].map((x, i) => `<g><rect x="${x - 40}" y="300" width="80" height="260" rx="40" fill="${["#b6ff5c", "#ff4fa3", "#3ee6ff", "#c48bff"][i]}" opacity=".35" stroke="#cfe" stroke-width="4"/><rect x="${x - 50}" y="550" width="100" height="40" fill="#2a3a46"/>${[0, 1, 2].map(k => `<circle cx="${x + (k - 1) * 14}" cy="${360 + k * 60}" r="8" fill="#fff" opacity=".6"/>`).join("")}</g>`).join("")}
        ${r(0, 640, 1600, 260, "#16232e")}${Array.from({ length: 9 }, (_, i) => `<line x1="${i * 200}" y1="640" x2="${i * 200}" y2="900" stroke="#203240" stroke-width="3"/>`).join("")}${r(0, 640, 1600, 6, "#3ee6ff", 'opacity=".5"')}`;
    },
    boardroom(t) {
      return `${r(0, 0, 1600, 900, "#dfe3ea")}${r(0, 0, 1600, 900, "#000", `opacity="${t === "night" ? 0.5 : 0}"`)}
        ${r(80, 80, 1440, 380, windowView(t))}${Array.from({ length: 12 }, (_, i) => r(100 + i * 120, 440 - (80 + (i * 53) % 240), 90, 80 + (i * 53) % 240, t === "night" ? "#1c2448" : "#7d95b8", 'opacity=".8"')).join("")}
        ${Array.from({ length: 7 }, (_, i) => `<line x1="${80 + i * 240}" y1="80" x2="${80 + i * 240}" y2="460" stroke="#b8c0cc" stroke-width="8"/>`).join("")}
        ${r(1180, 140, 280, 160, "#20242f", 'rx="8"')}${r(1192, 152, 256, 136, "#5c8dff", 'opacity=".85"')}<path d="M1210 270 L1270 230 L1330 250 L1420 180" stroke="#fff" stroke-width="6" fill="none"/>
        ${r(0, 640, 1600, 260, "#5d6470")}<path d="M300 600 L1300 600 L1380 660 L220 660Z" fill="#2e2a28"/>${r(220, 660, 1160, 16, "#1d1a18")}`;
    },
    park(t) {
      const g1 = t === "night" ? "#163020" : t === "sunset" ? "#5a6a3a" : "#7cc46a";
      const tree = (x, s) => `<g transform="translate(${x} 650) scale(${s})"><rect x="-14" y="-180" width="28" height="180" fill="#6b4a2a"/><circle cy="-220" r="90" fill="${t === "night" ? "#1d3d28" : "#3f9a4a"}"/><circle cx="-60" cy="-180" r="60" fill="${t === "night" ? "#1a3624" : "#4aa856"}"/><circle cx="60" cy="-180" r="60" fill="${t === "night" ? "#1a3624" : "#4aa856"}"/></g>`;
      return `${r(0, 0, 1600, 900, "url(#sky)")}${sunMoon(t)}<path d="M0 560 Q400 500 800 540 T1600 520 L1600 900 L0 900Z" fill="${g1}" opacity=".7"/>
        ${tree(180, 1.1)}${tree(1420, 1.25)}${tree(1250, 0.7)}
        <ellipse cx="980" cy="760" rx="260" ry="50" fill="${t === "night" ? "#1a2a4a" : "#5ab0e0"}"/>
        ${r(0, 640, 1600, 260, g1)}<ellipse cx="980" cy="780" rx="240" ry="44" fill="${t === "night" ? "#1a2a4a" : "#5ab0e0"}"/>
        <g transform="translate(560 640)"><rect x="-90" y="-50" width="180" height="14" rx="4" fill="#8a5a2b"/><rect x="-90" y="-26" width="180" height="12" rx="4" fill="#8a5a2b"/><rect x="-80" y="-14" width="10" height="30" fill="#333"/><rect x="70" y="-14" width="10" height="30" fill="#333"/></g>`;
    }
  };

  function svg(scene) {
    const s = Object.assign({ base: "office", time: "day", weather: "clear" }, scene || {});
    const draw = DRAW[s.base] || DRAW.office;
    const time = TIMES.includes(s.time) ? s.time : "day";
    const tint = time === "night" ? `<rect width="1600" height="900" fill="#0a1030" opacity="${BASES.find(b => b.id === s.base)?.indoor ? 0.18 : 0.12}"/>` : time === "sunset" ? `<rect width="1600" height="900" fill="#ff7a3a" opacity=".08"/>` : "";
    return `<svg class="scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <defs>${skyRect(time)}<radialGradient id="plan" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
      <linearGradient id="vig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset=".4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient></defs>
      ${draw(time)}${tint}<rect width="1600" height="900" fill="url(#vig)"/></svg>`;
  }

  function particles(weather) {
    if (!weather || weather === "clear") return "";
    const n = { rain: 70, snow: 50, fog: 4, fireflies: 22, embers: 26 }[weather] || 0;
    let h = "";
    for (let i = 0; i < n; i++) {
      const x = (i * 137) % 100, d = 0.6 + ((i * 7) % 10) / 6, dl = -((i * 13) % 50) / 10;
      h += `<i style="left:${x}%;animation-duration:${weather === "rain" ? d * 0.6 : d * 4}s;animation-delay:${dl}s;${weather === "fog" ? `top:${20 + i * 15}%` : ""}"></i>`;
    }
    return `<div class="wx wx-${weather}">${h}</div>`;
  }

  function mount(el, scene) {
    el.classList.add("scene-host");
    let bg = el.querySelector(":scope > .scene-bg");
    if (!bg) { bg = document.createElement("div"); bg.className = "scene-bg"; el.prepend(bg); }
    bg.innerHTML = svg(scene) + particles(scene && scene.weather);
    return el;
  }

  const imgCache = new Map();
  function toImage(scene, w, h) {
    const key = JSON.stringify([scene && scene.base, scene && scene.time, w, h]);
    if (imgCache.has(key)) return imgCache.get(key);
    const markup = svg(scene).replace('<svg class="scene-svg"', `<svg width="${w}" height="${h}"`);
    const p = new Promise(res => { const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup); });
    imgCache.set(key, p);
    return p;
  }

  return { BASES, TIMES, WEATHER, svg, mount, toImage, FLOOR: 0.12 };
})();

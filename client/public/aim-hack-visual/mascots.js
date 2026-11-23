/* =========================================================
   Mascots: one character per sponsor and partner, drawn as SVG.
     Mascots.body(id)        → SVG <g> markup of the character (feet at 0,0, ~70 units tall)
     Mascots.act(id)         → SVG <g> markup of its looping "what this tool does" panel (upper right)
     Mascots.svg(id, {act})  → standalone <svg> (for cards, modals, lists)
     Mascots.fly(id)         → true for flying characters (Finch, Marvelous)
   Names and action texts live in data.js (sponsor.mascot / partner.mascot).
   Unknown ids get a generic robot in the sponsor's colour.
   Styles: world.css (.m-* classes).
   ========================================================= */
window.Mascots = (function () {
  const INK = "#1b1530";
  const colorOf = id => {
    const H = window.HACK || {};
    const s = (H.allSponsors || H.sponsors || []).concat(H.allPartners || H.partners || [], H.host ? [H.host] : []).find(x => x.id === id);
    return (s && s.color) || "#ffc857";
  };
  const legs = (c, x1, x2, w, h) => `<g class="m-legs"><rect class="m-legL" x="${x1}" y="${-h}" width="${w}" height="${h}" rx="${w / 2}" fill="${c}"/><rect class="m-legR" x="${x2}" y="${-h}" width="${w}" height="${h}" rx="${w / 2}" fill="${c}"/></g>`;
  /* speech-panel frame for an action: content area x 26..122, y -116..-76 */
  const panel = (c, inner, cap) => `<g class="m-act">
    <path d="M24 -62 L14 -50 L36 -62Z" fill="#0b1022" stroke="${c}" stroke-width="1.2"/>
    <rect x="18" y="-124" width="112" height="64" rx="9" fill="#0b1022" fill-opacity=".95" stroke="${c}" stroke-width="1.4"/>
    ${inner}
    <text x="74" y="-65" text-anchor="middle" class="m-cap" fill="${c}">${cap}</text></g>`;
  const T = (x, y, s, txt, o) => `<text x="${x}" y="${y}" font-size="${s}" ${o || ""}>${txt}</text>`;
  /* opacity loop: visible from a..b (fractions of dur) */
  const show = (a, b, dur) => `<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${a};${Math.min(a + 0.04, b)};${b};${Math.min(b + 0.04, 1)};1" dur="${dur}s" repeatCount="indefinite"/>`;

  const ART = {
    /* ---------- Bruin: bear in a gold hoodie with a live dashboard ---------- */
    bruin: {
      body: () => `${legs("#6b4126", -11, 2, 9, 15)}<g class="m-bob">
        <ellipse cx="0" cy="-26" rx="17" ry="15" fill="#8a5a3b"/>
        <path d="M-17 -30 Q0 -44 17 -30 L16 -15 Q0 -9 -16 -15 Z" fill="#ffc857"/>
        <path d="M-5 -37 L-4 -29 M5 -37 L4 -29" stroke="#b8862b" stroke-width="1.4"/>
        <rect class="m-armL" x="-22" y="-35" width="8" height="16" rx="4" fill="#8a5a3b"/>
        <rect class="m-armR" x="13" y="-35" width="8" height="15" rx="4" fill="#8a5a3b"/>
        <g transform="translate(14 -40)"><rect width="17" height="21" rx="2.5" fill="#10172f" stroke="#ffc857" stroke-width="1.3"/><rect x="3" y="12" width="2.6" height="6" fill="#ffc857"/><rect x="7.2" y="8" width="2.6" height="10" fill="#ffc857"/><rect x="11.4" y="4" width="2.6" height="14" fill="#ffc857"/></g>
        <circle cx="-11" cy="-60" r="5.5" fill="#8a5a3b"/><circle cx="11" cy="-60" r="5.5" fill="#8a5a3b"/><circle cx="-11" cy="-60" r="2.8" fill="#c98a5e"/><circle cx="11" cy="-60" r="2.8" fill="#c98a5e"/>
        <circle cx="0" cy="-49" r="14" fill="#8a5a3b"/>
        <ellipse cx="0" cy="-44" rx="7.5" ry="5.5" fill="#e0b48a"/><ellipse cx="0" cy="-46.5" rx="2.8" ry="2" fill="#2a1a10"/>
        <path d="M-2.5 -42 Q0 -40 2.5 -42" stroke="#2a1a10" fill="none" stroke-width="1.2"/>
        <g class="m-eyes"><circle cx="-5.5" cy="-52" r="1.9" fill="${INK}"/><circle cx="5.5" cy="-52" r="1.9" fill="${INK}"/></g></g>`,
      act: c => panel(c, `
        ${T(24, -102, 9, "💬")}${T(24, -89, 9, "🗄️")}${T(24, -76, 9, "🤖")}
        ${[0, 1, 2].map(i => `<circle r="2.2" fill="${c}"><animate attributeName="cx" values="38;62" dur="1.2s" begin="${i * 0.4}s" repeatCount="indefinite"/><animate attributeName="cy" values="${-105 + i * 13};-92" dur="1.2s" begin="${i * 0.4}s" repeatCount="indefinite"/></circle>`).join("")}
        <rect x="62" y="-106" width="20" height="28" rx="5" fill="${c}"/>${T(72, -88, 12, "B", `text-anchor="middle" font-weight="800" fill="#1b1530"`)}
        ${[0, 1, 2].map(i => `<rect x="${90 + i * 10}" width="7" rx="1.5" fill="${c}" fill-opacity="${0.55 + i * 0.2}"><animate attributeName="height" values="3;${12 + i * 9};3" dur="2.4s" begin="${i * 0.25}s" repeatCount="indefinite"/><animate attributeName="y" values="-81;${-81 - (9 + i * 9)};-81" dur="2.4s" begin="${i * 0.25}s" repeatCount="indefinite"/></rect>`).join("")}
        <line x1="88" y1="-78" x2="122" y2="-78" stroke="#8d97bd" stroke-width=".8"/>`, "ingest · model · ask AI")
    },

    /* ---------- AdaL: the girl from adal.png, making video ---------- */
    adal: {
      body: () => `${legs("#1a1420", -6, 1, 5, 9)}<g class="m-bob">
        <path d="M-10 -40 L10 -40 L15 -7 L-15 -7 Z" fill="#141018"/>
        <path d="M5 -22 L7 -7" stroke="#3a2a44" stroke-width="1.2"/>
        <path d="M-15 -7 L15 -7" stroke="#ff4fa3" stroke-width="1.6"/>
        <path class="m-armL" d="M-9 -39 L-21 -21 L-13 -18 L-7 -32 Z" fill="#ff4fa3" fill-opacity=".45" stroke="#ff8ccc" stroke-width=".8"/>
        <path class="m-armR" d="M9 -39 L21 -23 L14 -19 L7 -32 Z" fill="#ff4fa3" fill-opacity=".45" stroke="#ff8ccc" stroke-width=".8"/>
        <circle cx="-17" cy="-20" r="2.2" fill="#f6dcd2"/><circle cx="18" cy="-21" r="2.2" fill="#f6dcd2"/>
        <g transform="translate(15 -31)"><rect width="9" height="6" rx="1.2" fill="#2d2d36"/><circle cx="4.5" cy="3" r="1.8" fill="#ff4fa3"/></g>
        <rect x="-2" y="-45" width="4" height="6" fill="#f6dcd2"/>
        <path d="M-7 -40 L0 -36 L7 -40" fill="none" stroke="#ff4fa3" stroke-width="1"/>
        <path d="M-12.5 -50 Q-13.5 -67 0 -67 Q13.5 -67 12.5 -50 L12.5 -40 Q9 -43 8.5 -49 L-8.5 -49 Q-9 -43 -12.5 -40 Z" fill="#1a1420"/>
        <ellipse cx="0" cy="-52" rx="8.6" ry="9.6" fill="#f6dcd2"/>
        <path d="M-9.5 -54 Q-5 -49 -2 -56 Q2 -50 6 -55 Q8 -52 9.5 -53 L9.5 -59 Q0 -67 -9.5 -59 Z" fill="#1a1420"/>
        <path d="M-10 -59 Q-2 -66 7 -63" stroke="#ff4fa3" stroke-width="1.6" fill="none" opacity=".85"/>
        <g class="m-eyes"><ellipse cx="-3.5" cy="-51" rx="1.5" ry="2" fill="#ff4fa3"/><ellipse cx="3.5" cy="-51" rx="1.5" ry="2" fill="#ff4fa3"/></g>
        <path d="M-1.5 -46.3 Q0 -45.4 1.5 -46.3" stroke="#c0607a" fill="none" stroke-width=".9"/></g>`,
      act: c => panel(c, `
        <g transform="translate(24 -100)"><rect y="4" width="24" height="16" rx="2" fill="#24242e"/><path d="M3 8 L21 8 M3 12 L16 12" stroke="#8d97bd" stroke-width="1"/>
          <g><rect y="-2" width="24" height="5" rx="1" fill="#f4f4f4"/><path d="M4 -2 L7 3 M11 -2 L14 3 M18 -2 L21 3" stroke="#24242e" stroke-width="2"/><animateTransform attributeName="transform" type="rotate" values="-28 0 3;0 0 3;0 0 3;-28 0 3" keyTimes="0;.15;.6;1" dur="1.6s" repeatCount="indefinite"/></g></g>
        <rect x="56" y="-112" width="66" height="24" rx="2" fill="#000"/>
        ${[0, 1, 2, 3].map(i => `<rect x="${59 + i * 15.5}" y="-109" width="13" height="18" rx="1.5" fill="${["#ff4fa3", "#c48bff", "#7cc8ff", "#ffc857"][i]}" opacity="0">${show(0.08 + i * 0.16, 0.92, 3.2)}</rect>`).join("")}
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${58 + i * 8}" y="-111.5" width="3" height="1.5" fill="#555"/><rect x="${58 + i * 8}" y="-89.5" width="3" height="1.5" fill="#555"/>`).join("")}
        <rect x="56" y="-84" width="66" height="3" rx="1.5" fill="#24242e"/><rect x="56" y="-84" height="3" rx="1.5" fill="${c}"><animate attributeName="width" values="0;66;66" keyTimes="0;.85;1" dur="3.2s" repeatCount="indefinite"/></rect>
        <circle cx="122" cy="-118" r="2.4" fill="#ff4f4f"><animate attributeName="opacity" values="1;.1;1" dur="1s" repeatCount="indefinite"/></circle>${T(106, -116, 6, "REC", `fill="#ff4f4f" class="m-mono"`)}`, "text → frames → video")
    },

    /* ---------- BAND: blue-headed alien, electricity between agents and people ---------- */
    band: {
      body: () => `${legs("#23283d", -9, 2, 7, 14)}<g class="m-bob">
        <rect x="-10" y="-34" width="20" height="21" rx="7" fill="#23283d"/>
        <path d="M1.5 -31 L-4 -23 L0 -23 L-2.5 -16 L5 -25 L1 -25 L3.5 -31Z" fill="#9fc0ff"/>
        <rect class="m-armL" x="-16" y="-33" width="6" height="15" rx="3" fill="#23283d"/><rect class="m-armR" x="10" y="-33" width="6" height="15" rx="3" fill="#23283d"/>
        <circle cx="-13" cy="-17" r="2.6" fill="#5c8dff"/><circle cx="13" cy="-17" r="2.6" fill="#5c8dff"/>
        <path d="M-6 -62 L-11 -74 M6 -62 L11 -74" stroke="#5c8dff" stroke-width="2.2" stroke-linecap="round"/>
        <circle class="m-glow" cx="-11" cy="-75" r="3.2" fill="#cfe0ff"/><circle class="m-glow" cx="11" cy="-75" r="3.2" fill="#cfe0ff"/>
        <circle cx="0" cy="-50" r="15" fill="#5c8dff"/><ellipse cx="-5" cy="-58" rx="5" ry="2.6" fill="#fff" opacity=".28"/>
        <g class="m-eyes"><ellipse cx="-5.5" cy="-50" rx="4" ry="5" fill="#fff"/><ellipse cx="5.5" cy="-50" rx="4" ry="5" fill="#fff"/><circle cx="-5" cy="-49" r="2.2" fill="#0b1640"/><circle cx="6" cy="-49" r="2.2" fill="#0b1640"/></g>
        <path d="M-3 -42 Q0 -40 3 -42" stroke="#0b1640" fill="none" stroke-width="1.2"/>
        <path class="m-zap" d="M-11 -75 L-5 -79 L-1 -74 L4 -79 L11 -75" stroke="#cfe0ff" stroke-width="1.2" fill="none"/></g>`,
      act: c => panel(c, `
        <circle cx="40" cy="-96" r="8" fill="${c}"/><circle cx="37" cy="-97" r="1.6" fill="#fff"/><circle cx="43" cy="-97" r="1.6" fill="#fff"/>
        <circle cx="84" cy="-108" r="6.5" fill="#3ee6ff"/><circle cx="84" cy="-84" r="6.5" fill="#b6ff5c"/><circle cx="114" cy="-96" r="6.5" fill="#eaf0ff"/>
        ${T(84, -105.5, 7, "🤖", `text-anchor="middle"`)}${T(84, -81.5, 7, "🤖", `text-anchor="middle"`)}${T(114, -93.5, 7, "🧑", `text-anchor="middle"`)}
        ${[["48 -99", "78 -107"], ["48 -93", "78 -85"], ["90 -105", "108 -98"], ["90 -86", "108 -94"]].map(([a, b], i) => { const [x1, y1] = a.split(" ").map(Number), [x2, y2] = b.split(" ").map(Number), mx = (x1 + x2) / 2, my = (y1 + y2) / 2; return `<polyline points="${x1},${y1} ${mx - 4},${my - 4} ${mx + 2},${my + 3} ${x2},${y2}" fill="none" stroke="#cfe0ff" stroke-width="1.6" opacity="0"><animate attributeName="opacity" values="0;1;.2;1;0" dur="1.1s" begin="${i * 0.27}s" repeatCount="indefinite"/></polyline>`; }).join("")}`, "agents ⇄ agents ⇄ people")
    },

    /* ---------- Finch: a flying finch that picks and drops skills ---------- */
    finch: {
      body: () => `<g class="m-bob">
        <path d="M-11 -20 L-22 -27 L-20 -15Z" fill="#d9772a"/>
        <ellipse cx="0" cy="-18" rx="12" ry="9" fill="#ff9f43"/><ellipse cx="2" cy="-15" rx="7" ry="5.5" fill="#ffe0b8"/>
        <circle cx="9" cy="-26" r="7" fill="#ff9f43"/><circle class="m-eyes" cx="11" cy="-27.5" r="1.6" fill="${INK}"/>
        <path d="M15 -27 L22 -25 L15 -23Z" fill="#ffc857"/>
        <path d="M6 -32 Q7 -39 12 -37" stroke="#d9772a" fill="none" stroke-width="2" stroke-linecap="round"/>
        <path class="m-wing" d="M-4 -21 Q-12 -40 7 -27 Z" fill="#e8822f"/>
        <g class="m-card" transform="translate(16 -24)"><rect width="10" height="8" rx="1.5" fill="#fff" stroke="#ff9f43"/><text x="5" y="6.3" font-size="5.5" text-anchor="middle">🎒</text></g>
        <path d="M-2 -9 L-3 -4 M3 -9 L2 -4" stroke="#d9772a" stroke-width="1.4"/></g>`,
      act: c => panel(c, `
        ${["🤝 Negotiate", "🔎 Investigate", "🩹 Medic"].map((s, i) => `<g opacity="0">${show(i / 3 + 0.01, (i + 1) / 3 - 0.02, 4.2)}
          <rect x="26" y="-114" width="62" height="34" rx="5" fill="#fff"/>${T(31, -103, 6, "SKILL", `class="m-mono" fill="${c}"`)}${T(31, -89, 7.6, s, `font-weight="700" fill="#1b1530"`)}</g>`).join("")}
        <path d="M90 -104 Q104 -110 108 -96" fill="none" stroke="${c}" stroke-width="1.4" stroke-dasharray="3 3"/>
        <circle cx="110" cy="-86" r="7" fill="#eaf0ff"/>${T(110, -83.5, 7, "🤖", `text-anchor="middle"`)}
        <g><rect x="104" y="-102" width="10" height="8" rx="1.5" fill="#fff" stroke="${c}"/><animateTransform attributeName="transform" type="translate" values="0 -8;0 6;0 6" keyTimes="0;.5;1" dur="1.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;1;0" keyTimes="0;.6;1" dur="1.4s" repeatCount="indefinite"/></g>`, "picks & drops skills")
    },

    /* ---------- Casuro: a cassowary interviewer with a mic and a clipboard ---------- */
    casuro: {
      body: () => `<g class="m-legs"><path class="m-legL" d="M-4 -18 L-5 0 M-5 0 L-9 0 M-5 0 L-2 0" stroke="#9a8f7a" stroke-width="2.6" stroke-linecap="round"/><path class="m-legR" d="M4 -18 L5 0 M5 0 L9 0 M5 0 L2 0" stroke="#9a8f7a" stroke-width="2.6" stroke-linecap="round"/></g><g class="m-bob">
        <ellipse cx="0" cy="-27" rx="14" ry="11.5" fill="#1d1b22"/>
        <path d="M-10 -22 Q-6 -18 -2 -22 M0 -20 Q4 -16 8 -21 M-6 -30 Q-2 -26 2 -30" stroke="#3a3644" fill="none" stroke-width="1.2"/>
        <rect x="-19" y="-36" width="11" height="14" rx="1.5" fill="#f4ead2" stroke="#8a6a3a"/><path d="M-17 -31 L-10 -31 M-17 -28 L-11 -28 M-17 -25 L-12 -25" stroke="#8a6a3a" stroke-width=".9"/>
        <path d="M3 -34 Q1 -47 5 -54" stroke="#3fa9ff" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path d="M5 -41 Q10 -37 6 -34" stroke="#ff6b6b" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="6" cy="-56" r="6.2" fill="#3fa9ff"/>
        <path d="M2.5 -60 Q6 -72 10.5 -60Z" fill="#a8742f"/>
        <circle class="m-eyes" cx="8.3" cy="-57" r="1.5" fill="${INK}"/>
        <path d="M11.5 -57 L18 -54.5 L11.5 -52.5Z" fill="#2b2b2b"/>
        <path class="m-armR" d="M8 -28 L17 -37" stroke="#1d1b22" stroke-width="4.5" stroke-linecap="round"/>
        <rect x="15" y="-44" width="5" height="9" rx="2.5" fill="#ff6b6b" transform="rotate(20 17 -40)"/></g>`,
      act: c => panel(c, `
        ${Array.from({ length: 11 }, (_, i) => `<rect x="${26 + i * 5}" width="3" rx="1.5" fill="${c}"><animate attributeName="height" values="2;${6 + ((i * 7) % 13)};3;${4 + ((i * 5) % 9)};2" dur="${0.9 + (i % 3) * 0.2}s" repeatCount="indefinite"/><animate attributeName="y" values="-97;${-97 - (3 + ((i * 7) % 13) / 2)};-98.5;${-97 - (2 + ((i * 5) % 9) / 2)};-97" dur="${0.9 + (i % 3) * 0.2}s" repeatCount="indefinite"/></rect>`).join("")}
        ${T(26, -110, 6.5, "🎙️ VOICE ANSWER", `class="m-mono" fill="#8d97bd"`)}
        ${[["Clarity", 4], ["Evidence", 5], ["Structure", 4]].map(([k, v], i) => `<g opacity="0">${show(0.15 + i * 0.18, 0.95, 3.6)}${T(84, -106 + i * 11, 6.8, k, `fill="#eaf0ff"`)}${Array.from({ length: 5 }, (_, j) => `<circle cx="${110 + j * 3.6}" cy="${-108.4 + i * 11}" r="1.4" fill="${j < v ? c : "#3a4266"}"/>`).join("")}</g>`).join("")}`, "voice → fair score")
    },

    /* ---------- Glasser: an orange monkey in black glasses with a telescope ---------- */
    glasser: {
      body: () => `${legs("#d9741f", -9, 2, 7, 14)}<g class="m-bob">
        <path d="M-11 -18 Q-27 -18 -25 -32 Q-23 -41 -16 -36" stroke="#f08a2c" stroke-width="4" fill="none" stroke-linecap="round"/>
        <ellipse cx="0" cy="-25" rx="13" ry="13" fill="#f08a2c"/><ellipse cx="0" cy="-23" rx="8" ry="9" fill="#f6c79a"/>
        <rect class="m-armL" x="-17" y="-35" width="6" height="15" rx="3" fill="#f08a2c"/>
        <g transform="translate(9 -38) rotate(-28)"><rect width="19" height="6" rx="2" fill="#2d3142"/><rect x="15" y="-1.2" width="6" height="8.4" rx="1.6" fill="#7cc8ff"/></g>
        <rect class="m-armR" x="10" y="-36" width="6" height="12" rx="3" fill="#f08a2c"/>
        <circle cx="-13.5" cy="-50" r="5.2" fill="#f08a2c"/><circle cx="13.5" cy="-50" r="5.2" fill="#f08a2c"/><circle cx="-13.5" cy="-50" r="2.6" fill="#f6c79a"/><circle cx="13.5" cy="-50" r="2.6" fill="#f6c79a"/>
        <circle cx="0" cy="-50" r="12.5" fill="#f08a2c"/><ellipse cx="0" cy="-46.5" rx="9.5" ry="8.5" fill="#f6c79a"/>
        <path d="M-3 -63 Q0 -69 3 -63" stroke="#d9741f" stroke-width="2" fill="none"/>
        <g class="m-eyes"><circle cx="-5.3" cy="-51.3" r="1.5" fill="#111"/><circle cx="5.3" cy="-51.3" r="1.5" fill="#111"/></g>
        <g fill="#111" fill-opacity=".18" stroke="#111" stroke-width="2.3"><rect x="-10" y="-55.5" width="9" height="7" rx="2.2"/><rect x="1" y="-55.5" width="9" height="7" rx="2.2"/></g><path d="M-1 -52.5 L1 -52.5" stroke="#111" stroke-width="2"/>
        <path d="M-3 -43.5 Q0 -40.5 3 -43.5" stroke="#7a3d12" fill="none" stroke-width="1.2"/></g>`,
      act: c => panel(c, `
        <g opacity="0">${show(0.02, 0.36, 4.4)}<rect x="28" y="-114" width="92" height="20" rx="4" fill="${c}"/>${T(33, -106, 6, "PRICE BEFORE CALL", `class="m-mono" fill="#04121f"`)}${T(33, -98, 7.5, "🏢 Apollo · company search · $0.020", `font-weight="700" fill="#04121f"`)}</g>
        <g opacity="0">${show(0.2, 0.36, 4.4)}<rect x="88" y="-90" width="32" height="11" rx="5.5" fill="#b6ff5c"/>${T(104, -82.3, 6.5, "✓ OK", `text-anchor="middle" font-weight="700" fill="#14210a"`)}</g>
        ${["Northwind AI · 84 staff", "Lumen Labs · 41 staff", "Parcel Robotics · 120"].map((r, i) => `<g opacity="0">${show(0.42 + i * 0.12, 0.97, 4.4)}<rect x="28" y="${-114 + i * 12}" width="92" height="10" rx="2" fill="#16203f"/>${T(32, -106.6 + i * 12, 6.5, r, `fill="#eaf0ff"`)}</g>`).join("")}`, "real data · price first")
    },

    /* ---------- Telem AI: a violet owl with a radar dish and a magnifying glass ---------- */
    telem: {
      body: c => `<path d="M-6 0 L-6 -6 M-9 0 L-6 -4 L-3 0 M6 0 L6 -6 M3 0 L6 -4 L9 0" stroke="#ffb347" stroke-width="2" stroke-linecap="round" fill="none"/><g class="m-bob">
        <ellipse cx="0" cy="-24" rx="15" ry="18" fill="#8a3fb8"/>
        <ellipse cx="0" cy="-20" rx="10" ry="12" fill="#f3d9ff"/>
        ${[-26, -20, -14].map(y => `<path d="M-5 ${y} L-2.5 ${y + 2.5} L0 ${y} L2.5 ${y + 2.5} L5 ${y}" stroke="#c48be0" stroke-width="1" fill="none"/>`).join("")}
        <path class="m-armL" d="M-14 -34 Q-24 -24 -15 -12 Z" fill="#6f2f99"/>
        <g transform="rotate(-120 13 -33)"><path class="m-armR" d="M13 -34 Q23 -24 14 -12 Z" fill="#6f2f99"/></g>
        <g transform="translate(19 -58)"><circle r="5.5" fill="#dff7ff" fill-opacity=".35" stroke="#2d3142" stroke-width="2"/><path d="M3.8 3.8 L8 8" stroke="#2d3142" stroke-width="2.6" stroke-linecap="round"/></g>
        <path d="M-12 -55 L-9 -64 L-5 -55Z M12 -55 L9 -64 L5 -55Z" fill="#6f2f99"/>
        <ellipse cx="0" cy="-48" rx="13" ry="11" fill="#9b4dca"/>
        <circle cx="-5.5" cy="-49" r="5.2" fill="#fff"/><circle cx="5.5" cy="-49" r="5.2" fill="#fff"/>
        <g class="m-eyes"><circle cx="-5.5" cy="-49" r="2.4" fill="${INK}"/><circle cx="5.5" cy="-49" r="2.4" fill="${INK}"/></g>
        <path d="M-2 -44.5 L2 -44.5 L0 -41Z" fill="#ffb347"/>
        <path d="M0 -59 L0 -65" stroke="#2d3142" stroke-width="1.6"/>
        <path d="M-8 -66 Q0 -74 8 -66 Q0 -69 -8 -66Z" fill="#dfe6ff" stroke="#2d3142" stroke-width="1"/><circle cx="0" cy="-69" r="1.3" fill="${c}"/>
        ${[0, 0.5, 1].map(d => `<path d="M-6 -74 Q0 -79 6 -74" stroke="${c}" stroke-width="1.2" fill="none" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="${d}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;0 -6" dur="1.5s" begin="${d}s" repeatCount="indefinite"/></path>`).join("")}</g>`,
      act: c => panel(c, `
        <rect x="28" y="-116" width="92" height="11" rx="5.5" fill="#1d2147" stroke="${c}" stroke-width=".7"/>${T(32, -108.5, 5.6, "🔎 1920s jazz slang", `fill="#eaf0ff"`)}
        ${[["⚡ fast", 0.62, "#ff6b6b"], ["🧠 deep", 0.92, c], ["📰 news", 0.78, c]].map(([n, w, col], i) => `<g opacity="0">${show(0.1 + i * 0.08, 0.5, 4.6)}${T(28, -96 + i * 8, 5, n, `fill="#c9cde6"`)}<rect x="52" y="${-100 + i * 8}" width="${w * 66}" height="4.5" rx="2" fill="${col}"/></g>`).join("")}
        <g opacity="0">${show(0.36, 0.5, 4.6)}${T(104, -88, 5, "✓", `fill="${c}" font-weight="700"`)}</g>
        <g opacity="0">${show(0.54, 0.97, 4.6)}${T(28, -96, 5.2, "TRACE", `fill="${c}" class="m-mono"`)}${[[0, 14], [14, 10], [24, 30], [54, 18], [72, 12]].map(([s, w], i) => `<rect x="${46 + s}" y="${-100 + i * 5}" width="${w}" height="3.5" rx="1.5" fill="${i === 2 ? "#ff6b6b" : c}"/>`).join("")}</g>`, "search · fetch · trace")
    },

    /* ---------- Runware: a mint robot built from stacked GPU modules, lightning antenna, a bolt in hand ---------- */
    runware: {
      body: c => `${legs("#1f8f6c", -9, 3, 7, 12)}<g class="m-bob">
        ${[0, 1, 2].map(i => `<rect x="-14" y="${-38 + i * 9}" width="28" height="8" rx="2" fill="#123a30" stroke="${c}" stroke-width="1.2"/>
          <path d="M-10 ${-34 + i * 9} H2" stroke="${c}" stroke-opacity=".35" stroke-width="1.4"/>
          ${[5, 9].map((x, j) => `<circle cx="${x}" cy="${-34 + i * 9}" r="1.3" fill="${j ? "#ffe066" : c}"><animate attributeName="opacity" values="1;.2;1" dur="${0.6 + i * 0.25 + j * 0.3}s" repeatCount="indefinite"/></circle>`).join("")}`).join("")}
        <rect class="m-armL" x="-19" y="-36" width="5" height="14" rx="2.5" fill="#1f8f6c"/>
        <g transform="rotate(-150 16.5 -36)"><rect class="m-armR" x="14" y="-36" width="5" height="14" rx="2.5" fill="#1f8f6c"/></g>
        <path d="M17 -64 L12 -55 L16 -55 L13 -47 L21 -58 L17 -58 L20 -64Z" fill="#ffe066" stroke="#b8860b" stroke-width=".6"/>
        <rect x="-3" y="-42" width="6" height="4" fill="#1f8f6c"/>
        <rect x="-12" y="-58" width="24" height="17" rx="5" fill="#0b1022" stroke="${c}" stroke-width="1.6"/>
        <g class="m-eyes"><rect x="-7" y="-53" width="4.5" height="5" rx="1.5" fill="${c}"/><rect x="2.5" y="-53" width="4.5" height="5" rx="1.5" fill="${c}"/></g>
        <path d="M-3 -45.5 Q0 -43.5 3 -45.5" stroke="${c}" fill="none" stroke-width="1"/>
        <path d="M0 -58 L0 -64" stroke="${c}" stroke-width="1.4"/><path d="M1 -70 L-2.5 -65 L0 -65 L-1.5 -61 L3 -66.5 L.5 -66.5 L2 -70Z" fill="#ffe066"/></g>`,
      act: c => panel(c, `
        ${T(28, -113, 5.5, "JOBS → SONIC POD", `fill="${c}" class="m-mono"`)}
        ${Array.from({ length: 15 }, (_, i) => `<rect x="${28 + (i % 5) * 10}" y="${-108 + Math.floor(i / 5) * 9}" width="8" height="7" rx="1.5" fill="${c}" opacity=".15">${`<animate attributeName="opacity" values=".15;.15;1;.15" keyTimes="0;${(i * 0.06).toFixed(2)};${(i * 0.06 + 0.05).toFixed(2)};1" dur="3s" repeatCount="indefinite"/>`}</rect>`).join("")}
        <g opacity="0">${show(0.35, 0.96, 4.4)}${T(84, -106, 5.2, "Runware", `fill="#eaf0ff"`)}<rect x="84" y="-104" width="18" height="5" rx="2" fill="${c}"/>
          ${T(84, -93, 5.2, "neocloud", `fill="#eaf0ff"`)}<rect x="84" y="-91" width="36" height="5" rx="2" fill="#ff8a7a"/>${T(84, -79, 5.5, "½ the cost", `fill="${c}" font-weight="700"`)}</g>`, "any model · one API")
    },

    /* ---------- Teamily AI: a kangaroo with a pouch of agent joeys and a phone full of chat ---------- */
    teamily: {
      body: () => `<path d="M-9 -12 Q-24 -10 -31 -1" stroke="#a8693f" stroke-width="6" fill="none" stroke-linecap="round"/>
        ${legs("#a8693f", -10, 2, 8, 11)}<ellipse cx="-8" cy="-1" rx="8" ry="2.6" fill="#8d5733"/><ellipse cx="8" cy="-1" rx="8" ry="2.6" fill="#8d5733"/>
        <g class="m-bob">
        <ellipse cx="0" cy="-26" rx="15" ry="17" fill="#b9784a"/>
        <ellipse cx="1" cy="-23" rx="10" ry="12" fill="#e8c39e"/>
        ${[["-5", "#ff6f61", "0"], ["1", "#ff4fa3", ".25"], ["7", "#3ee6ff", ".5"]].map(([x, c, d]) => `<g><animateTransform attributeName="transform" type="translate" values="0 2;0 -1.5;0 2" dur="1.4s" begin="${d}s" repeatCount="indefinite"/>
          <path d="M${x} -33 L${x} -36" stroke="#8b93b8" stroke-width=".8"/><circle cx="${x}" cy="-36.5" r=".9" fill="${c}"/>
          <rect x="${x - 3.6}" y="-33" width="7.2" height="6.5" rx="2.4" fill="#e6ecff" stroke="${c}" stroke-width="1"/>
          <circle cx="${x - 1.4}" cy="-30" r=".9" fill="${c}"/><circle cx="${+x + 1.4}" cy="-30" r=".9" fill="${c}"/></g>`).join("")}
        <path d="M-10 -27 Q1 -13 12 -27 L12 -24 Q1 -9 -10 -24Z" fill="#d9ab82" stroke="#a8693f" stroke-width=".8"/>
        <rect class="m-armL" x="-17" y="-37" width="5.5" height="14" rx="2.7" fill="#b9784a"/>
        <g transform="rotate(-145 14 -38)"><rect class="m-armR" x="11.5" y="-38" width="5.5" height="14" rx="2.7" fill="#b9784a"/></g>
        <g transform="translate(16 -58)"><rect width="12" height="18" rx="2.2" fill="#10172f" stroke="#8b7bff" stroke-width="1.2"/>
          <rect x="2" y="3" width="6" height="3" rx="1.2" fill="#8b7bff"/><rect x="4" y="7.5" width="6" height="3" rx="1.2" fill="#ff6f61"/><rect x="2" y="12" width="6" height="3" rx="1.2" fill="#3ee6ff"/></g>
        <rect x="-9" y="-43" width="18" height="4.5" rx="2" fill="#8b7bff"/><path d="M5 -40 L9 -32 L5 -33Z" fill="#8b7bff"/>
        <ellipse cx="-5" cy="-63" rx="3" ry="8.5" fill="#b9784a" transform="rotate(-14 -5 -63)"/><ellipse cx="5" cy="-63" rx="3" ry="8.5" fill="#b9784a" transform="rotate(14 5 -63)"/>
        <ellipse cx="-5" cy="-63" rx="1.4" ry="6" fill="#f2b8a0" transform="rotate(-14 -5 -63)"/><ellipse cx="5" cy="-63" rx="1.4" ry="6" fill="#f2b8a0" transform="rotate(14 5 -63)"/>
        <ellipse cx="0" cy="-51" rx="10.5" ry="9.5" fill="#b9784a"/>
        <ellipse cx="2" cy="-46.5" rx="6.5" ry="4.6" fill="#e8c39e"/>
        <ellipse cx="3" cy="-48.5" rx="2" ry="1.5" fill="#3b2618"/>
        <g class="m-eyes"><circle cx="-4.5" cy="-53" r="1.7" fill="${INK}"/><circle cx="4.5" cy="-53" r="1.7" fill="${INK}"/></g>
        <path d="M0 -44.5 Q2.5 -42.5 5 -44.5" stroke="${INK}" fill="none" stroke-width="1"/></g>`,
      act: c => panel(c, `
        ${T(28, -113, 5.5, "# team-launch · 2 humans · 3 agents", `fill="${c}" class="m-mono"`)}
        ${[["🧑", "#eaf0ff", "Launch on Friday?", 0, 0.06], ["📣", "#ff6f61", "Posts drafted ✓", 1, 0.24], ["🎨", "#ff4fa3", "Poster ready ✓", 0, 0.42], ["💻", "#3ee6ff", "Page is live ✓", 1, 0.6]].map(([e, col, txt, right, at], i) => {
          const y = -106 + i * 9, x = right ? 64 : 34;
          return `<g opacity="0">${show(at, 0.96, 4.6)}<circle cx="${right ? 117 : 29}" cy="${y + 3}" r="3.6" fill="${col}" fill-opacity=".25" stroke="${col}" stroke-width=".7"/>${T(right ? 117 : 29, y + 5, 4.8, e, `text-anchor="middle"`)}
            <rect x="${x}" y="${y}" width="48" height="7" rx="3.5" fill="${right ? "#1d2147" : "#2a2f55"}" stroke="${col}" stroke-width=".6"/>${T(x + 3, y + 5, 4.6, txt, `fill="#eaf0ff"`)}</g>`;
        }).join("")}`, "humans + agents · one chat")
    },

    /* ---------- 2% Tech: the flame from fire.jpg (goggles + scarf) ---------- */
    twopercent: {
      body: () => `<g class="m-legs"><path class="m-legL" d="M-9 -12 Q-10 0 -6 0 L-2 0 L-3 -12Z" fill="#f07a1a"/><path class="m-legR" d="M3 -12 L2 0 L6 0 Q10 0 9 -12Z" fill="#f07a1a"/></g><g class="m-bob">
        <path d="M-12 -31 Q-15 -11 -7 -10 L7 -10 Q15 -11 12 -31Z" fill="#f58a1f"/>
        <g class="m-flame"><path d="M-17 -36 Q-22 -55 -11 -63 Q-12 -55 -6 -58 Q-5 -73 6 -81 Q4 -69 12 -62 Q14 -70 19 -66 Q23 -50 17 -36 Q0 -27 -17 -36Z" fill="#ff8a1f"/>
          <path d="M-12 -40 Q-14 -52 -7 -57 Q-4 -50 2 -62 Q5 -54 11 -55 Q15 -46 12 -40Z" fill="#ffc04d" opacity=".75"/></g>
        <ellipse cx="0" cy="-42" rx="11" ry="9" fill="#ffe2b8"/>
        <g class="m-eyes"><ellipse cx="-4" cy="-43.5" rx="1.6" ry="2.2" fill="#2a1a10"/><ellipse cx="4" cy="-43.5" rx="1.6" ry="2.2" fill="#2a1a10"/></g>
        <path d="M-3.2 -38.5 Q0 -34 3.2 -38.5Z" fill="#c0442a"/>
        <ellipse cx="-7.3" cy="-40" rx="1.9" ry="1" fill="#ff8a6b"/><ellipse cx="7.3" cy="-40" rx="1.9" ry="1" fill="#ff8a6b"/>
        <rect x="-11.5" y="-56" width="10" height="6.6" rx="2.6" fill="#ffb27a" stroke="#f4ead2" stroke-width="2"/><rect x="1.5" y="-56" width="10" height="6.6" rx="2.6" fill="#ffb27a" stroke="#f4ead2" stroke-width="2"/><rect x="-1.5" y="-54" width="3" height="2" fill="#f4ead2"/>
        <path d="M-11 -31 Q0 -26 11 -31 L11 -27 Q0 -22 -11 -27Z" fill="#f4ead2"/><path d="M6 -27 L21 -21 L19 -15 L5 -23Z" fill="#f4ead2"/>
        <path class="m-armL" d="M-11 -27 L-17 -42" stroke="#f58a1f" stroke-width="6" stroke-linecap="round"/><circle cx="-18" cy="-44" r="4" fill="#f58a1f"/>
        <path class="m-armR" d="M11 -24 L15 -16" stroke="#f58a1f" stroke-width="5.5" stroke-linecap="round"/></g>`,
      act: c => panel(c, `
        ${T(52, -86, 26, "2%", `text-anchor="middle" font-weight="800" fill="${c}" class="m-glowtxt"`)}
        ${Array.from({ length: 9 }, (_, i) => `<circle r="${1 + (i % 3) * 0.6}" fill="${i % 2 ? "#ffc04d" : c}"><animate attributeName="cx" values="${30 + i * 10};${28 + i * 10 + (i % 2 ? 4 : -4)}" dur="${1.2 + (i % 4) * 0.3}s" repeatCount="indefinite"/><animate attributeName="cy" values="-76;-118" dur="${1.2 + (i % 4) * 0.3}s" begin="${i * 0.15}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="${1.2 + (i % 4) * 0.3}s" begin="${i * 0.15}s" repeatCount="indefinite"/></circle>`).join("")}
        ${T(78, -104, 6.4, "170K+ builders", `fill="#eaf0ff" font-weight="700"`)}${T(78, -94, 5.8, "hackathons · salons", `fill="#8d97bd"`)}${T(78, -84, 5.8, "AWS Builder Nights", `fill="#8d97bd"`)}`, "sparks the builders")
    },

    /* ---------- NERDCONF: a nerdy alien giving a lightning talk ---------- */
    nerdconf: {
      body: () => `${legs("#2d3142", -9, 2, 7, 14)}<g class="m-bob">
        <rect x="-10" y="-34" width="20" height="21" rx="5" fill="#f4f4f4"/>
        <path d="M-5 -34 L0 -24 L5 -34" stroke="#ffc857" fill="none" stroke-width="1.2"/><rect x="-4" y="-25" width="8" height="6" rx="1" fill="#fff" stroke="#ffc857"/><text x="0" y="-20.6" font-size="3.4" text-anchor="middle" font-weight="800" fill="#1b1530">NERD</text>
        <rect x="3.5" y="-30" width="5" height="5" rx=".8" fill="#5c8dff"/><path d="M4.5 -32 L4.5 -29 M6 -32.5 L6 -29 M7.5 -32 L7.5 -29" stroke="#ff4fa3" stroke-width=".9"/>
        <path d="M-4.5 -35.5 L0 -33.5 L-4.5 -31.5Z M4.5 -35.5 L0 -33.5 L4.5 -31.5Z" fill="#ff4fa3"/>
        <rect class="m-armL" x="-15.5" y="-33" width="5.5" height="14" rx="2.75" fill="#8fe3a1"/><rect class="m-armR" x="10" y="-37" width="5.5" height="13" rx="2.75" fill="#8fe3a1" transform="rotate(-30 12.7 -37)"/>
        <rect x="17" y="-46" width="4" height="7" rx="1.2" fill="#2d3142"/><circle cx="19" cy="-45" r=".9" fill="#ff4f4f"/>
        <path d="M0 -63 Q3.5 -70 0 -74" stroke="#8fe3a1" stroke-width="2" fill="none"/><circle class="m-glow" cx="0" cy="-75" r="2.6" fill="#ffc857"/>
        <ellipse cx="0" cy="-50" rx="14.5" ry="13.5" fill="#8fe3a1"/>
        <g class="m-eyes"><circle cx="-5.6" cy="-51" r="5.2" fill="#fff" fill-opacity=".9" stroke="${INK}" stroke-width="1.8"/><circle cx="5.6" cy="-51" r="5.2" fill="#fff" fill-opacity=".9" stroke="${INK}" stroke-width="1.8"/><circle cx="-5" cy="-50.6" r="1.9" fill="${INK}"/><circle cx="6.2" cy="-50.6" r="1.9" fill="${INK}"/></g>
        <rect x="-1.3" y="-52.5" width="2.6" height="3" fill="#fff" stroke="#c9d0ee" stroke-width=".5"/>
        <path d="M-4 -42.5 Q0 -39.5 4 -42.5" stroke="${INK}" fill="none" stroke-width="1.2"/><rect x="-1.5" y="-42" width="3" height="2" fill="#fff"/></g>`,
      act: c => panel(c, `
        <rect x="30" y="-118" width="88" height="44" rx="2" fill="#f4f4f4"/><rect x="72" y="-74" width="4" height="4" fill="#8d97bd"/>
        <g opacity="0">${show(0.01, 0.32, 4.5)}${T(74, -96, 14, "&lt;/&gt;", `text-anchor="middle" font-weight="800" fill="#1b1530" class="m-mono"`)}${T(74, -84, 6, "LIGHTNING TALK", `text-anchor="middle" fill="${c}" class="m-mono"`)}</g>
        <g opacity="0">${show(0.34, 0.65, 4.5)}${[14, 24, 18, 32].map((h, i) => `<rect x="${48 + i * 12}" y="${-80 - h}" width="8" height="${h}" fill="${["#5c8dff", "#ff4fa3", "#ffc857", c][i]}"/>`).join("")}</g>
        <g opacity="0">${show(0.67, 0.98, 4.5)}${T(74, -94, 11, "🤖 + 🧑 = 🎉", `text-anchor="middle"`)}${T(74, -83, 6, "Q&amp;A TIME", `text-anchor="middle" fill="#1b1530" class="m-mono"`)}</g>`, "talks · meetups · nerds")
    },

    /* ---------- Marvelous: an original caped hero (Maven) who builds the right room ---------- */
    marvelous: {
      body: () => `<g class="m-bob">
        <path class="m-cape" d="M-10 -40 Q-22 -20 -17 -6 L-5 -13 L0 -7 L5 -13 L17 -6 Q22 -20 10 -40Z" fill="#ffc857"/>
        <g class="m-legs"><rect class="m-legL" x="-8" y="-17" width="6.5" height="15" rx="3" fill="#7b4fc4"/><rect class="m-legR" x="1.5" y="-17" width="6.5" height="15" rx="3" fill="#7b4fc4"/><rect x="-8.5" y="-6" width="7.5" height="5" rx="2" fill="#ffc857"/><rect x="1" y="-6" width="7.5" height="5" rx="2" fill="#ffc857"/></g>
        <path d="M-10 -39 L10 -39 L9 -16 L-9 -16Z" fill="#7b4fc4"/><rect x="-9.5" y="-19" width="19" height="3" fill="#ffc857"/>
        <path d="M0 -35 L2 -31 L6.5 -31 L3 -28 L4.3 -23.5 L0 -26 L-4.3 -23.5 L-3 -28 L-6.5 -31 L-2 -31Z" fill="#ffc857"/>
        <path class="m-armR" d="M10 -37 L16 -53" stroke="#7b4fc4" stroke-width="5.5" stroke-linecap="round"/><circle cx="16.5" cy="-55" r="3.6" fill="#ffc857"/>
        <path class="m-armL" d="M-10 -37 L-14 -23" stroke="#7b4fc4" stroke-width="5.5" stroke-linecap="round"/><circle cx="-14.5" cy="-21.5" r="3.2" fill="#ffc857"/>
        <rect x="-2" y="-44" width="4" height="5" fill="#d9a07a"/>
        <circle cx="0" cy="-50" r="10" fill="#e8b98f"/>
        <path d="M-10.5 -51 Q-9 -63 2 -61.5 Q11 -61 10.5 -50 Q6 -57 -2 -56 Q-7 -55 -10.5 -51Z" fill="#2a1d14"/><path d="M1 -61 Q5 -66 3 -58" stroke="#2a1d14" stroke-width="1.6" fill="none"/>
        <path d="M-9.5 -52 L9.5 -52 L8.5 -46.5 L2 -47.5 L0 -45.5 L-2 -47.5 L-8.5 -46.5Z" fill="#ffc857"/>
        <g class="m-eyes"><ellipse cx="-4.2" cy="-49.3" rx="2" ry="1.2" fill="#fff"/><ellipse cx="4.2" cy="-49.3" rx="2" ry="1.2" fill="#fff"/></g>
        <path d="M-3 -43.5 Q0 -41.5 3 -43.5" stroke="#7a3d2a" fill="none" stroke-width="1.1"/></g>`,
      act: c => panel(c, `
        <ellipse cx="74" cy="-96" rx="26" ry="11" fill="#2a1d3d" stroke="${c}" stroke-width="1.2"/>
        ${T(74, -93.5, 6.5, "THE RIGHT ROOM", `text-anchor="middle" fill="#eaf0ff" class="m-mono"`)}
        ${Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2, x = 74 + Math.cos(a) * 36, y = -96 + Math.sin(a) * 17; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#3a4266"><animate attributeName="fill" values="#3a4266;#3a4266;${c};${c};#3a4266" keyTimes="0;${(0.05 + i * 0.09).toFixed(2)};${(0.1 + i * 0.09).toFixed(2)};.95;1" dur="4.4s" repeatCount="indefinite"/></circle>`; }).join("")}
        <g opacity="0">${show(0.82, 0.98, 4.4)}<rect x="96" y="-121" width="30" height="11" rx="5.5" fill="${c}"/>${T(111, -113.5, 6, "92 ✓", `text-anchor="middle" font-weight="800" fill="#1b1530"`)}</g>`, "invites the right guests")
    },

    /* ---------- Hirey: an intro octopus, a contact card in every arm ---------- */
    hirey: {
      body: () => `<g class="m-bob">
        ${[[-17, -4, -24, 2], [-11, -2, -15, 4], [-4, -1, -5, 5], [4, -1, 5, 5], [11, -2, 15, 4], [17, -4, 24, 2]].map(([x1, y1, x2, y2], i) => `<path class="m-tent" style="animation-delay:${i * 0.12}s" d="M${x1 * 0.6} -14 Q${x1} ${y1 - 6} ${x2} ${y2 - 2}" stroke="#3fb8ad" stroke-width="5" fill="none" stroke-linecap="round"/>`).join("")}
        <path class="m-armL" d="M-12 -24 Q-22 -30 -24 -40" stroke="#3fb8ad" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path class="m-armR" d="M12 -24 Q22 -30 24 -40" stroke="#3fb8ad" stroke-width="5" fill="none" stroke-linecap="round"/>
        <g transform="translate(-31 -51) rotate(-12)"><rect width="13" height="9" rx="1.6" fill="#fff" stroke="#4fd1c5"/><circle cx="3.6" cy="4.5" r="2" fill="#ff4fa3"/><path d="M7 3 L11 3 M7 6 L10 6" stroke="#8d97bd" stroke-width=".9"/></g>
        <g transform="translate(19 -52) rotate(12)"><rect width="13" height="9" rx="1.6" fill="#fff" stroke="#4fd1c5"/><circle cx="3.6" cy="4.5" r="2" fill="#ffc857"/><path d="M7 3 L11 3 M7 6 L10 6" stroke="#8d97bd" stroke-width=".9"/></g>
        <ellipse cx="0" cy="-36" rx="17" ry="20" fill="#4fd1c5"/>
        <ellipse cx="-6" cy="-46" rx="5" ry="3" fill="#fff" opacity=".3"/>
        <circle cx="-9" cy="-28" r="1.6" fill="#2f9e94"/><circle cx="10" cy="-31" r="1.3" fill="#2f9e94"/><circle cx="6" cy="-24" r="1.1" fill="#2f9e94"/>
        <g class="m-eyes"><ellipse cx="-6" cy="-36" rx="3.6" ry="4.4" fill="#fff"/><ellipse cx="6" cy="-36" rx="3.6" ry="4.4" fill="#fff"/><circle cx="-5.4" cy="-35.4" r="2" fill="${INK}"/><circle cx="6.6" cy="-35.4" r="2" fill="${INK}"/></g>
        <path d="M-3.5 -28.5 Q0 -25.5 3.5 -28.5" stroke="${INK}" fill="none" stroke-width="1.3"/>
        <ellipse cx="-11" cy="-30" rx="2.4" ry="1.3" fill="#ff8fab" opacity=".7"/><ellipse cx="11" cy="-30" rx="2.4" ry="1.3" fill="#ff8fab" opacity=".7"/>
        <path d="M-5 -16.5 L0 -14 L-5 -11.5Z M5 -16.5 L0 -14 L5 -11.5Z" fill="#ff4fa3"/><circle cx="0" cy="-14" r="1.4" fill="#d63c8c"/></g>`,
      act: c => panel(c, `
        ${[["🧑‍💻", 34, -104, "#ff4fa3"], ["🧑‍🎨", 34, -80, "#ffc857"], ["🧑‍🔬", 114, -104, "#7cc8ff"], ["🧑‍🏫", 114, -80, "#b6ff5c"]].map(([e, x, y, col]) => `<circle cx="${x}" cy="${y}" r="8" fill="${col}"/>${T(x, y + 3, 8.5, e, `text-anchor="middle"`)}`).join("")}
        <circle cx="74" cy="-92" r="9" fill="${c}"/>${T(74, -89, 9, "🐙", `text-anchor="middle"`)}
        <path d="M43 -104 Q60 -108 65 -96 M43 -80 Q60 -76 65 -88" stroke="${c}" stroke-width="1.6" fill="none" stroke-dasharray="20" stroke-dashoffset="20"><animate attributeName="stroke-dashoffset" values="20;0;0;20" keyTimes="0;.3;.9;1" dur="3.6s" repeatCount="indefinite"/></path>
        <path d="M105 -104 Q88 -108 83 -96 M105 -80 Q88 -76 83 -88" stroke="${c}" stroke-width="1.6" fill="none" stroke-dasharray="20" stroke-dashoffset="20"><animate attributeName="stroke-dashoffset" values="20;20;0;0;20" keyTimes="0;.3;.55;.9;1" dur="3.6s" repeatCount="indefinite"/></path>
        <g opacity="0">${show(0.6, 0.92, 3.6)}<rect x="52" y="-120" width="44" height="11" rx="5.5" fill="${c}"/>${T(74, -112.4, 6, "🤝 2 warm intros", `text-anchor="middle" font-weight="800" fill="#06201d"`)}</g>`, "an arm for everyone")
    },

    /* ---------- Partnr Network: a bridge-building beaver ---------- */
    partnr: {
      body: () => `${legs("#6b4126", -9, 2, 7, 12)}<g class="m-bob">
        <path d="M-10 -12 Q-26 -10 -28 -2 Q-18 2 -8 -6Z" fill="#5a3a22"/><path d="M-24 -6 L-14 -8 M-25 -3 L-13 -5" stroke="#3b2618" stroke-width=".8"/>
        <ellipse cx="0" cy="-25" rx="14" ry="14" fill="#a8642f"/><ellipse cx="1" cy="-22" rx="8.5" ry="9" fill="#e3c39a"/>
        <rect x="-12" y="-30" width="24" height="4" rx="1.5" fill="#ff8fab"/>
        <rect class="m-armL" x="-17" y="-33" width="6" height="14" rx="3" fill="#a8642f"/>
        <g transform="translate(-26 -24) rotate(-8)"><rect width="10" height="13" rx="1.5" fill="#2f5aa8"/><circle cx="5" cy="5.5" r="2.4" fill="none" stroke="#ffc857" stroke-width=".9"/><path d="M2.6 5.5 L7.4 5.5" stroke="#ffc857" stroke-width=".7"/></g>
        <g transform="translate(9 -45) rotate(-20)"><rect width="26" height="5.5" rx="1.2" fill="#c8955a" stroke="#7b4a2a" stroke-width=".8"/><path d="M6 0 L6 5.5 M13 0 L13 5.5 M20 0 L20 5.5" stroke="#7b4a2a" stroke-width=".6"/></g>
        <rect class="m-armR" x="10" y="-40" width="6" height="15" rx="3" fill="#a8642f" transform="rotate(-25 13 -40)"/>
        <circle cx="-10" cy="-58" r="3.4" fill="#a8642f"/><circle cx="10" cy="-58" r="3.4" fill="#a8642f"/>
        <ellipse cx="0" cy="-49" rx="12.5" ry="11.5" fill="#a8642f"/>
        <ellipse cx="0" cy="-44.5" rx="7" ry="5" fill="#e3c39a"/>
        <ellipse cx="0" cy="-47.5" rx="2.6" ry="1.9" fill="#3b2618"/>
        <rect x="-2.6" y="-42" width="2.4" height="3.6" rx=".5" fill="#fff"/><rect x=".2" y="-42" width="2.4" height="3.6" rx=".5" fill="#fff"/>
        <g class="m-eyes"><circle cx="-5" cy="-52" r="1.7" fill="${INK}"/><circle cx="5" cy="-52" r="1.7" fill="${INK}"/></g>
        <path d="M-11 -57 Q0 -70 11 -57Z" fill="#ff8fab"/><rect x="-13" y="-58" width="26" height="3" rx="1.5" fill="#e0607f"/></g>`,
      act: c => panel(c, `
        <path d="M24 -78 Q30 -90 40 -86 L40 -74 L24 -74Z" fill="#3ddc97" opacity=".55"/>${T(28, -79, 8, "🎓", "")}
        <path d="M124 -78 Q118 -92 108 -86 L108 -74 L124 -74Z" fill="#7cc8ff" opacity=".55"/>${T(110, -79, 8, "🏙️", "")}
        <path d="M30 -96 Q74 -126 118 -96" fill="none" stroke="#2a355e" stroke-width="1" stroke-dasharray="2 3"/>
        ${Array.from({ length: 9 }, (_, i) => { const t = (i + 0.5) / 9, x = (1 - t) ** 2 * 40 + 2 * (1 - t) * t * 74 + t * t * 108, y = (1 - t) ** 2 * -86 + 2 * (1 - t) * t * -112 + t * t * -86; return `<rect x="${(x - 3).toFixed(1)}" y="${(y - 2).toFixed(1)}" width="6.5" height="4" rx=".8" fill="#c8955a" stroke="#7b4a2a" stroke-width=".5" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${(0.04 + i * 0.06).toFixed(2)};${(0.08 + i * 0.06).toFixed(2)};.94;1" dur="4.4s" repeatCount="indefinite"/></rect>`; }).join("")}
        <circle r="3.2" fill="${c}" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.62;.64;.92;1" dur="4.4s" repeatCount="indefinite"/><animateMotion dur="4.4s" repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;.62;.92;1" calcMode="linear" path="M40 -91 Q74 -117 108 -91"/></circle>`, "builds bridges for talent")
    },

    /* ---------- AWS: a friendly cloud who runs the Loft ---------- */
    aws: {
      body: () => `${legs("#2d3142", -8, 1.5, 6.5, 12)}<g class="m-bob">
        <path d="M-17 -16 Q-25 -16 -24 -25 Q-24 -33 -15 -32 Q-15 -44 -3 -45 Q4 -55 15 -48 Q25 -48 24 -37 Q31 -33 27 -24 Q26 -16 18 -16Z" fill="#f4f6ff" stroke="#c9d0ee" stroke-width="1"/>
        <ellipse cx="-6" cy="-40" rx="6" ry="3" fill="#fff"/>
        <path d="M-15 -19 Q2 -14 19 -19 L19 -15 Q2 -10 -15 -15Z" fill="#ff9900"/><path d="M12 -16 L18 -5 L13 -4 L9 -14Z" fill="#ff9900"/>
        <g class="m-eyes"><ellipse cx="-4" cy="-31" rx="1.9" ry="2.4" fill="${INK}"/><ellipse cx="7" cy="-31" rx="1.9" ry="2.4" fill="${INK}"/></g>
        <path d="M-1 -26 Q1.5 -23.5 4 -26" stroke="${INK}" fill="none" stroke-width="1.3"/>
        <ellipse cx="-8.5" cy="-27" rx="2.2" ry="1.2" fill="#ffb27a" opacity=".8"/><ellipse cx="11.5" cy="-27" rx="2.2" ry="1.2" fill="#ffb27a" opacity=".8"/>
        <path class="m-armL" d="M-21 -24 L-27 -16" stroke="#e6ebfa" stroke-width="5" stroke-linecap="round"/>
        <path class="m-armR" d="M24 -27 L30 -38" stroke="#e6ebfa" stroke-width="5" stroke-linecap="round"/>
        <g transform="translate(27 -48)"><circle cx="3" cy="3" r="3.2" fill="none" stroke="#ffc857" stroke-width="1.6"/><path d="M5.5 5 L11 10.5 M9 8.5 L10.5 7 M10.5 10 L12 8.5" stroke="#ffc857" stroke-width="1.6" stroke-linecap="round"/></g></g>`,
      act: c => panel(c, `
        ${[0, 1, 2].map(i => `<rect x="${28 + i * 22}" y="-116" width="18" height="40" rx="2.5" fill="#1d2440" stroke="#3a4266"/>${[0, 1, 2, 3, 4].map(j => `<rect x="${31 + i * 22}" y="${-112 + j * 7}" width="12" height="3.5" rx="1" fill="#2a355e"/><circle cx="${45 + i * 22}" cy="${-110.2 + j * 7}" r="1.1" fill="${(i + j) % 3 ? "#3ddc97" : c}"><animate attributeName="opacity" values="1;.2;1" dur="${0.6 + ((i * 5 + j) % 4) * 0.25}s" repeatCount="indefinite"/></circle>`).join("")}`).join("")}
        <g opacity="0">${show(0.08, 0.95, 4)}<rect x="96" y="-116" width="28" height="40" rx="3" fill="#2c3657" stroke="${c}"/><rect x="101" y="-108" width="18" height="32" fill="#ffcf7a" opacity=".85"/>${T(110, -110, 5, "LOFT", `text-anchor="middle" fill="${c}" font-weight="800" class="m-mono"`)}</g>
        ${T(110, -82, 5.5, "OPEN", `text-anchor="middle" fill="#1b1530" font-weight="800" class="m-mono"`)}`, "doors open · servers up")
    },

    /* ---------- Crewbase Collective (host): Captain Circuit, a blue armored hero with circuit lines ---------- */
    crewbase: {
      body: () => `<g class="m-legs"><rect class="m-legL" x="-10" y="-17" width="8" height="17" rx="2.5" fill="#1f5fd1"/><rect class="m-legR" x="2" y="-17" width="8" height="17" rx="2.5" fill="#1f5fd1"/>
        <rect x="-11" y="-3" width="10" height="3" rx="1" fill="#0e2f78"/><rect x="1" y="-3" width="10" height="3" rx="1" fill="#0e2f78"/>
        <ellipse class="m-glow" cx="-6" cy="1.5" rx="4" ry="1.6" fill="#7fe7ff" opacity=".8"/><ellipse class="m-glow" cx="6" cy="1.5" rx="4" ry="1.6" fill="#7fe7ff" opacity=".8"/></g>
        <g class="m-bob">
        <path d="M-15 -40 L15 -40 L12 -16 L-12 -16Z" fill="#2f7bff" stroke="#0e2f78" stroke-width="1"/>
        <path d="M-12 -20 L12 -20 L11 -15 L-11 -15Z" fill="#1a4fb8"/>
        <path d="M-11 -36 L-6 -36 L-6 -28 L-2 -28 M11 -36 L6 -36 L6 -26 L2 -26 M-9 -22 L-3 -22 M9 -22 L4 -22" stroke="#7fe7ff" stroke-width=".9" fill="none" stroke-dasharray="3 2"><animate attributeName="stroke-dashoffset" values="10;0" dur="1.2s" repeatCount="indefinite"/></path>
        <circle cx="0" cy="-31" r="5.2" fill="#0b1a3d" stroke="#7fe7ff" stroke-width="1.2"/>
        <circle class="m-glow" cx="0" cy="-31" r="3.2" fill="#c9f6ff"><animate attributeName="r" values="2.6;3.6;2.6" dur="1.6s" repeatCount="indefinite"/></circle>
        <rect class="m-armL" x="-21" y="-39" width="7" height="18" rx="3" fill="#2f7bff" stroke="#0e2f78" stroke-width=".8"/>
        <circle cx="-17.5" cy="-20" r="2.6" fill="#7fe7ff" opacity=".85"/>
        <g transform="rotate(-150 17 -37)"><g class="m-armR"><rect x="14" y="-39" width="7" height="18" rx="3" fill="#2f7bff" stroke="#0e2f78" stroke-width=".8"/><circle class="m-glow" cx="17.5" cy="-20" r="3.4" fill="#c9f6ff"/></g></g>
        <path d="M-16 -41 Q-10 -46 0 -45 Q10 -46 16 -41 L14 -37 L-14 -37Z" fill="#1f5fd1"/>
        <path d="M-11 -50 Q-12 -64 0 -65 Q12 -64 11 -50 L9 -43 L-9 -43Z" fill="#2f7bff" stroke="#0e2f78" stroke-width="1"/>
        <path d="M-7 -58 L7 -58 L6 -46 L0 -44 L-6 -46Z" fill="#cfe3ff"/>
        <path d="M0 -65 L0 -58 M-11 -54 L-7 -54 M11 -54 L7 -54" stroke="#7fe7ff" stroke-width=".8"/>
        <g class="m-eyes"><path d="M-5.6 -54 L-1.6 -53 L-1.8 -51.6 L-5.4 -52.4Z M5.6 -54 L1.6 -53 L1.8 -51.6 L5.4 -52.4Z" fill="#7fe7ff"/></g>
        <path d="M-3 -48 L3 -48" stroke="#5a7bb8" stroke-width="1"/></g>`,
      act: c => panel(c, `
        <path d="M74 -96 L44 -96 L44 -112 L34 -112 M74 -96 L44 -96 L44 -80 L34 -80 M74 -96 L104 -96 L104 -112 L114 -112 M74 -96 L104 -96 L104 -80 L114 -80" fill="none" stroke="#21406f" stroke-width="2"/>
        ${[["M74 -96 L44 -96 L44 -112 L34 -112", 0], ["M74 -96 L104 -96 L104 -112 L114 -112", 0.4], ["M74 -96 L44 -96 L44 -80 L34 -80", 0.8], ["M74 -96 L104 -96 L104 -80 L114 -80", 1.2]].map(([d, b]) => `<circle r="2.4" fill="#c9f6ff"><animateMotion dur="1.6s" begin="${b}s" repeatCount="indefinite" path="${d}"/></circle>`).join("")}
        ${[["🎬", 30, -112], ["🎮", 30, -80], ["🎓", 118, -112], ["☁️", 118, -80]].map(([e, x, y]) => `<circle cx="${x}" cy="${y}" r="7.5" fill="#132a55" stroke="${c}"/>${T(x, y + 3, 8, e, `text-anchor="middle"`)}`).join("")}
        <rect x="60" y="-106" width="28" height="20" rx="3" fill="#132a55" stroke="${c}" stroke-width="1.4"/>
        ${T(74, -93.5, 6.5, "CREW", `text-anchor="middle" fill="#c9f6ff" font-weight="800" class="m-mono"`)}
        <rect x="60" y="-106" width="28" height="20" rx="3" fill="none" stroke="#c9f6ff" stroke-width="1"><animate attributeName="opacity" values=".1;1;.1" dur="1.6s" repeatCount="indefinite"/></rect>`, "hosts · connects · runs the day")
    },

    /* ---------- LingCode (partner): Appy, a walking phone that builds your app on its own screen ---------- */
    lingcode: {
      body: c => `${legs("#2d3142", -8, 1.5, 6.5, 12)}<g class="m-bob">
        <rect class="m-armL" x="-19" y="-44" width="5.5" height="16" rx="2.7" fill="#2d3142"/>
        <g transform="rotate(-140 16 -44)"><rect class="m-armR" x="13.5" y="-44" width="5.5" height="16" rx="2.7" fill="#2d3142"/></g>
        <rect x="-14" y="-66" width="28" height="54" rx="6" fill="#10172f" stroke="${c}" stroke-width="2"/>
        <rect x="-4" y="-63.5" width="8" height="2" rx="1" fill="#2d3142"/>
        <rect x="-11" y="-59" width="22" height="42" rx="2.5" fill="#0b1022"/>
        <g class="m-eyes"><circle cx="-4.5" cy="-52" r="2" fill="${c}"/><circle cx="4.5" cy="-52" r="2" fill="${c}"/></g>
        <path d="M-3 -47.5 Q0 -45 3 -47.5" stroke="${c}" fill="none" stroke-width="1.2"/>
        <rect x="-8" y="-42" width="16" height="3" rx="1.5" fill="#2a3260"><animate attributeName="width" values="4;16;16" dur="2.4s" repeatCount="indefinite"/></rect>
        <rect x="-8" y="-37" width="11" height="3" rx="1.5" fill="#2a3260"/>
        <rect x="-8" y="-31" width="16" height="7" rx="3.5" fill="${c}"/><text x="0" y="-26" font-size="4.2" text-anchor="middle" font-weight="800" fill="#0b1022">PAY</text>
        <rect x="-6" y="-14.5" width="12" height="1.4" rx=".7" fill="#3a4266"/>
        <g transform="translate(20 -78)"><rect width="14" height="14" rx="3.5" fill="#2f7bff"/><path d="M4 10 L7 3.5 L10 10 M5 8 L9 8" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/></g></g>`,
      act: c => panel(c, `
        ${[["💬", "idea", 0.02], ["🛠️", "build", 0.22], ["💳", "payments", 0.42], ["🚀", "in the store", 0.62]].map(([e, t, at], i) => `<g opacity="0">${show(at, 0.96, 4.6)}<circle cx="${34 + i * 27}" cy="-100" r="9" fill="${c}" fill-opacity=".2" stroke="${c}" stroke-width=".9"/>${T(34 + i * 27, -97, 9, e, `text-anchor="middle"`)}${T(34 + i * 27, -82, 5.2, t, `text-anchor="middle" fill="#eaf0ff"`)}</g>`).join("")}
        <path d="M43 -100 L52 -100 M70 -100 L79 -100 M97 -100 L106 -100" stroke="#3a4266" stroke-width="1.2"/>`, "idea → app in the store")
    },

    /* ---------- HarnessRouter (partner): Switch, a crab with a switchboard shell routing tasks to harnesses ---------- */
    harnessrouter: {
      body: c => `${[-14, -8, 8, 14].map((x, i) => `<path class="${i < 2 ? "m-legL" : "m-legR"}" d="M${x * 0.6} -10 L${x} -2 L${x + (x < 0 ? -3 : 3)} 0" stroke="#d9772a" stroke-width="2.6" fill="none" stroke-linecap="round"/>`).join("")}
        <g class="m-bob">
        <path class="m-armL" d="M-15 -22 Q-24 -30 -22 -40" stroke="#d9772a" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M-27 -44 Q-22 -50 -17 -44 L-20 -40 L-22 -43 L-24 -40Z" fill="${c}"/>
        <path class="m-armR" d="M15 -22 Q24 -30 22 -40" stroke="#d9772a" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M17 -44 Q22 -50 27 -44 L24 -40 L22 -43 L20 -40Z" fill="${c}"/>
        <ellipse cx="0" cy="-22" rx="18" ry="12" fill="${c}"/>
        <rect x="-11" y="-28" width="22" height="9" rx="2" fill="#10172f"/>
        ${[-7, 0, 7].map((x, i) => `<circle cx="${x}" cy="-23.5" r="1.8" fill="${["#3ee6ff", "#ff4fa3", "#b6ff5c"][i]}"><animate attributeName="opacity" values="1;.25;1" dur="1.2s" begin="${i * 0.4}s" repeatCount="indefinite"/></circle>`).join("")}
        <path d="M-5 -33 L-6 -40 M5 -33 L6 -40" stroke="#d9772a" stroke-width="1.6"/>
        <g class="m-eyes"><circle cx="-6" cy="-42" r="3.2" fill="#fff"/><circle cx="6" cy="-42" r="3.2" fill="#fff"/><circle cx="-5.6" cy="-41.6" r="1.6" fill="${INK}"/><circle cx="6.4" cy="-41.6" r="1.6" fill="${INK}"/></g>
        <path d="M-3 -14 Q0 -11.5 3 -14" stroke="${INK}" fill="none" stroke-width="1.1"/></g>`,
      act: c => panel(c, `
        <rect x="30" y="-104" width="20" height="16" rx="3" fill="${c}"/>${T(40, -93.5, 6, "TASK", `text-anchor="middle" font-weight="800" fill="#1b1530" class="m-mono"`)}
        ${[["#3ee6ff", -112], ["#ff4fa3", -96], ["#b6ff5c", -80]].map(([col, y], i) => `<path d="M50 -96 C70 -96 72 ${y} 92 ${y}" stroke="#2a355e" stroke-width="1.4" fill="none"/>
          <rect x="92" y="${y - 6}" width="28" height="12" rx="3" fill="#161c3a" stroke="${col}" stroke-width="1"/>${T(106, y + 2, 5, "harness " + (i + 1), `text-anchor="middle" fill="#eaf0ff"`)}
          <circle r="2.4" fill="${col}" opacity="0"><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.05;.9;1" dur="3.6s" begin="${i * 1.2}s" repeatCount="indefinite"/><animateMotion dur="3.6s" begin="${i * 1.2}s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;.4;1" calcMode="linear" path="M50 -96 C70 -96 72 ${y} 92 ${y}"/></circle>`).join("")}`, "routes tasks to harnesses")
    },

    /* ---------- fallback for any sponsor without custom art ---------- */
    _robot: {
      body: c => `${legs("#7f8ea3", -9, 2, 7, 14)}<g class="m-bob"><rect x="-11" y="-34" width="22" height="21" rx="6" fill="${c}"/>
        <rect class="m-armL" x="-16" y="-32" width="5" height="14" rx="2.5" fill="#7f8ea3"/><rect class="m-armR" x="11" y="-32" width="5" height="14" rx="2.5" fill="#7f8ea3"/>
        <rect x="-12" y="-60" width="24" height="22" rx="7" fill="#e6ecff"/><g class="m-eyes"><circle cx="-5" cy="-50" r="2.4" fill="${c}"/><circle cx="5" cy="-50" r="2.4" fill="${c}"/></g>
        <path d="M0 -60 L0 -66" stroke="#7f8ea3" stroke-width="2"/><circle class="m-glow" cx="0" cy="-68" r="2.6" fill="${c}"/></g>`,
      act: c => panel(c, `<circle cx="74" cy="-96" r="12" fill="${c}"><animate attributeName="r" values="8;14;8" dur="1.6s" repeatCount="indefinite"/></circle>`, "powering the agents")
    }
  };

  const FLY = { finch: true, marvelous: true };
  const art = id => ART[id] || ART._robot;
  /* pattern ids must be unique per document: rename okGrid / pnArc per instance */
  let uid = 0;
  const uniq = s => { const n = ++uid; return s.replace(/okGrid/g, "okGrid" + n).replace(/pnArc/g, "pnArc" + n); };
  return {
    has: id => !!ART[id],
    fly: id => !!FLY[id],
    body: id => art(id).body(colorOf(id)),
    act: id => uniq(art(id).act(colorOf(id))),
    svg(id, o) {
      o = o || {};
      const vb = o.act ? "-34 -128 168 134" : FLY[id] ? "-30 -50 60 54" : "-32 -84 64 88";
      return `<svg class="mascot-svg ${o.act ? "with-act" : ""}" viewBox="${vb}" role="img" aria-label="${o.label || id + " mascot"}"><g class="mascot ${o.walk ? "walking" : ""}">${art(id).body(colorOf(id))}</g>${o.act ? `<g class="m-actwrap on">${uniq(art(id).act(colorOf(id)))}</g>` : ""}</svg>`;
    }
  };
})();

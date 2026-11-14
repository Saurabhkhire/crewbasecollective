/* =========================================================
   LiveCast: a short, looping on-stage conversation between characters.
     LiveCast.mount(stageEl, { scene, actors: [{ id, tag, c? }], script: [[actorIndex, text, emotion, gesture], …], label? })
   Used by the home hero (site.js) and by every track on tracks.html (cast lives in data.js → tracks[].cast).
   Needs play-data.js (PLAY.characters), puppet.js, scenes.js. Styles: .hs-* in styles.css.
   ========================================================= */
window.LiveCast = (function () {
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const COLORS = ["var(--grow)", "var(--game)", "var(--film)", "#c48bff", "#ffc857"];
  function mount(stage, cfg) {
    if (!stage || !cfg || !window.Puppet || !window.Scenes || !window.PLAY) return null;
    const chars = cfg.actors.map(a => PLAY.characters.find(c => c.id === a.id)).filter(Boolean);
    if (chars.length !== cfg.actors.length) return null;
    const n = cfg.actors.length, X = cfg.actors.map((a, i) => a.x != null ? a.x : Math.round(14 + (72 * i) / Math.max(1, n - 1)));
    const C = cfg.actors.map((a, i) => a.c || COLORS[i % COLORS.length]);
    const first = c => c.name.replace(/^(Dr\.|Prof\.|Captain|General|Lady|Old)\s+/, "").split(" ")[0];
    Scenes.mount(stage, cfg.scene || { base: "office", time: "sunset", weather: "clear" });
    stage.insertAdjacentHTML("beforeend", `
      <div class="hs-tag mono"><span class="live-dot"></span> ${esc(cfg.label || "LIVE CAST")}</div>
      <div class="hs-light"></div>
      <div class="hs-cam">${cfg.actors.map((a, i) => `<div class="hs-actor" style="--c:${C[i]};--d:${i * 0.15}s;left:${X[i]}%"><div class="hs-pup"></div><span class="hs-t">${esc(first(chars[i]))}</span></div>`).join("")}</div>
      <div class="hs-sub" aria-live="polite"><b class="hs-who"></b><span class="hs-line"></span></div>`);
    const actors = [...stage.querySelectorAll(".hs-actor")];
    const pups = actors.map((a, i) => { Puppet.mount(a.querySelector(".hs-pup"), chars[i]); return a.querySelector(".pup"); });
    const who = stage.querySelector(".hs-who"), lineEl = stage.querySelector(".hs-line"), cam = stage.querySelector(".hs-cam"), light = stage.querySelector(".hs-light");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    if ("IntersectionObserver" in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(stage);
    let k = 0, typer = null;
    const beat = () => {
      if (!visible || document.hidden) { setTimeout(beat, 800); return; }
      const [i, text, emo, gest] = cfg.script[k % cfg.script.length];
      const sx = X[i];
      actors.forEach((a, j) => {
        a.classList.toggle("on", j === i);
        if (j !== i) { Puppet.face(pups[j], X[j] > sx ? -1 : 1); Puppet.emotion(pups[j], Math.random() < 0.5 ? "neutral" : "calm"); }
      });
      Puppet.face(pups[i], sx > 50 ? -1 : 1);
      Puppet.emotion(pups[i], emo || "neutral");
      Puppet.gesture(pups[i], gest || "nod", 1800);
      const talkMs = Math.min(3600, 900 + text.length * 32);
      Puppet.talk(pups[i], talkMs);
      const listener = (i + 1 + (k % 3)) % n;
      if (listener !== i) setTimeout(() => Puppet.gesture(pups[listener], ["nod", "nod", "shrug"][k % 3], 1200), talkMs * 0.55);
      light.style.left = sx + "%";
      if (!reduce) cam.style.transform = `scale(1.045) translateX(${(50 - sx) * 0.06}%)`;
      who.textContent = first(chars[i]) + " · " + cfg.actors[i].tag;
      who.style.color = C[i];
      clearInterval(typer);
      if (reduce) lineEl.textContent = text;
      else { let m = 0; lineEl.textContent = ""; typer = setInterval(() => { m += 2; lineEl.textContent = text.slice(0, m); if (m >= text.length) clearInterval(typer); }, 28); }
      k++;
      setTimeout(beat, talkMs + 1500);
    };
    setTimeout(beat, 900);
    return {};
  }
  return { mount };
})();

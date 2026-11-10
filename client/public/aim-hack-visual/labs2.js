/* Sponsor Labs, part 2: AdaL (image + video), Bruin (data), Finch (skills), Casuro (voice interview).
   Registers into window.__LABS__.LABS created by labs.js. */
(function () {
  const L = window.__LABS__;
  if (!L) return;
  const { LABS, $, $$, esc, rand, clamp, wait, ease, charById, first, sp, speak, hush, rr, wrapLines, textBox, drawCover, drawPup } = L;
  const P = window.PLAY;

  /* =========================================================
     2 · AdaL — image & video generation
     ========================================================= */
  const STYLES = [
    { id: "cinematic", label: "🎬 Cinematic", prompt: "cinematic film still, dramatic lighting, shallow depth of field" },
    { id: "3d", label: "🧸 3D animated", prompt: "3D animated movie style, soft global illumination, expressive characters" },
    { id: "anime", label: "🌸 Anime", prompt: "anime key visual, vibrant colors, clean line art" },
    { id: "watercolor", label: "🎨 Watercolor", prompt: "loose watercolor painting, soft paper texture" },
    { id: "comic", label: "💥 Comic", prompt: "bold comic book panel, halftone shading, thick ink outlines" },
    { id: "pixel", label: "👾 Pixel art", prompt: "16-bit pixel art scene" }
  ];
  const KW_SCENE = [[/forest|wood|jungle|camp/, "forest"], [/space|ship|star|galax|planet|orbit/, "space"], [/city|street|neon|downtown|tokyo|new york/, "city"], [/castle|king|queen|throne|knight|dragon|medieval/, "castle"], [/beach|island|ocean|sea|surf/, "beach"], [/school|class|teacher|student/, "classroom"], [/court|judge|trial|lawyer/, "courtroom"], [/kitchen|chef|cook|restaurant|food/, "kitchen"], [/desert|cowboy|cact/, "desert"], [/snow|mountain|ski|ice|winter/, "snow"], [/concert|stage|band|music|singer|rock/, "stage"], [/manor|mansion|murder|mystery|dinner/, "manor"], [/lab|science|experiment|scientist/, "lab"], [/board|meeting|pitch|investor|ceo|startup/, "boardroom"], [/park|picnic|garden|pond/, "park"], [/office|desk|work|coworker/, "office"]];
  const KW_CHAR = [[/robot|android|droid|\bai\b|bot/, "bolt"], [/wizard|mage|magic|witch/, "merlin"], [/chef|cook|bear/, "bruno"], [/alien|ufo/, "zorp"], [/cat|thief|ninja/, "nyx"], [/detective|spy|mystery/, "marlowe"], [/pop|singer|star|music/, "luna"], [/doctor|nurse|medic/, "imani"], [/captain|pilot|astronaut/, "vega"], [/kid|child|boy|girl/, "kit"], [/soldier|general|army/, "hale"], [/princess|queen|lady|heiress/, "ashford"], [/engineer|mechanic|builder/, "jax"], [/professor|teacher|scientist/, "okafor"], [/manager|interview|ceo|boss/, "priya"], [/smuggler|pirate|rogue/, "rook"]];
  function parsePrompt(t) {
    t = String(t).toLowerCase();
    const base = (KW_SCENE.find(([re]) => re.test(t)) || [0, rand(["city", "forest", "space", "beach", "castle", "park"])])[1];
    const time = /night|dark|midnight|moon|neon/.test(t) ? "night" : /sunset|dusk|evening|golden/.test(t) ? "sunset" : "day";
    const weather = /rain|storm/.test(t) ? "rain" : /snow|blizzard/.test(t) ? "snow" : /fog|mist/.test(t) ? "fog" : /firefl|magic/.test(t) ? "fireflies" : /fire|ember|lava/.test(t) ? "embers" : "clear";
    let cast = KW_CHAR.filter(([re]) => re.test(t)).map(x => x[1]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);
    if (!cast.length) cast = [rand(P.characters).id];
    return { base, time, weather, cast };
  }
  /* vector frame: scene + puppets + style filter → canvas */
  async function vectorFrame(spec, style, W, H) {
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    const filt = { cinematic: "contrast(1.08) saturate(1.1)", "3d": "saturate(1.15) brightness(1.04)", anime: "saturate(1.35) contrast(1.05)", watercolor: "saturate(.75) contrast(.92) brightness(1.06)", comic: "contrast(1.3) saturate(1.4)", pixel: "saturate(1.2)" }[style] || "none";
    const scene = await Scenes.toImage({ base: spec.base, time: spec.time, weather: spec.weather }, W, H);
    const pups = await Promise.all((spec.cast || []).map(id => charById(id)).filter(Boolean).map(c => Puppet.toImage(c, Math.round(H * 0.6))));
    const draw = c2 => {
      c2.filter = filt;
      drawCover(c2, scene, W, H);
      pups.forEach((im, i, a) => drawPup(c2, im, W * (a.length === 1 ? 0.5 : 0.28 + i * (0.44 / Math.max(1, a.length - 1))), H * 0.94, H * 0.58));
      c2.filter = "none";
    };
    if (style === "pixel") {
      const s = document.createElement("canvas"); s.width = W / 8; s.height = H / 8;
      const sc = s.getContext("2d"); sc.scale(1 / 8, 1 / 8); draw(sc);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(s, 0, 0, W, H);
    } else draw(ctx);
    if (spec.weather === "rain") { ctx.strokeStyle = "rgba(200,220,255,.45)"; ctx.lineWidth = 2; for (let i = 0; i < 140; i++) { const x = (i * 97) % W, y = (i * 61) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 22); ctx.stroke(); } }
    if (spec.weather === "snow") { ctx.fillStyle = "rgba(255,255,255,.85)"; for (let i = 0; i < 120; i++) { ctx.beginPath(); ctx.arc((i * 97) % W, (i * 53) % H, 2 + (i % 3), 0, 7); ctx.fill(); } }
    if (style === "comic") { ctx.strokeStyle = "#000"; ctx.lineWidth = 14; ctx.strokeRect(7, 7, W - 14, H - 14); }
    if (style === "cinematic") { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H * 0.07); ctx.fillRect(0, H * 0.93, W, H * 0.07); }
    return cv;
  }
  const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

  LABS.push({
    id: "adal", tool: "Image & video generation", playLink: "film",
    title: "Turn one sentence into images and a short video",
    pitch: "Describe a moment. The AdaL agent writes a storyboard, generates a frame for every shot, and cuts them into a narrated video you can download.",
    how: [
      "<b>Describe</b> a scene in one sentence, or tap an example.",
      "<b>Pick a style</b>: cinematic, 3D animated, anime, watercolor, comic or pixel art.",
      "<b>Generate image</b> for a single frame.",
      "<b>Generate video</b>: the agent plans 4–6 shots (scene, characters, camera move, narration), renders each one, and plays them as a video.",
      "<b>⬇ Download</b> records the video to a .webm file. With image generation off, frames are vector previews built from the playground's scenes and characters."
    ],
    demoChars: ["bruno", "bolt"], demoScenes: { city: { base: "city", time: "night", weather: "rain" }, kitchen: { base: "kitchen", time: "night" }, stage: { base: "stage", time: "night" }, forest: { base: "forest", time: "sunset" } },
    demo: [
      { cap: "Describe what you want in one sentence", dur: 3.4, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0d1226"; ctx.fillRect(0, 0, W, H); const txt = "a robot and a bear chef open a noodle bar in a rainy neon city"; ctx.fillStyle = "#151d3d"; rr(ctx, 50, 120, W - 100, 80, 14); ctx.fill(); ctx.strokeStyle = "#c48bff"; ctx.lineWidth = 2; ctx.stroke(); ctx.font = "16px 'Space Grotesk', sans-serif"; ctx.fillStyle = "#eaf0ff"; const shown = txt.slice(0, Math.floor(txt.length * Math.min(1, p * 1.3))); wrapLines(ctx, shown + (p < 0.8 ? "|" : ""), W - 140).forEach((l, i) => ctx.fillText(l, 70, 152 + i * 22)); ctx.fillStyle = "#c48bff"; rr(ctx, W - 230, 222, 180, 40, 20); ctx.fill(); ctx.fillStyle = "#0a0d1a"; ctx.font = "700 14px 'Space Grotesk', sans-serif"; ctx.fillText("🎬 Generate video", W - 210, 247); } },
      { cap: "The agent plans a storyboard, shot by shot", dur: 3.6, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0d1226"; ctx.fillRect(0, 0, W, H); ["city", "kitchen", "stage", "forest"].forEach((k, i) => { const a = clamp(p * 4 - i * 0.7, 0, 1); if (!a) return; const x = 30 + i * 148, y = 90; ctx.save(); ctx.globalAlpha = a; ctx.save(); ctx.translate(x, y); rr(ctx, 0, 0, 136, 80, 8); ctx.clip(); drawCover(ctx, A.s[k], 136, 80); ctx.restore(); ctx.fillStyle = "#c9d0ee"; ctx.font = "12px 'Space Grotesk', sans-serif"; ctx.fillText(["1 · Establish", "2 · Meet the cooks", "3 · Rush hour", "4 · Grand finale"][i], x, y + 100); ctx.fillStyle = "#c48bff"; ctx.fillText(["push-in", "pan-left", "zoom-out", "push-in"][i], x, y + 118); ctx.restore(); }); } },
      { cap: "Each shot becomes a frame, with a camera move", dur: 4, draw(ctx, p, A, W, H) { drawCover(ctx, A.s.kitchen, W, H, 1 + 0.15 * p); drawPup(ctx, A.p.bruno, W * 0.36 - p * 10, H * 0.96, H * 0.62 * (1 + 0.1 * p)); drawPup(ctx, A.p.bolt, W * 0.64 + p * 10, H * 0.96, H * 0.6 * (1 + 0.1 * p)); } },
      { cap: "Play it as a narrated video, then download it", dur: 3.6, draw(ctx, p, A, W, H) { drawCover(ctx, A.s.city, W, H, 1.12, 0.05 - 0.1 * p); drawPup(ctx, A.p.bolt, W * 0.5, H * 0.95, H * 0.55); ctx.fillStyle = "rgba(0,0,0,.6)"; rr(ctx, 20, 20, 150, 36, 18); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "700 13px 'Space Grotesk', sans-serif"; ctx.fillText("▶ 0:" + String(Math.floor(p * 18)).padStart(2, "0") + " / 0:18", 36, 43); ctx.fillStyle = "#c48bff"; rr(ctx, W - 170, 20, 150, 36, 18); ctx.fill(); ctx.fillStyle = "#0a0d1a"; ctx.fillText("⬇ Download .webm", W - 156, 43); } }
    ],
    build: buildAdal
  });

  function buildAdal(main, coord) {
    coord = coord || { pulse() {} };
    const EX = ["a robot and a bear chef open a noodle bar in a rainy neon city", "a wizard teaches a cat to fly over a misty forest at sunset", "an astronaut captain finds an alien on the starship bridge", "a detective confronts a heiress at a candle-lit manor dinner", "a pop star's final concert on a stage full of lights"];
    const S = { mode: "image", style: "3d", busy: false, video: null, token: 0, images: [] };
    main.innerHTML = `
      <div class="lab-tabs" role="tablist"><button data-m="image" class="on" role="tab">🖼️ Image</button><button data-m="video" role="tab">🎬 Video</button></div>
      <label class="lab-l" for="adPrompt">Describe it</label>
      <textarea id="adPrompt" rows="2" maxlength="400">${esc(EX[0])}</textarea>
      <div class="ex-chips" id="adEx">${EX.map(e => `<button>${esc(e)}</button>`).join("")}</div>
      <label class="lab-l">Style</label>
      <div class="chip-row" id="adStyle">${STYLES.map(s => `<button data-s="${s.id}" class="${s.id === S.style ? "on" : ""}">${s.label}</button>`).join("")}</div>
      <div class="lab-bar"><button class="btn btn-sm" id="adGo">🖼️ Generate image</button><span class="muted small" id="adNote"></span></div>
      <div id="adWork"></div>
      <div id="adOut"></div>`;
    const note = () => { $("#adNote", main).textContent = Brain.images ? (S.mode === "video" ? "Uses up to 4 AI images per video." : "Uses the image model.") : "Image model off: offline vector previews."; };
    $$(".lab-tabs button", main).forEach(b => b.onclick = () => { if (S.busy) return; S.mode = b.dataset.m; $$(".lab-tabs button", main).forEach(x => x.classList.toggle("on", x === b)); $("#adGo", main).textContent = S.mode === "video" ? "🎬 Generate video" : "🖼️ Generate image"; note(); renderOut(); });
    $("#adEx", main).onclick = e => { const b = e.target.closest("button"); if (b) $("#adPrompt", main).value = b.textContent; };
    $("#adStyle", main).onclick = e => { const b = e.target.closest("[data-s]"); if (!b) return; S.style = b.dataset.s; $$("#adStyle button", main).forEach(x => x.classList.toggle("on", x === b)); };
    note();

    function steps(list) {
      const w = $("#adWork", main);
      w.innerHTML = `<div class="ai-work"><b>🤖 AdaL agent at work</b><ol>${list.map((s, i) => `<li data-i="${i}"><i>○</i>${esc(s)}</li>`).join("")}</ol><div class="why"></div></div>`;
      const lis = $$("li", w);
      return {
        set(k, text) { lis.forEach((li, i) => { li.className = i < k ? "done" : i === k ? "on" : ""; li.querySelector("i").textContent = i < k ? "✓" : i === k ? "●" : "○"; }); if (text != null && lis[k]) lis[k].lastChild.textContent = text; },
        why(t) { w.querySelector(".why").textContent = t ? "“" + t + "”" : ""; },
        clear() { w.innerHTML = ""; }
      };
    }
    function renderOut() {
      const out = $("#adOut", main);
      if (S.mode === "image") {
        out.innerHTML = S.images.length ? `<div class="ad-gal">${S.images.map((im, i) => `<figure><img src="${im.src}" alt="${esc(im.prompt)}"><figcaption><span class="tagb ${im.ai ? "ai" : ""}">${im.ai ? "AI image" : "offline preview"}</span>${esc(im.prompt)}<a href="${im.src}" download="adal-image-${i + 1}.${im.ai ? "jpg" : "png"}">⬇</a></figcaption></figure>`).join("")}</div>` : `<p class="muted small">Your images appear here.</p>`;
      } else if (S.video) S.video.mount(out);
      else out.innerHTML = `<p class="muted small">Your video appears here.</p>`;
    }
    renderOut();

    async function genImage(prompt) {
      const st = STYLES.find(s => s.id === S.style);
      const w = steps(["Reading your prompt", Brain.images ? "Generating with the image model" : "Composing a vector preview", "Done"]);
      await wait(300); w.set(1);
      let src = null, ai = false;
      if (Brain.images) { src = await Brain.image(`${prompt}. Style: ${st.prompt}. No text or watermarks.`); ai = !!src; }
      if (!src) { const cv = await vectorFrame(parsePrompt(prompt), S.style, 1024, 576); src = cv.toDataURL("image/png"); }
      w.set(3);
      if (!ai && Brain.images) w.why("The image model didn't answer, so this is an offline vector preview.");
      S.images.unshift({ src, ai, prompt }); S.images = S.images.slice(0, 6);
      renderOut();
      coord.pulse("team", "prompt from an agent", "in");
      coord.pulse("band", ai ? "image shared on #channel" : "preview shared on #channel", "out");
      coord.pulse("bruin", "1 render counted", "out");
    }

    async function genVideo(prompt) {
      const st = STYLES.find(s => s.id === S.style), token = ++S.token;
      const w = steps(["Planning the storyboard", "Rendering frames", "Cutting the video"]);
      const bases = Scenes.BASES.map(b => b.id), ids = P.characters.map(c => `${c.id} (${c.name}, ${c.role})`);
      const sys = `You are AdaL, a video-generation agent. Turn the user's idea into a storyboard for a short 15-25 second video.
Reply with JSON only: {"title":"max 6 words","shots":[{"caption":"narration line, max 16 words","scene_base":"one of: ${bases.join(", ")}","time":"day|sunset|night","weather":"clear|rain|snow|fog|fireflies|embers","characters":["0-3 ids from: ${ids.join("; ")}"],"camera":"push-in|pan-left|pan-right|zoom-out","image_prompt":"vivid visual description for an image model, max 40 words, no text"}]}
Use 4 to 6 shots with a clear beginning, middle and end. Vary the camera moves.`;
      const fallback = () => {
        const sp0 = parsePrompt(prompt), who = sp0.cast.map(id => charById(id).name).join(" and ");
        return { title: prompt.split(" ").slice(0, 5).join(" "), shots: [
          { caption: `It all begins here.`, scene_base: sp0.base, time: sp0.time, weather: sp0.weather, characters: [], camera: "push-in", image_prompt: prompt },
          { caption: `Meet ${who}.`, scene_base: sp0.base, time: sp0.time, weather: sp0.weather, characters: sp0.cast, camera: "pan-left", image_prompt: prompt },
          { caption: `Then everything goes wrong at once.`, scene_base: rand(bases), time: "night", weather: rand(["rain", "embers", "fog"]), characters: sp0.cast, camera: "zoom-out", image_prompt: prompt },
          { caption: `Together, they find a way through.`, scene_base: sp0.base, time: "sunset", weather: "clear", characters: sp0.cast, camera: "push-in", image_prompt: prompt }
        ] };
      };
      const sb = await Brain.ask(sys, `Idea: ${prompt}\nVisual style: ${st.prompt}`, 0.9, fallback);
      if (token !== S.token) return;
      let shots = Array.isArray(sb.shots) ? sb.shots.slice(0, 6) : [];
      if (shots.length < 3) shots = fallback().shots;
      shots = shots.map(s => ({
        caption: Brain.clip(s.caption, 120) || "…",
        base: bases.includes(s.scene_base) ? s.scene_base : parsePrompt(prompt).base,
        time: ["day", "sunset", "night"].includes(s.time) ? s.time : "day",
        weather: Scenes.WEATHER.includes(s.weather) ? s.weather : "clear",
        cast: (Array.isArray(s.characters) ? s.characters : []).map(x => String(x).split(" ")[0]).filter(id => charById(id)).slice(0, 3),
        camera: ["push-in", "pan-left", "pan-right", "zoom-out"].includes(s.camera) ? s.camera : "push-in",
        image_prompt: Brain.clip(s.image_prompt || prompt, 400)
      }));
      w.set(1, `Rendering ${shots.length} frames`);
      w.why(shots.map((s, i) => `${i + 1}. ${s.caption}`).join("  "));
      let aiUsed = 0;
      for (let i = 0; i < shots.length; i++) {
        if (token !== S.token) return;
        w.set(1, `Rendering frame ${i + 1} of ${shots.length}${Brain.images && aiUsed < 4 ? " (image model)" : " (vector)"}`);
        const s = shots[i];
        if (Brain.images && aiUsed < 4) {
          aiUsed++;
          const src = await Brain.image(`${s.image_prompt}. ${st.prompt}. Wide 16:9 composition, no text.`);
          if (src) { s.img = await loadImg(src); s.ai = true; }
        }
        if (!s.img) s.img = await vectorFrame(s, S.style, 960, 540);
      }
      if (token !== S.token) return;
      w.set(2); await wait(300); w.set(3);
      S.video && S.video.destroy();
      S.video = VideoPlayer(shots, sb.title || "Untitled");
      renderOut();
      coord.pulse("team", `storyboard: ${shots.length} shots`, "in");
      coord.pulse("band", `${shots.length} frames shared`, "out");
      coord.pulse("bruin", `${aiUsed} AI + ${shots.length - aiUsed} vector renders`, "out");
    }

    $("#adGo", main).onclick = async () => {
      if (S.busy) return;
      const prompt = $("#adPrompt", main).value.trim(); if (!prompt) return;
      S.busy = true; $("#adGo", main).disabled = true;
      try { S.mode === "video" ? await genVideo(prompt) : await genImage(prompt); }
      catch (e) { console.error(e); }
      finally { S.busy = false; $("#adGo", main).disabled = false; }
    };
    return { destroy() { S.token++; S.video && S.video.destroy(); hush(); } };
  }

  /* plays shots on a canvas: Ken Burns, crossfades, captions, narration, recording */
  function VideoPlayer(shots, title) {
    const D = 4.2, X = 0.7, total = shots.length * D, W = 960, H = 540;
    let t = 0, playing = true, last = performance.now(), raf, dead = false, narr = true, lastShot = -1, rec = null, root = null;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    function cam(s, u, c) {
      const k = ease(u);
      if (s.camera === "push-in") return [1 + 0.16 * k, 0, 0];
      if (s.camera === "zoom-out") return [1.16 - 0.16 * k, 0, 0];
      if (s.camera === "pan-left") return [1.14, 0.06 - 0.12 * k, 0];
      return [1.14, -0.06 + 0.12 * k, 0];
    }
    function drawShot(i, u, alpha) {
      const s = shots[i]; if (!s) return;
      const [sc, ox, oy] = cam(s, u);
      ctx.save(); ctx.globalAlpha = alpha; drawCover(ctx, s.img, W, H, sc, ox, oy); ctx.restore();
    }
    function frame() {
      const i = Math.min(shots.length - 1, Math.floor(t / D)), u = (t - i * D) / D;
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      drawShot(i, u, 1);
      const into = t - i * D;
      if (i > 0 && into < X) { drawShot(i - 1, 1, 1 - into / X); }
      // caption
      const g = ctx.createLinearGradient(0, H - 110, 0, H); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.8)");
      ctx.fillStyle = g; ctx.fillRect(0, H - 110, W, 110);
      ctx.font = "700 26px 'Space Grotesk', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff";
      const lines = wrapLines(ctx, shots[i].caption, W - 120).slice(0, 2);
      lines.forEach((l, k) => ctx.fillText(l, W / 2, H - 28 - (lines.length - 1 - k) * 32));
      if (t < 2.2) { const a = t < 1.6 ? 1 : 1 - (t - 1.6) / 0.6; ctx.fillStyle = `rgba(0,0,0,${0.55 * a})`; ctx.fillRect(0, 0, W, H); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.font = "700 46px 'Space Grotesk', sans-serif"; ctx.fillText(title, W / 2, H / 2); ctx.font = "600 16px 'JetBrains Mono', monospace"; ctx.fillText("AN ADAL PRODUCTION", W / 2, H / 2 + 36); }
      ctx.textAlign = "left";
      ctx.font = "600 13px 'JetBrains Mono', monospace"; ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillText(`SHOT ${i + 1}/${shots.length}${shots[i].ai ? " · AI IMAGE" : ""}`, 18, 28);
      if (i !== lastShot) { lastShot = i; if (playing && narr) speak(shots[i].caption, i); if (root) $$(".vs li", root).forEach((li, k) => li.classList.toggle("on", k === i)); }
      if (root) { $(".vbar i", root).style.width = (t / total * 100) + "%"; $(".vt", root).textContent = `0:${String(Math.floor(t)).padStart(2, "0")} / 0:${String(Math.ceil(total)).padStart(2, "0")}`; }
    }
    function tick(now) {
      if (dead) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (playing) { t += dt; if (t >= total) { if (rec) { t = total - 0.001; frame(); rec.stop(); rec = null; playing = false; } else t = 0; lastShot = -1; } }
      frame();
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    const api = {
      mount(out) {
        out.innerHTML = `<div class="vplayer"><div class="vcv"></div>
          <div class="vctl"><button class="vplay" aria-label="Pause">❚❚</button><button class="vre" aria-label="Restart">⟲</button><div class="vbar"><i></i></div><span class="vt"></span>
          <button class="vnar on" title="Narration">🔊</button><button class="btn btn-sm vdl">⬇ Download</button></div>
          <ol class="vs">${shots.map((s, i) => `<li data-i="${i}"><b>${i + 1}</b> ${esc(s.caption)} <small>${esc(s.camera)}${s.ai ? " · AI" : ""}</small></li>`).join("")}</ol>
          <p class="muted small vmsg"></p></div>`;
        root = out.querySelector(".vplayer");
        $(".vcv", root).appendChild(cv);
        $(".vplay", root).onclick = e => { playing = !playing; e.target.textContent = playing ? "❚❚" : "▶"; if (!playing) hush(); };
        $(".vre", root).onclick = () => { t = 0; lastShot = -1; playing = true; $(".vplay", root).textContent = "❚❚"; };
        $(".vnar", root).onclick = e => { narr = !narr; e.target.classList.toggle("on", narr); e.target.textContent = narr ? "🔊" : "🔇"; if (!narr) hush(); };
        $(".vbar", root).onclick = e => { const r = e.currentTarget.getBoundingClientRect(); t = clamp((e.clientX - r.left) / r.width, 0, 0.999) * total; lastShot = -1; };
        $$(".vs li", root).forEach(li => li.onclick = () => { t = +li.dataset.i * D + 0.01; lastShot = -1; });
        $(".vdl", root).onclick = () => api.record();
      },
      record() {
        const msg = $(".vmsg", root);
        if (!cv.captureStream || !window.MediaRecorder) { msg.textContent = "This browser can't record canvas video."; return; }
        let stream;
        try { stream = cv.captureStream(30); } catch { msg.textContent = "Recording isn't allowed for this video in this browser."; return; }
        const type = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(m => MediaRecorder.isTypeSupported(m)) || "";
        const chunks = [];
        rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
        rec.ondataavailable = e => e.data.size && chunks.push(e.data);
        rec.onstop = () => {
          const url = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
          msg.innerHTML = `✅ Recorded. <a href="${url}" download="adal-video.webm">Save adal-video.webm</a>`;
          const a = document.createElement("a"); a.href = url; a.download = "adal-video.webm"; document.body.appendChild(a); a.click(); a.remove();
          $(".vdl", root).disabled = false;
        };
        t = 0; lastShot = -1; playing = true; $(".vplay", root).textContent = "❚❚";
        $(".vdl", root).disabled = true;
        msg.textContent = `● Recording… about ${Math.ceil(total)} seconds. Keep this tab open.`;
        rec.start(250);
      },
      destroy() { dead = true; cancelAnimationFrame(raf); try { rec && rec.stop(); } catch {} hush(); }
    };
    return api;
  }

  /* =========================================================
     3 · Bruin — data & insights
     ========================================================= */
  const STORIES = ["Escape Pod", "Inside Job", "Manor Dinner", "The Verdict"];
  const ENDINGS = ["Triumph", "Tragedy", "Betrayal", "Bittersweet", "Twist", "Comedy"];
  const ACTORS = ["vega", "rook", "imani", "bolt", "kit", "marlowe", "ashford", "nyx"];
  function makeRuns(n, seed) {
    let s = seed || 42; const r = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
    const W = { "Escape Pod": [3, 3, 1, 4, 1, 1], "Inside Job": [1, 1, 6, 1, 2, 1], "Manor Dinner": [1, 2, 2, 1, 5, 2], "The Verdict": [2, 1, 1, 3, 3, 2] };
    const pickW = w => { let x = r() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < w.length; i++) { x -= w[i]; if (x < 0) return i; } return w.length - 1; };
    return Array.from({ length: n }, (_, i) => {
      const story = STORIES[Math.floor(r() * 4)], ending = ENDINGS[pickW(W[story])];
      const lead = ACTORS[pickW([2, 4, 1, 2, 2, 3, 2, 4])];
      return { run: i + 1, story, ending, lead, scenes: 10 + Math.floor(r() * 11), betrayals: ending === "Betrayal" ? 1 + Math.floor(r() * 3) : Math.floor(r() * 1.6), voice: r() < 0.4 };
    });
  }
  function summarize(runs) {
    const count = (k) => runs.reduce((m, x) => (m[x[k]] = (m[x[k]] || 0) + 1, m), {});
    const by = {}; STORIES.forEach(s => { const rs = runs.filter(x => x.story === s); by[s] = { runs: rs.length, endings: rs.reduce((m, x) => (m[x.ending] = (m[x.ending] || 0) + 1, m), {}), betrayal_rate: rs.length ? +(rs.filter(x => x.betrayals > 0).length / rs.length).toFixed(2) : 0, avg_scenes: rs.length ? +(rs.reduce((a, x) => a + x.scenes, 0) / rs.length).toFixed(1) : 0 }; });
    const leads = count("lead"); const leadNames = {}; Object.keys(leads).forEach(k => leadNames[charById(k).name] = leads[k]);
    return { total_runs: runs.length, endings: count("ending"), lead_agent_runs: leadNames, by_story: by, avg_scenes: +(runs.reduce((a, x) => a + x.scenes, 0) / runs.length).toFixed(1), runs_with_betrayal: runs.filter(x => x.betrayals > 0).length, voice_runs: runs.filter(x => x.voice).length };
  }

  LABS.push({
    id: "bruin", tool: "Data & insights", playLink: "film",
    title: "Ask questions about what your agents decided",
    pitch: "Every agent decision is data. Here are 50 logged film runs from the playground. Explore the charts, then ask a question in plain English and Bruin answers with numbers, the matching chart, and the query behind it.",
    how: [
      "The dashboard shows <b>50 simulated film runs</b>: story, ending, lead agent, scenes, betrayals.",
      "<b>Hover</b> any bar for exact numbers.",
      "<b>Ask</b> a question, e.g. “Which story ends in betrayal most?”",
      "Bruin answers with numbers, <b>highlights the chart</b> that proves it, and shows the SQL it would run.",
      "<b>Simulate 10 more runs</b> to see the patterns shift."
    ],
    demoChars: [], demoScenes: {},
    demo: [
      { cap: "Every agent decision is logged as data", dur: 3.2, draw(ctx, p, A, W, H) { bruinBg(ctx, W, H); const rows = makeRuns(9, 7); ctx.font = "13px 'JetBrains Mono', monospace"; rows.forEach((r, i) => { const a = clamp(p * 9 - i, 0, 1); ctx.fillStyle = `rgba(234,240,255,${a})`; ctx.fillText(`run ${String(r.run).padStart(2, "0")}  ${r.story.padEnd(13)} ${r.ending.padEnd(12)} ${charById(r.lead).name}`, 40, 60 + i * 28); }); } },
      { cap: "See the patterns at a glance", dur: 3.4, draw(ctx, p, A, W, H) { bruinBg(ctx, W, H); bruinBars(ctx, W, p, null); } },
      { cap: "Ask a question in plain English", dur: 3.2, draw(ctx, p, A, W, H) { bruinBg(ctx, W, H); bruinBars(ctx, W, 1, null, 0.4); const q = "Which story ends in betrayal most?"; ctx.fillStyle = "#151d3d"; rr(ctx, 40, 240, W - 80, 50, 25); ctx.fill(); ctx.strokeStyle = "#ffc857"; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = "#fff"; ctx.font = "16px 'Space Grotesk', sans-serif"; ctx.fillText(q.slice(0, Math.floor(q.length * Math.min(1, p * 1.4))), 62, 271); } },
      { cap: "Get the answer, the chart, and the query", dur: 3.8, draw(ctx, p, A, W, H) { bruinBg(ctx, W, H); bruinBars(ctx, W, 1, "Betrayal"); textBox(ctx, "Inside Job ends in Betrayal in 6 of 13 runs (46%), the highest of any story.", 40, 238, W - 80, { bg: "rgba(255,200,87,.95)" }); } }
    ],
    build: buildBruin
  });
  function bruinBg(ctx, W, H) { ctx.fillStyle = "#0d1226"; ctx.fillRect(0, 0, W, H); }
  function bruinBars(ctx, W, p, hl, dim) {
    const data = [["Betrayal", 14], ["Twist", 11], ["Bittersweet", 10], ["Triumph", 7], ["Tragedy", 5]];
    ctx.font = "13px 'Space Grotesk', sans-serif";
    data.forEach(([l, v], i) => { const y = 50 + i * 34, w = (v / 14) * (W - 230) * ease(clamp(p * 1.4 - i * 0.08, 0, 1)); ctx.fillStyle = "#c9d0ee"; ctx.fillText(l, 40, y + 16); ctx.fillStyle = hl && l !== hl ? "rgba(255,200,87,.35)" : `rgba(255,200,87,${dim || 1})`; rr(ctx, 140, y + 2, Math.max(4, w), 20, 4); ctx.fill(); ctx.fillStyle = "#eaf0ff"; ctx.fillText(String(v), 148 + w, y + 17); });
  }

  function buildBruin(main, coord) {
    coord = coord || { pulse() {} };
    let runs = makeRuns(50, 42), hl = { endings: null, agents: null, stories: null };
    const QS = ["Which ending happens most?", "Which story ends in betrayal most often?", "Who drives the plot the most?", "How long is an average film?", "Do voice runs end differently?"];
    main.innerHTML = `
      <div class="kpis" id="brK"></div>
      <div class="br-charts">
        <div class="lab-panel" id="chEndings"></div>
        <div class="lab-panel" id="chAgents"></div>
        <div class="lab-panel wide" id="chStories"></div>
      </div>
      <div class="lab-bar"><input id="brQ" maxlength="160" placeholder="Ask your data a question…" aria-label="Ask a question about the data"><button class="btn btn-sm" id="brAsk">Ask Bruin</button><button class="btn ghost btn-sm" id="brMore">＋ Simulate 10 more runs</button></div>
      <div class="ex-chips" id="brEx">${QS.map(q => `<button>${esc(q)}</button>`).join("")}</div>
      <div id="brA"></div>
      <details class="br-table"><summary>Show the data table</summary><div class="tbl" id="brT"></div></details>`;
    function hbar(el, title, rows, key) {
      if (hl[key]) { const h = hl[key].toLowerCase().replace(/['"‘’“”]/g, "").trim(); const m = rows.find(r => r[0].toLowerCase() === h) || rows.find(r => h.includes(r[0].toLowerCase()) || r[0].toLowerCase().includes(h)); hl[key] = m ? m[0] : null; }
      const max = Math.max(...rows.map(r => r[1]), 1);
      el.innerHTML = `<div class="lp-h">${esc(title)}</div><div class="hb">${rows.map(([l, v, sub]) => `<div class="hb-r ${hl[key] && hl[key] !== l ? "dim" : ""} ${hl[key] === l ? "hl" : ""}" title="${esc(l)}: ${esc(sub || v)}"><span class="hb-l">${esc(l)}</span><span class="hb-t"><i style="width:${(v / max) * 100}%"></i></span><span class="hb-v">${esc(sub || v)}</span></div>`).join("")}</div>`;
    }
    function render() {
      const s = summarize(runs);
      $("#brK", main).innerHTML = [["Runs", s.total_runs], ["Distinct endings", Object.keys(s.endings).length], ["Avg scenes", s.avg_scenes], ["Runs with a betrayal", Math.round(s.runs_with_betrayal / s.total_runs * 100) + "%"]].map(([l, v]) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`).join("");
      hbar($("#chEndings", main), "ENDINGS · runs", Object.entries(s.endings).sort((a, b) => b[1] - a[1]), "endings");
      hbar($("#chAgents", main), "LEAD AGENT · runs where they acted most", Object.entries(s.lead_agent_runs).sort((a, b) => b[1] - a[1]), "agents");
      hbar($("#chStories", main), "BETRAYAL RATE BY STORY", STORIES.map(st => [st, s.by_story[st].betrayal_rate * 100, `${Math.round(s.by_story[st].betrayal_rate * 100)}% of ${s.by_story[st].runs}`]).sort((a, b) => b[1] - a[1]), "stories");
      $("#brT", main).innerHTML = `<table><thead><tr><th>Run</th><th>Story</th><th>Ending</th><th>Lead</th><th>Scenes</th><th>Betrayals</th><th>Voice</th></tr></thead><tbody>${runs.map(r => `<tr><td>${r.run}</td><td>${r.story}</td><td>${r.ending}</td><td>${esc(charById(r.lead).name)}</td><td>${r.scenes}</td><td>${r.betrayals}</td><td>${r.voice ? "yes" : "no"}</td></tr>`).join("")}</tbody></table>`;
    }
    function offline(q, s) {
      q = q.toLowerCase();
      const top = o => Object.entries(o).sort((a, b) => b[1] - a[1])[0];
      if (/betray/.test(q)) { const b = STORIES.map(st => [st, s.by_story[st]]).sort((a, b) => b[1].betrayal_rate - a[1].betrayal_rate)[0]; return { answer: `${b[0]} has the highest betrayal rate: ${Math.round(b[1].betrayal_rate * 100)}% of its ${b[1].runs} runs include a betrayal. Overall, ${s.runs_with_betrayal} of ${s.total_runs} runs do.`, chart: "stories", highlight: b[0], sql: "SELECT story, AVG(betrayals > 0) AS rate FROM runs GROUP BY story ORDER BY rate DESC;" }; }
      if (/who|agent|drive|lead|character/.test(q)) { const t = top(s.lead_agent_runs); return { answer: `${t[0]} leads the action most often: ${t[1]} of ${s.total_runs} runs (${Math.round(t[1] / s.total_runs * 100)}%).`, chart: "agents", highlight: t[0], sql: "SELECT lead_agent, COUNT(*) FROM runs GROUP BY lead_agent ORDER BY 2 DESC;" }; }
      if (/long|average|length|scenes/.test(q)) return { answer: `An average film runs ${s.avg_scenes} scenes (range 10–20).`, chart: "none", highlight: "", sql: "SELECT AVG(scenes) FROM runs;" };
      if (/voice/.test(q)) return { answer: `${s.voice_runs} runs used voices. Endings look similar with and without voice in this sample, so voice changes the feel more than the outcome.`, chart: "endings", highlight: "", sql: "SELECT voice, ending, COUNT(*) FROM runs GROUP BY 1, 2;" };
      const t = top(s.endings); return { answer: `${t[0]} is the most common ending: ${t[1]} of ${s.total_runs} runs (${Math.round(t[1] / s.total_runs * 100)}%).`, chart: "endings", highlight: t[0], sql: "SELECT ending, COUNT(*) FROM runs GROUP BY ending ORDER BY 2 DESC;" };
    }
    async function ask() {
      const q = $("#brQ", main).value.trim(); if (!q) return;
      const s = summarize(runs);
      $("#brA", main).innerHTML = `<div class="ai-work"><b>🤖 Bruin is querying ${s.total_runs} runs</b><span class="dots3"><i></i><i></i><i></i></span></div>`;
      const sys = `You are Bruin, an AI data assistant. Answer questions about a dataset of AI-agent film runs using ONLY the JSON summary provided. Be precise, cite numbers, 1-3 sentences.
Reply with JSON only: {"answer":"...","chart":"endings|agents|stories|none","highlight":"exact bar label to highlight (an ending name, an agent full name, or a story name) or empty","sql":"a plausible SQL query over table runs(run, story, ending, lead_agent, scenes, betrayals, voice) that would answer it"}`;
      coord.pulse("band", `${s.total_runs * 9} channel events`, "in");
      coord.pulse("team", `${s.total_runs} runs of decisions`, "in");
      const a = await Brain.ask(sys, `DATA SUMMARY: ${JSON.stringify(s)}\nQUESTION: ${q}`, 0.2, () => offline(q, s));
      coord.pulse("finch", a.chart === "agents" ? "insight: who leads → skills" : "insight → tune skills", "out");
      hl = { endings: null, agents: null, stories: null };
      if (a.chart && hl.hasOwnProperty(a.chart) && a.highlight) hl[a.chart] = String(a.highlight);
      render();
      const target = a.chart && a.chart !== "none" ? { endings: "#chEndings", agents: "#chAgents", stories: "#chStories" }[a.chart] : null;
      $$(".br-charts .lab-panel", main).forEach(p => p.classList.toggle("focus", !!target && p.matches(target)));
      $("#brA", main).innerHTML = `<div class="br-ans"><b>📊 ${esc(Brain.clip(a.answer, 400))}</b>${a.sql ? `<code>${esc(Brain.clip(a.sql, 300))}</code>` : ""}${a._src === "offline" ? `<small class="muted">Answered by the offline rules.</small>` : ""}</div>`;
    }
    $("#brAsk", main).onclick = ask;
    $("#brQ", main).onkeydown = e => { if (e.key === "Enter") ask(); };
    $("#brEx", main).onclick = e => { const b = e.target.closest("button"); if (b) { $("#brQ", main).value = b.textContent; ask(); } };
    $("#brMore", main).onclick = () => { const more = makeRuns(10, Date.now() % 100000).map((r, i) => ({ ...r, run: runs.length + i + 1 })); runs = runs.concat(more); render(); };
    render();
    return {};
  }

  /* =========================================================
     4 · Finch — agent skills
     ========================================================= */
  /* Skills come from the shared library in play-data.js (PLAY.allSkills()): presets + ones users create.
     OFF = what the offline agent "produces" when it applies a preset skill. */
  const OFF = {
    negotiate: t => `Both sides want this closed fast. Offer: a partial fix today in exchange for a firm follow-up date.`,
    persuade: t => `You'll save a week of back-and-forth. We did exactly this for three clients last month. Can you approve it by 5pm?`,
    investigate: t => `Known: the request and the deadline. Doesn't add up: nobody has checked the root cause. Key question: what changed right before it went wrong?`,
    plan: t => `1) Today: triage and confirm the facts (me). 2) Tomorrow: fix or decide (team). 3) Friday: follow up and close (me).`,
    summarize: t => `• What happened • What we'll do about it • When it will be done`,
    examine: t => `Clarity 4/5 ("the facts are stated"), evidence 2/5 (no numbers yet), impact 3/5 (customer still waiting).`,
    coach: t => `What worked: you owned the problem. Change: lead with the fix, not the apology. Practise: "Here's what I'll do by Friday."`,
    translate: t => `ES: «Lo resolvemos hoy y te lo confirmamos el viernes.» (We'll solve it today and confirm on Friday.)`,
    deceive: t => `Cover story: "The courier lost a whole batch, so we're already rushing a replacement." One true detail: the courier really was late.`,
    inspire: t => `We've fixed harder things this quarter. Same team, same grit: let's turn this into the best support story we tell all year.`,
    heal: t => `First check who's hurting most: the customer. Refund them today, then check on the team member handling it.`,
    predict: t => `Pattern: this happens every time a deadline is tight. Next move: they'll escalate tomorrow unless we act today.`
  };
  const offFor = (sk, task) => (OFF[sk.id] ? OFF[sk.id](task) : `Applying ${sk.name}: ${String(sk.instructions || sk.desc || "").replace(/\.$/, "")} → for "${task.slice(0, 50)}${task.length > 50 ? "…" : ""}".`);
  const TASKS = ["A customer wants a refund for an order that arrived late", "Plan the team offsite for 12 people next month", "Review this startup idea: Uber for dog walkers", "Tell a Madrid client their launch slips by one week"];
  const SKILL_IDEAS = ["Explain anything like I'm 5", "Turn a complaint into an apology plus a fix", "Write every answer as a haiku", "Check an idea for risks like a lawyer", "Haggle like a market trader"];
  const AGENT_IDEAS = ["a calm customer-support lead who negotiates refunds", "a sarcastic detective who never trusts the first answer", "a cheerful teacher who coaches beginners", "a startup founder who pitches everything"];

  LABS.push({
    id: "finch", tool: "Agent skills", playLink: "game",
    title: "Give an agent skills and watch its answer change",
    pitch: "Skills are reusable procedures any agent can apply. Equip them, invent new ones with AI, create agents that come with the right skills, and compare answers with and without.",
    how: [
      "<b>Pick an agent</b>, or ✨ describe one and let AI create it with matching skills.",
      "<b>Browse the skill library.</b> Each card shows what the skill does, where it shines, and the exact instruction it adds to the agent's prompt.",
      "<b>Equip up to 3 skills</b>: drag a card onto the slots or tap it. Tap an equipped skill to remove it.",
      "<b>✨ Create your own skill</b>: describe it in plain words and an AI agent writes the skill card for you.",
      "<b>Run</b>: the same agent answers twice, without and with skills, so you see exactly what each skill changed."
    ],
    demoChars: ["imani"], demoScenes: { bg: { base: "lab", time: "night" } },
    demo: [
      { cap: "Pick an agent with three empty skill slots", dur: 3, draw(ctx, p, A, W, H) { finchBg(ctx, A, W, H); drawPup(ctx, A.p.imani, 200, 320, 220); finchSlots(ctx, []); } },
      { cap: "Drag skills onto the agent", dur: 3.6, draw(ctx, p, A, W, H) { finchBg(ctx, A, W, H); drawPup(ctx, A.p.imani, 200, 320, 220); const k = ease(clamp(p * 1.6, 0, 1)), k2 = ease(clamp(p * 1.6 - 0.6, 0, 1)); finchSlots(ctx, k >= 1 ? (k2 >= 1 ? ["🤝 Negotiate", "🗺️ Plan"] : ["🤝 Negotiate"]) : []); if (k < 1) finchCard(ctx, 480 - 130 * k, 300 - 220 * k, "🤝 Negotiate"); if (k >= 1 && k2 < 1) finchCard(ctx, 480 - 130 * k2, 300 - 160 * k2, "🗺️ Plan"); } },
      { cap: "Same task, same agent, different skills", dur: 3.2, draw(ctx, p, A, W, H) { finchBg(ctx, A, W, H); textBox(ctx, "Task: a customer wants a refund for a late order", 40, 40, W - 80, { bg: "rgba(255,159,67,.95)" }); finchCols(ctx, W, Math.min(1, p * 1.5), false); } },
      { cap: "Skills make the answer structured and actionable", dur: 3.8, draw(ctx, p, A, W, H) { finchBg(ctx, A, W, H); textBox(ctx, "Task: a customer wants a refund for a late order", 40, 40, W - 80, { bg: "rgba(255,159,67,.95)" }); finchCols(ctx, W, 1, true); } }
    ],
    build: buildFinch
  });
  function finchBg(ctx, A, W, H) { drawCover(ctx, A.s.bg, W, H); ctx.fillStyle = "rgba(8,10,22,.55)"; ctx.fillRect(0, 0, W, H); }
  function finchSlots(ctx, eq) { for (let i = 0; i < 3; i++) { ctx.strokeStyle = "#ff9f43"; ctx.setLineDash(eq[i] ? [] : [6, 5]); ctx.lineWidth = 2; rr(ctx, 330, 60 + i * 60, 170, 44, 10); ctx.stroke(); ctx.setLineDash([]); if (eq[i]) finchCard(ctx, 330, 60 + i * 60, eq[i]); } }
  function finchCard(ctx, x, y, t) { ctx.fillStyle = "#ff9f43"; rr(ctx, x, y, 170, 44, 10); ctx.fill(); ctx.fillStyle = "#1a1206"; ctx.font = "700 15px 'Space Grotesk', sans-serif"; ctx.fillText(t, x + 14, y + 28); }
  function finchCols(ctx, W, a, withS) {
    ctx.globalAlpha = a;
    textBox(ctx, "Without skills: “Sorry for the delay. Refunds take 30 days.”", 40, 110, W / 2 - 50, { bg: "rgba(234,240,255,.9)" });
    if (withS) textBox(ctx, "With 🤝 + 🗺️: “Full refund today, plus free shipping next time. I'll confirm by Friday.”", W / 2 + 10, 110, W / 2 - 50, { bg: "rgba(182,255,92,.95)" });
    ctx.globalAlpha = 1;
  }

  /* small "agent at work" steps box (play.js isn't loaded on this page) */
  function workSteps(el, labels, title) {
    el.innerHTML = `<div class="ai-work"><b>🤖 ${esc(title || "Agent at work")}</b><ol>${labels.map(l => `<li><i>○</i>${esc(l)}</li>`).join("")}</ol><div class="why"></div></div>`;
    const lis = $$("li", el);
    const set = k => lis.forEach((li, i) => { li.className = i < k ? "done" : i === k ? "on" : ""; li.querySelector("i").textContent = i < k ? "✓" : i === k ? "●" : "○"; });
    set(0);
    let k = 0; const t = setInterval(() => { if (k < labels.length - 1) set(++k); }, 800);
    return { done(why) { clearInterval(t); set(labels.length); if (why) $(".why", el).textContent = "“" + why + "”"; }, stop() { clearInterval(t); } };
  }
  const EMOJI_KW = [[/lawyer|legal|risk/, "⚖️"], [/haiku|poem|poet|rhyme/, "🪶"], [/kid|child|5|simple|explain/, "🧸"], [/haggle|market|price|deal|trade/, "🏷️"], [/apolog|complaint|support|customer/, "💐"], [/code|bug|debug/, "🐞"], [/joke|funny|humou?r/, "😂"], [/math|number|calc/, "🧮"], [/story|narrat/, "📖"], [/sales|pitch/, "📣"]];
  const COLORS = ["#ff9f43", "#ff4fa3", "#3ee6ff", "#b6ff5c", "#c48bff", "#ffc857", "#5c8dff", "#4fd1c5"];
  const titleCase = t => t.replace(/\b\w/g, c => c.toUpperCase());

  async function aiSkill(idea) {
    const sys = `You are Finch, a skill designer for AI agents. Turn the user's idea into ONE reusable agent skill.
A skill is a short procedure an agent applies to any task. Reply with JSON only:
{"name":"1-3 words, Title Case","icon":"one emoji","color":"a bright hex colour","desc":"what it does, max 12 words","instructions":"the exact instruction added to the agent's prompt, imperative, max 35 words","good":"where it shines, 2-4 short use cases comma separated","why":"one sentence on your design"}`;
    const o = await Brain.ask(sys, `Idea: ${idea}`, 0.8, () => {
      const words = idea.replace(/^(a|an|the|make|turn|write|explain)\s+/i, "").split(/\s+/).slice(0, 3).join(" ");
      return { name: titleCase(words).slice(0, 24) || "Custom Skill", icon: (EMOJI_KW.find(([re]) => re.test(idea.toLowerCase())) || [0, "🧩"])[1], color: rand(COLORS),
        desc: idea.slice(0, 70), instructions: `Before answering, ${idea.charAt(0).toLowerCase() + idea.slice(1).replace(/\.$/, "")}. Keep the result short and concrete.`, good: "support, pitches, team chats", why: "Built from your words so the agent applies it the same way every time." };
    });
    const icon = [...String(o.icon || "")].slice(0, 2).join("") || "🧩";
    return {
      name: Brain.clip(o.name, 28) || "Custom Skill", icon, color: /^#[0-9a-f]{6}$/i.test(o.color || "") ? o.color : rand(COLORS),
      desc: Brain.clip(o.desc, 100), instructions: Brain.clip(o.instructions, 260) || Brain.clip(idea, 200), good: Brain.clip(o.good, 80), why: Brain.clip(o.why, 160), _src: o._src
    };
  }
  async function aiAgent(idea) {
    const lib = P.allSkills();
    const sys = `You design AI agents for a playground. Turn the idea into ONE agent and pick its skills ONLY from this library (use the ids):
${lib.map(s => `${s.id}: ${s.name} - ${s.desc}`).join("\n")}
Look options: species ${Puppet.LOOK.species.join("/")}; outfit ${Puppet.LOOK.outfit.join("/")}; acc ${Puppet.LOOK.acc.join("/")}; outfitColor any hex.
Reply with JSON only: {"name":"short name","role":"max 3 words","personality":"max 18 words","skills":["1 to 3 skill ids"],"look":{"species":"","outfit":"","outfitColor":"#hex","acc":""},"why":"one sentence on why these skills"}`;
    const o = await Brain.ask(sys, `Idea: ${idea}`, 0.9, () => {
      const t = idea.toLowerCase(), pick = [];
      [[/negotiat|refund|deal|support|haggl/, "negotiate"], [/pitch|sales|founder|persuad|sell/, "persuade"], [/detective|investig|spy|trust|lie/, "investigate"], [/teach|coach|mentor|beginner/, "coach"], [/plan|manager|organi|project/, "plan"], [/summar|report|analyst/, "summarize"], [/exam|interview|review|judge/, "examine"], [/translat|language|spanish|french/, "translate"], [/doctor|nurse|medic|heal/, "heal"], [/inspir|leader|captain|rally/, "inspire"], [/predict|strateg|chess|gamer/, "predict"], [/liar|con|trick|thief/, "deceive"]]
        .forEach(([re, id]) => { if (re.test(t) && pick.length < 3) pick.push(id); });
      if (!pick.length) pick.push("plan", "summarize");
      const role = (idea.match(/\b(support lead|detective|teacher|founder|doctor|manager|analyst|chef|pilot|lawyer|coach|engineer)\b/i) || [0, "Specialist"])[1];
      return { name: rand(["Ava", "Milo", "Juno", "Rex", "Tess", "Kai", "Nova", "Ozzy"]), role: titleCase(role), personality: idea.charAt(0).toUpperCase() + idea.slice(1, 120), skills: pick,
        look: { species: /robot|bot/.test(t) ? "robot" : /cat/.test(t) ? "cat" : "human", outfit: /detective|lawyer|founder|manager/.test(t) ? "suit" : /teacher/.test(t) ? "sweater" : /doctor/.test(t) ? "labcoat" : "jacket", outfitColor: rand(COLORS), acc: /detective/.test(t) ? "tophat" : /teacher/.test(t) ? "glasses" : "none" },
        why: `Picked ${pick.join(", ")} because your description mentions what they do all day.` };
    });
    const ids = new Set(lib.map(s => s.id));
    const look = Object.assign(Puppet.randomLook(String(o.name || idea)), {});
    const L0 = o.look || {};
    if (Puppet.LOOK.species.includes(L0.species)) look.species = L0.species;
    if (Puppet.LOOK.outfit.includes(L0.outfit)) look.outfit = L0.outfit;
    if (Puppet.LOOK.acc.includes(L0.acc)) look.acc = L0.acc;
    if (Puppet.colorHex && Puppet.colorHex(L0.outfitColor)) look.outfitColor = Puppet.colorHex(L0.outfitColor);
    if (look.species !== "human" && look.species !== "alien") { look.hair = "none"; look.facial = "none"; delete look.skin; }
    return {
      id: "fa-" + Math.random().toString(36).slice(2, 7), name: Brain.clip(o.name, 22) || "Agent", role: Brain.clip(o.role, 28) || "Specialist",
      personality: Brain.clip(o.personality, 160) || idea, skills: (Array.isArray(o.skills) ? o.skills : []).filter(id => ids.has(id)).slice(0, 3), look, why: Brain.clip(o.why, 180), _src: o._src
    };
  }

  function buildFinch(main, coord) {
    coord = coord || { pulse() {} };
    const S = { agent: "imani", eq: ["negotiate", "plan"], busy: false, filter: "all", custom: [], open: "" };
    const lib = () => P.allSkills();
    const sk = id => lib().find(s => s.id === id);
    const agentById = id => S.custom.find(a => a.id === id) || charById(id);
    main.innerHTML = `
      <div class="fi-top">
        <div class="fi-agent">
          <select id="fiAg" aria-label="Agent"></select>
          <div class="fi-fig"><div id="fiPup"></div></div>
          <p class="muted small" id="fiPers"></p>
          <button class="btn ghost btn-sm fi-mk" data-open="agent">✨ Create an agent with AI</button>
        </div>
        <div>
          <div class="lp-h">EQUIPPED SKILLS · max 3 · drop here</div>
          <div class="fi-slots" id="fiSlots"></div>
          <div class="fi-libhead">
            <div class="lp-h">SKILL LIBRARY · drag or tap to equip</div>
            <div class="fi-filter" id="fiFilter"><button data-f="all" class="on">All</button><button data-f="built">Built-in</button><button data-f="mine">Yours</button></div>
            <button class="btn btn-sm fi-mk ai" data-open="skill">✨ Create a skill with AI</button>
          </div>
          <div class="fi-maker" id="fiMaker" hidden></div>
          <div class="fi-deck" id="fiDeck"></div>
        </div>
      </div>
      <label class="lab-l" for="fiTask">Task for the agent</label>
      <div class="lab-bar"><input id="fiTask" maxlength="200" value="${esc(TASKS[0])}"><button class="btn btn-sm" id="fiRun">▶ Run with & without skills</button></div>
      <div class="ex-chips" id="fiEx">${TASKS.map(t => `<button>${esc(t)}</button>`).join("")}</div>
      <div class="fi-out" id="fiOut"></div>`;

    function drawAgents() {
      const sel = $("#fiAg", main);
      sel.innerHTML = (S.custom.length ? `<optgroup label="Created with AI">${S.custom.map(a => `<option value="${a.id}">✨ ${esc(a.name)} · ${esc(a.role)}</option>`).join("")}</optgroup>` : "") +
        `<optgroup label="Cast">${P.characters.map(c => `<option value="${c.id}">${esc(c.name)} · ${esc(c.role)}</option>`).join("")}</optgroup>`;
      sel.value = S.agent;
    }
    function card(s, mode) {
      const used = S.eq.includes(s.id);
      return `<div class="fi-card2 ${mode === "slot" ? "on" : used ? "used" : ""}" style="--k:${s.color || "#ff9f43"}" ${mode === "slot" ? `data-rm="${s.id}" title="Tap to unequip"` : `draggable="true" data-sk="${s.id}" tabindex="0" role="button" aria-label="Equip ${esc(s.name)}"`}>
        <div class="fc-top"><span class="fc-ico">${s.icon || "🧩"}</span><b>${esc(s.name)}</b>${s.custom ? `<span class="fc-mine">yours</span>` : ""}${s.custom && mode !== "slot" ? `<button class="fc-del" data-del="${s.id}" title="Delete skill" aria-label="Delete ${esc(s.name)}">✕</button>` : ""}</div>
        <p>${esc(s.desc || "")}</p>
        ${mode === "slot" ? "" : `${s.good ? `<small class="fc-good">Good for: ${esc(s.good)}</small>` : ""}<details><summary>Adds to the prompt</summary><q>${esc(s.instructions || "")}</q></details>`}
      </div>`;
    }
    function draw() {
      const c = agentById(S.agent);
      Puppet.mount($("#fiPup", main), c); $("#fiPers", main).textContent = c.personality;
      $("#fiSlots", main).innerHTML = [0, 1, 2].map(i => { const s = sk(S.eq[i]); return s ? card(s, "slot") : `<div class="fi-slot">Empty slot</div>`; }).join("");
      const list = lib().filter(s => S.filter === "all" || (S.filter === "mine" ? s.custom : !s.custom));
      $("#fiDeck", main).innerHTML = list.length ? list.map(s => card(s)).join("") : `<p class="muted">No skills of your own yet. Press ✨ Create a skill with AI.</p>`;
    }
    const equip = id => {
      const s = sk(id); if (!s || S.eq.includes(id)) return;
      if (S.eq.length >= 3) S.eq.shift();
      S.eq.push(id); draw(); Puppet.gesture($("#fiPup", main), "jump", 1200);
      coord.pulse("team", `${s.icon} ${s.name} equipped`, "out");
    };

    /* ---------- AI makers ---------- */
    function makerHTML(kind) {
      const ideas = kind === "skill" ? SKILL_IDEAS : AGENT_IDEAS;
      return `<div class="fi-mkbox">
        <div class="fi-mkh"><b>${kind === "skill" ? "✨ Create a skill with AI" : "✨ Create an agent with AI"}</b><button class="fc-del" data-close aria-label="Close">✕</button></div>
        <p class="muted small">${kind === "skill" ? "Describe what the skill should make an agent do. Finch's AI writes the skill card and the exact prompt instruction." : "Describe the agent. AI creates it, gives it a look and equips matching skills from the library."}</p>
        <div class="lab-bar"><input id="fiIdea" maxlength="160" placeholder="${kind === "skill" ? "e.g. explain anything like I'm 5" : "e.g. a calm support lead who negotiates refunds"}"><button class="btn btn-sm ai" id="fiMake" data-kind="${kind}">${kind === "skill" ? "Create skill" : "Create agent"}</button></div>
        <div class="ex-chips" id="fiIdeas">${ideas.map(t => `<button>${esc(t)}</button>`).join("")}</div>
        <div id="fiWork"></div><div id="fiMade"></div></div>`;
    }
    async function make(kind) {
      const idea = $("#fiIdea", main).value.trim(); if (!idea) { $("#fiIdea", main).focus(); return; }
      const btn = $("#fiMake", main); btn.disabled = true;
      const w = workSteps($("#fiWork", main), kind === "skill" ? ["Reading your idea", "Writing the procedure", "Choosing icon & colour", "Adding it to the library"] : ["Reading your idea", "Writing a personality", "Picking skills from the library", "Designing the look"], kind === "skill" ? "Finch skill designer at work" : "Agent designer at work");
      try {
        if (kind === "skill") {
          const r = await aiSkill(idea);
          const saved = P.saveSkill({ name: r.name, icon: r.icon, color: r.color, desc: r.desc, instructions: r.instructions, good: r.good });
          w.done(r.why);
          $("#fiMade", main).innerHTML = `<div class="fi-made">${card({ ...saved, custom: true })}<div><b>Saved to your library.</b><p class="muted small">It's also available to agents in the playground's Finch mode.</p><button class="btn btn-sm" data-equip="${saved.id}">Equip on ${esc(agentById(S.agent).name)}</button></div></div>`;
          S.filter = "all"; $$("#fiFilter button", main).forEach(b => b.classList.toggle("on", b.dataset.f === "all"));
          draw();
          coord.pulse("team", `new skill: ${saved.name}`, "out");
          coord.pulse("bruin", "skill registered", "out");
        } else {
          const a = await aiAgent(idea);
          S.custom.unshift(a); S.agent = a.id; S.eq = a.skills.slice();
          w.done(a.why);
          drawAgents(); draw();
          Puppet.gesture($("#fiPup", main), "wave", 2000);
          $("#fiMade", main).innerHTML = `<div class="fi-made"><div class="fi-made-p" id="fiMadeP"></div><div><b>${esc(a.name)}</b> <span class="muted">· ${esc(a.role)}</span><p class="small">${esc(a.personality)}</p>
            <div class="fi-chips">${a.skills.map(id => { const s = sk(id); return s ? `<span style="--k:${s.color}">${s.icon} ${esc(s.name)}</span>` : ""; }).join("")}</div><p class="muted small">Equipped and selected. Press ▶ Run to test them.</p></div></div>`;
          Puppet.mount($("#fiMadeP", main), a);
          coord.pulse("team", `${a.name} joins with ${a.skills.length} skills`, "out");
        }
      } catch (e) { w.stop(); console.error(e); }
      btn.disabled = false;
    }

    /* ---------- events ---------- */
    $("#fiAg", main).onchange = e => { S.agent = e.target.value; const a = S.custom.find(x => x.id === S.agent); if (a) S.eq = a.skills.slice(); draw(); };
    main.addEventListener("click", e => {
      const t = e.target;
      const del = t.closest("[data-del]");
      if (del) { e.stopPropagation(); P.removeSkill(del.dataset.del); S.eq = S.eq.filter(x => x !== del.dataset.del); draw(); return; }
      if (t.closest("summary") || t.closest("details")) return;
      const op = t.closest("[data-open]");
      if (op) { const m = $("#fiMaker", main); if (S.open === op.dataset.open && !m.hidden) { m.hidden = true; S.open = ""; return; } S.open = op.dataset.open; m.innerHTML = makerHTML(S.open); m.hidden = false; $("#fiIdea", main).focus(); m.scrollIntoView({ behavior: "smooth", block: "nearest" }); return; }
      if (t.closest("[data-close]")) { $("#fiMaker", main).hidden = true; S.open = ""; return; }
      const idea = t.closest("#fiIdeas button"); if (idea) { $("#fiIdea", main).value = idea.textContent; return; }
      const mk = t.closest("#fiMake"); if (mk) { make(mk.dataset.kind); return; }
      const eqb = t.closest("[data-equip]"); if (eqb) { equip(eqb.dataset.equip); return; }
      const rm = t.closest("[data-rm]"); if (rm) { S.eq = S.eq.filter(x => x !== rm.dataset.rm); draw(); return; }
      const c = t.closest("#fiDeck [data-sk]"); if (c) { equip(c.dataset.sk); return; }
      const f = t.closest("#fiFilter [data-f]"); if (f) { S.filter = f.dataset.f; $$("#fiFilter button", main).forEach(b => b.classList.toggle("on", b === f)); draw(); return; }
      const ex = t.closest("#fiEx button"); if (ex) { $("#fiTask", main).value = ex.textContent; return; }
    });
    main.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.id === "fiIdea") { e.preventDefault(); $("#fiMake", main).click(); } const c = e.target.closest && e.target.closest("#fiDeck [data-sk]"); if (c && (e.key === "Enter" || e.key === " ") && e.target === c) { e.preventDefault(); equip(c.dataset.sk); } });
    $("#fiDeck", main).addEventListener("dragstart", e => { const b = e.target.closest("[data-sk]"); b && e.dataTransfer.setData("text/plain", b.dataset.sk); });
    const zone = $("#fiSlots", main);
    zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("over"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("over"));
    zone.addEventListener("drop", e => { e.preventDefault(); zone.classList.remove("over"); equip(e.dataTransfer.getData("text/plain")); });

    $("#fiRun", main).onclick = async () => {
      if (S.busy) return;
      const task = $("#fiTask", main).value.trim() || TASKS[0], c = agentById(S.agent), skills = S.eq.map(sk).filter(Boolean);
      S.busy = true; $("#fiRun", main).disabled = true;
      $("#fiOut", main).innerHTML = `<div class="ai-work"><b>🤖 ${esc(c.name)} is doing the task twice: plain, then with ${skills.length} skill${skills.length === 1 ? "" : "s"}</b><span class="dots3"><i></i><i></i><i></i></span></div>`;
      Puppet.emotion($("#fiPup", main), "thinking");
      const base = `You are ${c.name}, the ${c.role}. Personality: ${c.personality}`;
      const [plain, withS] = await Promise.all([
        Brain.ask(`${base}\nYou have NO special skills. Just answer the task in your own voice.\nReply with JSON only: {"final":"max 50 words"}`, `TASK: ${task}`, 0.8, () => ({ final: `Hmm. ${task}? I'd say sorry and try to sort it out somehow. Let me get back to you.` })),
        skills.length ? Brain.ask(`${base}\nYou have these Finch skills installed. Each is a reusable procedure you MUST apply, in this order:\n${skills.map(s => `- ${s.name}: ${s.instructions || s.desc}`).join("\n")}\nStay in character.\nReply with JSON only: {"steps":[{"skill":"skill name","output":"what applying it produced, max 30 words"}],"final":"your final answer combining the steps, max 60 words"}`, `TASK: ${task}`, 0.8,
          () => ({ steps: skills.map(s => ({ skill: s.name, output: offFor(s, task) })), final: skills.map(s => offFor(s, task)).join(" ") })) : Promise.resolve(null)
      ]);
      Puppet.emotion($("#fiPup", main), "happy"); Puppet.talk($("#fiPup", main), 1500);
      const wordsA = String(plain.final || "").split(/\s+/).length, wordsB = withS ? String(withS.final || "").split(/\s+/).length : 0;
      $("#fiOut", main).innerHTML = `
        <div class="lab-panel fi-col"><div class="lp-h">WITHOUT SKILLS</div><p>${esc(Brain.clip(plain.final, 400))}</p><small class="muted">${wordsA} words · no procedure</small></div>
        <div class="lab-panel good fi-col"><div class="lp-h">WITH ${skills.length ? skills.map(s => s.icon + " " + esc(s.name).toUpperCase()).join(" + ") : "NO SKILLS EQUIPPED"}</div>
          ${withS ? `<ol class="fi-steps">${(withS.steps || []).slice(0, 4).map((st, i) => { const s = skills[i] || {}; return `<li style="--k:${s.color || "#ff9f43"}"><b>${s.icon || "🧩"} ${esc(Brain.clip(st.skill, 30))}</b> ${esc(Brain.clip(st.output, 240))}</li>`; }).join("")}</ol><p class="fi-final">${esc(Brain.clip(withS.final, 500))}</p><small class="muted">${wordsB} words · ${skills.length} procedure${skills.length === 1 ? "" : "s"} applied</small>` : `<p class="muted">Equip at least one skill to compare.</p>`}</div>`;
      if (withS) { coord.pulse("band", "skilled answer shared", "out"); coord.pulse("bruin", "with vs without logged", "out"); }
      S.busy = false; $("#fiRun", main).disabled = false;
    };
    drawAgents(); draw();
    return {};
  }

  /* =========================================================
     5 · Casuro — voice interview
     ========================================================= */
  const ROLES = {
    "Product designer": ["Tell me about a design you shipped that you're proud of.", "Describe a time user research changed your mind.", "How do you handle a stakeholder who hates your design?"],
    "Software engineer": ["Tell me about a hard bug you fixed. How did you find it?", "Describe a technical decision you'd make differently today.", "How do you work with a teammate who disagrees with your approach?"],
    "Sales rep": ["Tell me about the toughest deal you closed.", "Describe a time you lost a deal. What did you learn?", "How would you pitch our product to a skeptical CFO?"]
  };
  LABS.push({
    id: "casuro", tool: "Voice interview", playLink: "grow",
    title: "Take a 3-question voice interview",
    pitch: "An AI interviewer asks out loud, you answer by voice (or typing), and you get scored on evidence: every point quotes what you actually said.",
    how: [
      "<b>Pick a role</b> and press Start. The interviewer asks each question out loud.",
      "<b>Answer by voice</b> with 🎙 (Chrome/Edge), or type. Edit the transcript before moving on.",
      "After three answers, Casuro scores <b>clarity, evidence and relevance</b>, quoting your own words as proof.",
      "Want the full panel with three interviewers who confer in private? Open <b>Track 03</b> in the playground."
    ],
    demoChars: ["priya"], demoScenes: { bg: { base: "boardroom", time: "day" } },
    demo: [
      { cap: "The interviewer asks out loud", dur: 3.4, draw(ctx, p, A, W, H) { drawCover(ctx, A.s.bg, W, H); drawPup(ctx, A.p.priya, 190, 340, 230); textBox(ctx, "Tell me about a hard bug you fixed.", 300, 90, 280, { tail: false }); } },
      { cap: "Answer with your voice: it's transcribed live", dur: 3.6, draw(ctx, p, A, W, H) { drawCover(ctx, A.s.bg, W, H); ctx.fillStyle = "rgba(8,10,22,.6)"; ctx.fillRect(0, 0, W, H); for (let i = 0; i < 40; i++) { const h = 10 + Math.abs(Math.sin(i * 0.7 + p * 20)) * 50; ctx.fillStyle = "#ff6b6b"; rr(ctx, 120 + i * 10, 120 - h / 2, 6, h, 3); ctx.fill(); } const t = "We had checkout failing for 3% of users. I bisected the deploys and found a timezone bug…"; textBox(ctx, t.slice(0, Math.floor(t.length * p)), 60, 190, W - 120, {}); } },
      { cap: "Scored on evidence, not vibes", dur: 3.4, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0d1226"; ctx.fillRect(0, 0, W, H); [["Clarity", 8], ["Evidence", 9], ["Relevance", 7]].forEach(([l, v], i) => { ctx.fillStyle = "#c9d0ee"; ctx.font = "15px 'Space Grotesk', sans-serif"; ctx.fillText(l, 60, 90 + i * 60); ctx.fillStyle = "rgba(255,255,255,.08)"; rr(ctx, 170, 74 + i * 60, 380, 22, 6); ctx.fill(); ctx.fillStyle = "#ff6b6b"; rr(ctx, 170, 74 + i * 60, 380 * v / 10 * ease(clamp(p * 1.5 - i * 0.2, 0, 1)), 22, 6); ctx.fill(); }); } },
      { cap: "Feedback quotes your own words", dur: 3.6, draw(ctx, p, A, W, H) { ctx.fillStyle = "#0d1226"; ctx.fillRect(0, 0, W, H); textBox(ctx, "“I bisected the deploys and found a timezone bug” → concrete method, measurable impact (3% of users).", 50, 70, W - 100, { bg: "rgba(255,107,107,.95)", color: "#1a0808" }); textBox(ctx, "Tip: end with the result. How many users were saved?", 50, 190, W - 100, {}); } }
    ],
    build: buildCasuro
  });

  function buildCasuro(main, coord) {
    coord = coord || { pulse() {} };
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const S = { role: "Software engineer", q: -1, answers: [], rec: null, listening: false, token: 0 };
    main.innerHTML = `
      <div class="chip-row" id="caRole">${Object.keys(ROLES).map(r => `<button data-r="${esc(r)}" class="${r === S.role ? "on" : ""}">${esc(r)}</button>`).join("")}</div>
      <div class="ca-stage" id="caStage"><div class="ca-pup" id="caPup"></div><div class="ca-bub" id="caBub">Hi! I'm Priya from the hiring team. Press <b>Start</b> when you're ready.</div><span class="ca-q" id="caQ"></span></div>
      <div id="caAns" hidden>
        <textarea id="caText" rows="3" maxlength="1200" placeholder="${SR ? "Press 🎙 and speak, or type your answer…" : "Type your answer… (voice input needs Chrome or Edge)"}"></textarea>
        <div class="lab-bar">${SR ? `<button class="btn ghost btn-sm" id="caMic">🎙 Answer by voice</button>` : ""}<button class="btn ghost btn-sm" id="caRepeat">🔁 Repeat question</button><button class="btn btn-sm" id="caNext">Next ➜</button></div>
      </div>
      <div class="lab-bar" id="caStartBar"><button class="btn btn-sm" id="caStart">▶ Start interview</button><span class="muted small">3 questions · about 3 minutes · sound on</span></div>
      <div id="caOut"></div>`;
    const stage = $("#caStage", main);
    Scenes.mount(stage, { base: "boardroom", time: "day" });
    const pup = $("#caPup", main);
    Puppet.mount(pup, charById("priya"));
    const say = (html, text) => { $("#caBub", main).innerHTML = html; Puppet.talk(pup, Math.min(6000, 300 + (text || "").length * 55)); speak(text || $("#caBub", main).textContent, 3); };
    $("#caRole", main).onclick = e => { const b = e.target.closest("[data-r]"); if (!b || S.q >= 0) return; S.role = b.dataset.r; $$("#caRole button", main).forEach(x => x.classList.toggle("on", x === b)); };
    function stopMic() { if (S.rec) { try { S.rec.stop(); } catch {} } S.listening = false; const m = $("#caMic", main); if (m) { m.textContent = "🎙 Answer by voice"; m.classList.remove("rec"); } }
    function startMic() {
      hush();
      const r = new SR(); S.rec = r; r.lang = "en-US"; r.continuous = true; r.interimResults = true;
      const base = $("#caText", main).value ? $("#caText", main).value + " " : "";
      r.onresult = e => { let txt = ""; for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript; $("#caText", main).value = base + txt; };
      r.onerror = ev => { stopMic(); if (ev.error === "not-allowed") $("#caText", main).placeholder = "Microphone blocked. Type your answer instead."; };
      r.onend = () => { if (S.listening) stopMic(); };
      try { r.start(); S.listening = true; const m = $("#caMic", main); m.textContent = "■ Stop recording"; m.classList.add("rec"); } catch { stopMic(); }
    }
    function ask() {
      const q = ROLES[S.role][S.q];
      $("#caQ", main).textContent = `QUESTION ${S.q + 1} / 3`;
      Puppet.gesture(pup, S.q ? "nod" : "wave", 1600);
      say(esc(q), q);
      $("#caText", main).value = ""; $("#caText", main).focus({ preventScroll: true });
    }
    $("#caStart", main).onclick = () => { S.q = 0; S.answers = []; $("#caOut", main).innerHTML = ""; $("#caStartBar", main).hidden = true; $("#caAns", main).hidden = false; $$("#caRole button", main).forEach(b => b.disabled = true); ask(); };
    if ($("#caMic", main)) $("#caMic", main).onclick = () => (S.listening ? stopMic() : startMic());
    $("#caRepeat", main).onclick = () => ask();
    $("#caNext", main).onclick = async () => {
      stopMic();
      const a = $("#caText", main).value.trim();
      if (a.length < 3) { $("#caText", main).placeholder = "Say or type at least a sentence first."; $("#caText", main).focus(); return; }
      S.answers.push({ q: ROLES[S.role][S.q], a });
      S.q++;
      if (S.q < 3) { Puppet.emotion(pup, "calm"); return ask(); }
      $("#caAns", main).hidden = true; $("#caQ", main).textContent = "SCORING";
      coord.pulse("team", "3 answers + transcript", "out");
      Puppet.emotion(pup, "thinking");
      say("Thank you! Give me a moment to review your answers…", "Thank you! Give me a moment to review your answers.");
      await score();
    };
    function offline() {
      const sc = S.answers.map(x => {
        const w = x.a.split(/\s+/).length, nums = (x.a.match(/\d+/g) || []).length, I = (x.a.match(/\bI\b/g) || []).length, res = /result|so that|which meant|saved|increased|reduced|improv|learn/i.test(x.a);
        return { clarity: clamp(Math.round(4 + Math.min(w, 80) / 20 + (w > 140 ? -2 : 0)), 1, 10), evidence: clamp(3 + nums * 2 + (res ? 2 : 0) + Math.min(I, 3), 1, 10), relevance: clamp(5 + (w > 15 ? 2 : 0) + (res ? 1 : 0), 1, 10) };
      });
      const avg = k => Math.round(sc.reduce((s, x) => s + x[k], 0) / sc.length);
      const scores = { clarity: avg("clarity"), evidence: avg("evidence"), relevance: avg("relevance") };
      const tot = scores.clarity + scores.evidence + scores.relevance;
      return { scores, verdict: tot >= 24 ? "Strong yes" : tot >= 20 ? "Yes" : tot >= 15 ? "Maybe" : "Not yet",
        highlights: S.answers.map(x => ({ question: x.q, quote: x.a.split(/\s+/).slice(0, 14).join(" "), note: /\d/.test(x.a) ? "Concrete numbers make this believable." : "Add a number or a result to make it stick." })),
        tip: "Use the STAR shape: situation, task, action, and end with a measurable result." };
    }
    async function score() {
      const token = ++S.token;
      $("#caOut", main).innerHTML = `<div class="ai-work"><b>🤖 Casuro is scoring your answers against the evidence</b><span class="dots3"><i></i><i></i><i></i></span></div>`;
      const sys = `You are Casuro, a fair AI interviewer for a ${S.role} role. Score ONLY on evidence in the candidate's answers. Be kind but honest.
Reply with JSON only: {"scores":{"clarity":0-10,"evidence":0-10,"relevance":0-10},"verdict":"Strong yes|Yes|Maybe|Not yet","highlights":[{"question":"short version","quote":"an EXACT short quote (max 15 words) copied from the answer","note":"why it matters, max 14 words"}],"tip":"one concrete improvement"}`;
      const r = await Brain.ask(sys, S.answers.map((x, i) => `Q${i + 1}: ${x.q}\nA${i + 1}: ${x.a}`).join("\n\n"), 0.3, offline);
      if (token !== S.token) return;
      const sc = r.scores || {};
      const val = k => clamp(Math.round(+sc[k] || 0), 0, 10);
      const hls = (Array.isArray(r.highlights) ? r.highlights : []).slice(0, 3).map((h, i) => {
        const ans = (S.answers[i] || S.answers[0]).a, q = String(h.quote || "");
        return { question: Brain.clip(h.question || S.answers[i]?.q, 90), quote: q && ans.toLowerCase().includes(q.toLowerCase().slice(0, 20)) ? q : ans.split(/\s+/).slice(0, 14).join(" "), note: Brain.clip(h.note, 120) };
      });
      const verdict = ["Strong yes", "Yes", "Maybe", "Not yet"].includes(r.verdict) ? r.verdict : "Maybe";
      Puppet.emotion(pup, /yes/i.test(verdict) ? "happy" : "calm");
      coord.pulse("bruin", `verdict: ${verdict} + quotes`, "out");
      coord.pulse("finch", "suggest skill: Coach", "out");
      say(`My verdict: <b>${esc(verdict)}</b>. Details below.`, `My verdict: ${verdict}.`);
      $("#caQ", main).textContent = "RESULT";
      $("#caOut", main).innerHTML = `<div class="ca-res">
        <div class="ca-v"><span>VERDICT</span><b>${esc(verdict)}</b></div>
        <div class="ca-sc">${["clarity", "evidence", "relevance"].map(k => `<div><span>${k[0].toUpperCase() + k.slice(1)}</span><i><em style="width:${val(k) * 10}%"></em></i><b>${val(k)}/10</b></div>`).join("")}</div>
        <ol class="ca-hl">${hls.map(h => `<li><small>${esc(h.question)}</small><q>${esc(h.quote)}</q><span>${esc(h.note)}</span></li>`).join("")}</ol>
        <p class="ca-tip">💡 ${esc(Brain.clip(r.tip, 240))}</p>
        <div class="lab-bar"><button class="btn ghost btn-sm" id="caAgain">🔁 Try again</button><a class="btn btn-sm" href="/aim-hack-visual/play.html#grow">Full panel interview in Track 03 →</a></div></div>`;
      $("#caAgain", main).onclick = () => { S.q = -1; $("#caOut", main).innerHTML = ""; $("#caStartBar", main).hidden = false; $("#caQ", main).textContent = ""; $$("#caRole button", main).forEach(b => b.disabled = false); say("Ready when you are. Pick a role and press <b>Start</b>.", "Ready when you are."); };
    }
    return { destroy() { S.token++; stopMic(); hush(); } };
  }
})();

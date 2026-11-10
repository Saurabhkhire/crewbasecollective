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
     3 · Bruin — the data & AI platform behind every agent
     Ingest → Transform (assets + lineage) → Quality checks → AI analyst (Slack / Teams / browser) → Dashboard
     ========================================================= */
  const STORIES = ["Escape Pod", "Inside Job", "Manor Dinner", "The Verdict"];
  const ENDINGS = ["Triumph", "Tragedy", "Betrayal", "Bittersweet", "Twist", "Comedy"];
  const ACTORS = ["vega", "rook", "imani", "bolt", "kit", "marlowe", "ashford", "nyx"];
  const CANDS = ["Alex", "Sam", "Jordan", "Riley", "Taylor"];
  const RUBRIC = ["Clarity", "Evidence", "Impact", "Confidence"];
  const spAll = id => ((window.HACK && (HACK.allSponsors || HACK.sponsors)) || []).find(s => s.id === id) || { id, name: id, icon: "•", color: "#8d97bd" };
  const BR = () => spAll("bruin").color || "#ffc857";
  const rng = seed => { let s = seed >>> 0 || 42; return () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296); };

  function makeRuns(n, seed) {
    const r = rng(seed);
    const W = { "Escape Pod": [3, 3, 1, 4, 1, 1], "Inside Job": [1, 1, 6, 1, 2, 1], "Manor Dinner": [1, 2, 2, 1, 5, 2], "The Verdict": [2, 1, 1, 3, 3, 2] };
    const pickW = w => { let x = r() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < w.length; i++) { x -= w[i]; if (x < 0) return i; } return w.length - 1; };
    return Array.from({ length: n }, (_, i) => {
      const story = STORIES[Math.floor(r() * 4)], ending = ENDINGS[pickW(W[story])];
      const lead = ACTORS[pickW([2, 4, 1, 2, 2, 3, 2, 4])];
      return { run: i + 1, story, ending, lead, scenes: 10 + Math.floor(r() * 11), betrayals: ending === "Betrayal" ? 1 + Math.floor(r() * 3) : Math.floor(r() * 1.6), voice: r() < 0.4 };
    });
  }
  /* every tool and track produces rows: this is the "everything is data" story */
  function makeData(nRuns, seed) {
    const r = rng(seed + 7), runs = makeRuns(nRuns, seed);
    const BETRAY_W = { rook: 5, nyx: 6, ashford: 4, marlowe: 3, kit: 1, vega: 1, imani: 0.5, bolt: 0.7 };
    const messages = [], skillUses = [], renders = [], scores = [], rounds = [];
    const skillIds = (P.skills || []).map(s => s.name);
    runs.forEach(run => {
      const n = run.scenes + Math.floor(r() * 6);
      for (let k = 0; k < n; k++) {
        const from = ACTORS[Math.floor(r() * ACTORS.length)];
        let to = ACTORS[Math.floor(r() * ACTORS.length)]; if (to === from) to = ACTORS[(ACTORS.indexOf(from) + 1) % ACTORS.length];
        const roll = r() * 10;
        const kind = roll < (BETRAY_W[from] || 1) * (run.betrayals ? 0.45 : 0.12) ? "betray" : roll < 4.5 ? "chat" : roll < 7.5 ? "delegate" : "alliance";
        messages.push({ id: messages.length + 1, run: run.run, from, to, kind });
      }
      for (let k = 0; k < 2 + Math.floor(r() * 4); k++) skillUses.push({ run: run.run, agent: ACTORS[Math.floor(r() * ACTORS.length)], skill: skillIds[Math.floor(r() * skillIds.length)] || "Plan" });
      for (let k = 0; k < 1 + Math.floor(r() * 4); k++) renders.push({ run: run.run, kind: k ? "frame" : "poster" });
      for (let k = 0; k < 3; k++) rounds.push({ run: run.run, round: k + 1 });
    });
    /* an LLM typo the quality checks will catch */
    [5, 17, 29].forEach(i => { if (messages[i]) { messages[i].kind = "betrayl"; messages[i].from = ["nyx", "rook", "nyx"][i % 3]; } });
    const SKILL = { Alex: 3.9, Sam: 3.1, Jordan: 4.3, Riley: 2.8, Taylor: 3.6 };
    CANDS.forEach(c => { for (let sess = 1; sess <= 2 + Math.floor(r() * 2); sess++) RUBRIC.forEach(rb => scores.push({ candidate: c, session: sess, skill: rb, score: Math.max(1, Math.min(5, Math.round(SKILL[c] + (r() - 0.5) * 2 + sess * 0.2))) })); });
    return { runs, messages, skillUses, renders, scores, rounds };
  }
  const countBy = (rows, f) => rows.reduce((m, x) => { const k = f(x); m[k] = (m[k] || 0) + 1; return m; }, {});
  function summarize(D, fixed) {
    const msgs = D.messages.map(m => (fixed && m.kind === "betrayl" ? { ...m, kind: "betray" } : m));
    const betray = countBy(msgs.filter(m => m.kind === "betray"), m => charById(m.from).name);
    const cand = {}; CANDS.forEach(c => { const s = D.scores.filter(x => x.candidate === c); cand[c] = +(s.reduce((a, x) => a + x.score, 0) / Math.max(1, s.length)).toFixed(2); });
    const bySkill = {}; RUBRIC.forEach(rb => { const s = D.scores.filter(x => x.skill === rb); bySkill[rb] = +(s.reduce((a, x) => a + x.score, 0) / Math.max(1, s.length)).toFixed(2); });
    return {
      film_runs: D.runs.length, endings: countBy(D.runs, x => x.ending), lead_agent_runs: countBy(D.runs, x => charById(x.lead).name),
      betrayals_by_agent: betray, messages_total: D.messages.length, message_kinds: countBy(msgs, m => m.kind),
      skill_uses: countBy(D.skillUses, x => x.skill), adal_renders: D.renders.length, game_rounds: D.rounds.length,
      interview_avg_by_candidate: cand, interview_avg_by_skill: bySkill, data_quality: fixed ? "all checks pass" : "WARNING: accepted_values check failing on stg.messages.kind (3 rows 'betrayl'); betrayal counts exclude them"
    };
  }

  /* assets, lineage and SQL in Bruin's asset format */
  const ASSETS = [
    { id: "raw.film_runs", col: 0, src: "film", rows: D => D.runs.length, deps: [], checks: [["row_count", "> 0"]] },
    { id: "raw.game_rounds", col: 0, src: "game", rows: D => D.rounds.length, deps: [], checks: [["not_null", "round"]] },
    { id: "raw.band_messages", col: 0, src: "band", rows: D => D.messages.length, deps: [], checks: [["not_null", "from_agent"], ["row_count", "> 0"]] },
    { id: "raw.finch_skill_uses", col: 0, src: "finch", rows: D => D.skillUses.length, deps: [], checks: [["not_null", "skill"]] },
    { id: "raw.adal_renders", col: 0, src: "adal", rows: D => D.renders.length, deps: [], checks: [["accepted_values", "kind ∈ poster, frame"]] },
    { id: "raw.casuro_scores", col: 0, src: "casuro", rows: D => D.scores.length, deps: [], checks: [["freshness", "< 1 hour"]] },
    { id: "stg.messages", col: 1, rows: D => D.messages.length, deps: ["raw.band_messages"], checks: [["unique", "message_id"], ["accepted_values", "kind ∈ chat, delegate, alliance, betray", true]] },
    { id: "stg.decisions", col: 1, rows: D => D.runs.reduce((a, x) => a + x.scenes, 0) + D.rounds.length, deps: ["raw.film_runs", "raw.game_rounds", "raw.finch_skill_uses"], checks: [["not_null", "agent"], ["freshness", "< 1 hour"]] },
    { id: "stg.media", col: 1, rows: D => D.renders.length, deps: ["raw.adal_renders"], checks: [["row_count", "> 0"]] },
    { id: "stg.scores", col: 1, rows: D => D.scores.length, deps: ["raw.casuro_scores"], checks: [["accepted_values", "score ∈ 1..5"], ["not_null", "candidate"]] },
    { id: "mart.agent_performance", col: 2, rows: () => ACTORS.length, deps: ["stg.decisions", "stg.messages"], checks: [["unique", "agent"]] },
    { id: "mart.endings", col: 2, rows: () => ENDINGS.length, deps: ["stg.decisions", "stg.media"], checks: [["row_count", "> 0"]] },
    { id: "mart.interview_scores", col: 2, rows: () => CANDS.length * RUBRIC.length, deps: ["stg.scores"], checks: [["unique", "candidate, skill"]] }
  ];
  const SRC = { film: { icon: "🎬", name: "Track 01 · Film runs" }, game: { icon: "🎮", name: "Track 02 · Game rounds" } };
  const srcInfo = k => SRC[k] || { icon: spAll(k).icon, name: `${spAll(k).name} · ${{ band: "messages", finch: "skill uses", adal: "renders", casuro: "scores" }[k]}` };
  function assetSQL(a, fixed) {
    const body = {
      "raw.film_runs": "-- loaded by ingestr from the playground event stream\nSELECT * FROM playground.film_runs",
      "raw.game_rounds": "SELECT * FROM playground.game_rounds",
      "raw.band_messages": "-- every message agents sent through BAND channels\nSELECT * FROM band.channel_messages",
      "raw.finch_skill_uses": "SELECT * FROM finch.skill_events",
      "raw.adal_renders": "SELECT * FROM adal.render_jobs",
      "raw.casuro_scores": "SELECT * FROM casuro.rubric_scores",
      "stg.messages": fixed
        ? "SELECT id AS message_id, run_id, from_agent, to_agent,\n       CASE WHEN kind = 'betrayl' THEN 'betray' ELSE kind END AS kind  -- fix: LLM typo\nFROM raw.band_messages"
        : "SELECT id AS message_id, run_id, from_agent, to_agent, kind\nFROM raw.band_messages",
      "stg.decisions": "SELECT run_id, agent, action, skill, created_at\nFROM raw.film_runs\nJOIN raw.finch_skill_uses USING (run_id)\nUNION ALL SELECT run_id, agent, action, NULL, created_at FROM raw.game_rounds",
      "stg.media": "SELECT run_id, kind, COUNT(*) AS renders FROM raw.adal_renders GROUP BY 1, 2",
      "stg.scores": "SELECT candidate, session, skill, score FROM raw.casuro_scores",
      "mart.agent_performance": "SELECT d.agent,\n       COUNT(*) AS decisions,\n       COUNT_IF(m.kind = 'betray') AS betrayals,\n       COUNT_IF(m.kind = 'delegate') AS delegations\nFROM stg.decisions d LEFT JOIN stg.messages m ON m.from_agent = d.agent\nGROUP BY 1",
      "mart.endings": "SELECT ending, COUNT(*) AS runs, AVG(frames) AS avg_frames\nFROM stg.decisions JOIN stg.media USING (run_id)\nGROUP BY 1 ORDER BY runs DESC",
      "mart.interview_scores": "SELECT candidate, skill, AVG(score) AS avg_score\nFROM stg.scores GROUP BY 1, 2"
    }[a.id];
    const cols = a.checks.map(([c, v]) => `  - name: ${v.split(/ [∈<>]/)[0].split(",")[0].trim().replace(/^[<>].*/, "rows")}\n    checks:\n      - name: ${c}${/∈|<|>/.test(v) ? `   # ${v}` : ""}`).join("\n");
    return `/* @bruin\nname: ${a.id}\ntype: duckdb.sql\nmaterialization:\n  type: table${a.deps.length ? `\ndepends:\n${a.deps.map(d => `  - ${d}`).join("\n")}` : ""}\ncolumns:\n${cols}\n@bruin */\n\n${body}`;
  }

  LABS.push({
    id: "bruin", tool: "Data & AI platform", playLink: "film",
    title: "Every agent decision is data. Bruin turns it into answers.",
    pitch: "Bruin is one workspace for the whole data journey. Ingest events from every tool and track, transform them into trusted assets with lineage, guard them with quality checks, then ask the AI analyst in Slack, Teams or the browser and get answers in seconds.",
    how: [
      "<b>Ingest:</b> press ▶ and watch BAND messages, Finch skill uses, AdaL renders, Casuro scores and track runs land in raw tables.",
      "<b>Transform:</b> run the pipeline. Assets build in dependency order; click any asset for its SQL.",
      "<b>Quality:</b> checks run on every asset. One fails on purpose; read why, then <b>Fix &amp; re-run</b>.",
      "<b>Ask AI:</b> chat with Bruin in a Slack, Teams or browser mock-up. It answers in plain English with a chart and the SQL it ran.",
      "<b>Run end-to-end</b> plays the whole story in one go."
    ],
    demoChars: ["vega", "rook", "nyx"], demoScenes: { bg: { base: "boardroom", time: "night" } },
    demo: [
      { cap: "Ingest: every tool streams events into Bruin", dur: 3.6, draw(ctx, p, A, W, H) { bgDark(ctx, W, H); demoIngest(ctx, W, H, p); } },
      { cap: "Transform: assets build in dependency order", dur: 3.8, draw(ctx, p, A, W, H) { bgDark(ctx, W, H); demoDag(ctx, W, H, p, false); } },
      { cap: "Quality: a check catches an LLM typo before it spreads", dur: 3.6, draw(ctx, p, A, W, H) { bgDark(ctx, W, H); demoDag(ctx, W, H, 1, true); textBox(ctx, "✗ accepted_values failed on stg.messages.kind: 3 rows say 'betrayl'", W / 2, 300, W - 120, { center: true, bg: "rgba(255,107,107,.95)" }); } },
      { cap: "Ask in Slack, get the answer in seconds", dur: 4.2, draw(ctx, p, A, W, H) { bgDark(ctx, W, H); demoSlack(ctx, W, H, p, A); } }
    ],
    build: buildBruin
  });

  function bgDark(ctx, W, H) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0d1226"); g.addColorStop(1, "#070a14"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  function demoIngest(ctx, W, H, p) {
    const src = ["band", "finch", "adal", "casuro", "film", "game"], hub = { x: W / 2, y: H / 2 };
    src.forEach((k, i) => {
      const y = 40 + i * 50, s = srcInfo(k);
      ctx.fillStyle = "#151d3d"; rr(ctx, 24, y - 16, 150, 32, 10); ctx.fill();
      ctx.fillStyle = "#eaf0ff"; ctx.font = "13px 'Space Grotesk', sans-serif"; ctx.fillText(`${s.icon} ${s.name.split(" · ")[0]}`, 36, y + 5);
      ctx.strokeStyle = "rgba(255,200,87,.35)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(174, y); ctx.lineTo(hub.x - 60, hub.y); ctx.stroke();
      const t = (p * 2 + i * 0.17) % 1; ctx.fillStyle = "#ffc857"; ctx.beginPath(); ctx.arc(174 + (hub.x - 60 - 174) * t, y + (hub.y - y) * t, 5, 0, 7); ctx.fill();
      ctx.fillStyle = "#151d3d"; rr(ctx, W - 210, y - 16, 186, 32, 10); ctx.fill(); ctx.fillStyle = "#c9d0ee"; ctx.font = "12px 'JetBrains Mono', monospace"; ctx.fillText(`raw.${["band_messages", "finch_skill_uses", "adal_renders", "casuro_scores", "film_runs", "game_rounds"][i]}`, W - 200, y - 1); ctx.fillStyle = "#ffc857"; ctx.fillText(`${Math.floor(p * [612, 160, 110, 160, 50, 150][i])} rows`, W - 200, y + 12);
      ctx.strokeStyle = "rgba(255,200,87,.25)"; ctx.beginPath(); ctx.moveTo(hub.x + 60, hub.y); ctx.lineTo(W - 210, y); ctx.stroke();
    });
    ctx.fillStyle = "#ffc857"; rr(ctx, hub.x - 60, hub.y - 30, 120, 60, 14); ctx.fill(); ctx.fillStyle = "#0a0d1a"; ctx.font = "700 15px 'Space Grotesk', sans-serif"; ctx.textAlign = "center"; ctx.fillText("🏛️ Bruin", hub.x, hub.y - 2); ctx.font = "11px 'JetBrains Mono', monospace"; ctx.fillText("ingestr", hub.x, hub.y + 16); ctx.textAlign = "left";
  }
  function demoDag(ctx, W, H, p, fail) {
    const cols = [["raw.band_messages", "raw.film_runs", "raw.casuro_scores"], ["stg.messages", "stg.decisions", "stg.scores"], ["mart.agent_performance", "mart.endings", "mart.interview_scores"]];
    const pos = (c, i) => ({ x: 30 + c * ((W - 60) / 3), y: 50 + i * 80 });
    const edges = [[0, 0, 1, 0], [0, 1, 1, 1], [0, 2, 1, 2], [1, 0, 2, 0], [1, 1, 2, 0], [1, 1, 2, 1], [1, 2, 2, 2]];
    edges.forEach(([c1, i1, c2, i2]) => { const a = pos(c1, i1), b = pos(c2, i2); ctx.strokeStyle = "rgba(255,200,87,.35)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x + 170, a.y + 18); ctx.bezierCurveTo(a.x + 200, a.y + 18, b.x - 30, b.y + 18, b.x, b.y + 18); ctx.stroke(); });
    cols.forEach((col, c) => col.forEach((name, i) => {
      const q = pos(c, i), done = p * 3 > c + i * 0.3, bad = fail && name === "stg.messages", blocked = fail && name === "mart.agent_performance";
      ctx.fillStyle = bad ? "rgba(255,107,107,.9)" : blocked ? "#2a2f45" : done ? "rgba(255,200,87,.95)" : "#151d3d"; rr(ctx, q.x, q.y, 170, 36, 10); ctx.fill();
      ctx.fillStyle = done && !blocked ? "#0a0d1a" : "#c9d0ee"; ctx.font = "12px 'JetBrains Mono', monospace"; ctx.fillText(`${bad ? "✗" : blocked ? "⏸" : done ? "✓" : "○"} ${name}`, q.x + 10, q.y + 22);
    }));
  }
  function demoSlack(ctx, W, H, p, A) {
    ctx.fillStyle = "#1a1d21"; rr(ctx, 30, 24, W - 60, H - 48, 14); ctx.fill();
    ctx.fillStyle = "#3f0e40"; rr(ctx, 30, 24, 130, H - 48, 14); ctx.fill(); ctx.fillStyle = "#eaf0ff"; ctx.font = "700 12px 'Space Grotesk', sans-serif"; ctx.fillText("Crewbase", 44, 50); ctx.font = "12px 'Space Grotesk', sans-serif"; ["# general", "# hackathon-data", "# agents"].forEach((c, i) => { if (i === 1) { ctx.fillStyle = "#1164a3"; rr(ctx, 38, 64 + i * 26, 114, 22, 6); ctx.fill(); } ctx.fillStyle = "#eaf0ff"; ctx.fillText(c, 46, 79 + i * 26); });
    ctx.fillStyle = "#eaf0ff"; ctx.font = "13px 'Space Grotesk', sans-serif"; ctx.fillText("You: @Bruin which agent betrays the most?", 180, 70);
    if (p > 0.35) {
      ctx.fillStyle = "#ffc857"; ctx.font = "700 13px 'Space Grotesk', sans-serif"; ctx.fillText("🏛️ Bruin  APP", 180, 108);
      ctx.fillStyle = "#eaf0ff"; ctx.font = "13px 'Space Grotesk', sans-serif"; ctx.fillText("Nyx betrays most: 41 of 118 betrayal messages (35%).", 180, 130);
      [["Nyx", 41], ["Rook", 33], ["Lady Ashford", 22], ["Marlowe", 14]].forEach(([n, v], i) => { const w = (v / 41) * (W - 360) * Math.min(1, (p - 0.35) * 2.5); ctx.fillStyle = "#c9d0ee"; ctx.fillText(n, 180, 168 + i * 30); ctx.fillStyle = i ? "rgba(255,200,87,.45)" : "#ffc857"; rr(ctx, 290, 154 + i * 30, Math.max(4, w), 18, 4); ctx.fill(); });
    }
  }

  function buildBruin(main, coord) {
    coord = coord || { pulse() {} };
    const S = { D: makeData(50, 42), seed: 42, nRuns: 50, ingested: false, ran: false, fixed: false, state: {}, checks: {}, skin: "slack", sel: "stg.messages", asked: 0, busy: false, token: 0 };
    const C = BR();
    const TABS = [["ingest", "① Ingest"], ["transform", "② Transform"], ["quality", "③ Quality"], ["ask", "④ Ask AI"], ["dash", "⑤ Dashboard"], ["why", "Why Bruin"]];
    main.innerHTML = `
      <div class="bx" style="--b:${C}">
        <div class="bx-top">
          <div class="bx-ws"><span class="bx-logo">🏛️</span><div><b>bruin</b><small>project · hackathon-agents</small></div></div>
          <div class="bx-status" id="bxStatus"></div>
          <button class="btn btn-sm" id="bxAll">▶ Run end-to-end</button>
        </div>
        <div class="bx-tabs" role="tablist">${TABS.map(([k, l], i) => `<button role="tab" data-t="${k}" class="${i ? "" : "on"}">${l}</button>`).join("")}</div>
        <section class="bx-pane" data-p="ingest"></section>
        <section class="bx-pane" data-p="transform" hidden></section>
        <section class="bx-pane" data-p="quality" hidden></section>
        <section class="bx-pane" data-p="ask" hidden></section>
        <section class="bx-pane" data-p="dash" hidden></section>
        <section class="bx-pane" data-p="why" hidden></section>
      </div>`;
    const pane = k => main.querySelector(`[data-p="${k}"]`);
    const tab = k => { $$(".bx-tabs button", main).forEach(b => b.classList.toggle("on", b.dataset.t === k)); $$(".bx-pane", main).forEach(p => (p.hidden = p.dataset.p !== k)); if (k === "dash") drawDash(); };
    $(".bx-tabs", main).onclick = e => { const b = e.target.closest("[data-t]"); if (b) tab(b.dataset.t); };
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const alive = t => t === S.token && main.isConnected;
    const totalRows = () => ASSETS.filter(a => a.col === 0).reduce((s, a) => s + a.rows(S.D), 0);
    function status() {
      const nChecks = ASSETS.reduce((s, a) => s + a.checks.length, 0);
      const pass = Object.values(S.checks).filter(v => v === "pass").length, fail = Object.values(S.checks).filter(v => v === "fail").length;
      $("#bxStatus", main).innerHTML = [
        `<span class="${S.ingested ? "ok" : ""}">📥 ${S.ingested ? totalRows().toLocaleString() + " rows" : "not ingested"}</span>`,
        `<span class="${S.ran ? "ok" : ""}">🧱 ${Object.values(S.state).filter(v => v === "ok").length}/${ASSETS.length} assets</span>`,
        `<span class="${fail ? "bad" : pass ? "ok" : ""}">🛡️ ${pass}/${nChecks} checks${fail ? ` · ${fail} failing` : ""}</span>`,
        `<span class="${S.asked ? "ok" : ""}">💬 ${S.asked} answered</span>`
      ].join("");
    }

    /* ---------------- ① INGEST ---------------- */
    const SOURCES = ["band", "finch", "adal", "casuro", "film", "game"];
    const RAW_OF = { band: "raw.band_messages", finch: "raw.finch_skill_uses", adal: "raw.adal_renders", casuro: "raw.casuro_scores", film: "raw.film_runs", game: "raw.game_rounds" };
    function drawIngest() {
      const h = 52, H = SOURCES.length * h + 20, hubY = H / 2;
      const path = (y1, y2, x1, x2) => `M${x1} ${y1} C${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`;
      pane("ingest").innerHTML = `
        <p class="bx-lead">Every agent action in the playground is an event. Bruin's open-source ingestion (<b>ingestr</b>) pulls them from each tool into raw tables in one workspace: no glue scripts.</p>
        <div class="bx-ing">
          <svg viewBox="0 0 720 ${H}" class="bx-ing-svg" aria-label="Sources flowing into Bruin raw tables">
            ${SOURCES.map((k, i) => { const y = 10 + i * h + h / 2; return `<path id="bxi-a${i}" d="${path(y, hubY, 190, 300)}" class="bx-wire"/><path id="bxi-b${i}" d="${path(hubY, y, 420, 500)}" class="bx-wire"/>`; }).join("")}
            ${S.ingesting ? SOURCES.map((k, i) => `<circle r="5" class="bx-pk"><animateMotion dur="1.3s" begin="${(i * 0.21).toFixed(2)}s" repeatCount="indefinite"><mpath href="#bxi-a${i}"/></animateMotion></circle><circle r="4" class="bx-pk b"><animateMotion dur="1.1s" begin="${(0.5 + i * 0.17).toFixed(2)}s" repeatCount="indefinite"><mpath href="#bxi-b${i}"/></animateMotion></circle>`).join("") : ""}
            ${SOURCES.map((k, i) => { const y = 10 + i * h, s = srcInfo(k), col = SRC[k] ? "#8d97bd" : spAll(k).color; return `<g class="bx-src"><rect x="6" y="${y + 6}" width="184" height="${h - 12}" rx="10" style="stroke:${col}"/><text x="20" y="${y + h / 2 + 5}">${s.icon} ${esc(s.name)}</text></g>`; }).join("")}
            <g class="bx-hub ${S.ingesting ? "on" : ""}"><rect x="300" y="${hubY - 38}" width="120" height="76" rx="16"/><text x="360" y="${hubY - 6}" text-anchor="middle" class="t1">🏛️ Bruin</text><text x="360" y="${hubY + 16}" text-anchor="middle" class="t2">ingestr</text></g>
            ${SOURCES.map((k, i) => { const y = 10 + i * h, a = ASSETS.find(x => x.id === RAW_OF[k]); return `<g class="bx-raw ${S.ingested ? "ok" : ""}"><rect x="500" y="${y + 6}" width="214" height="${h - 12}" rx="10"/><text x="514" y="${y + h / 2 - 2}" class="t1">${a.id}</text><text x="514" y="${y + h / 2 + 13}" class="t2" data-cnt="${a.id}">${S.ingested ? a.rows(S.D).toLocaleString() : 0} rows</text></g>`; }).join("")}
          </svg>
        </div>
        <div class="lab-bar"><button class="btn btn-sm" id="bxIngest">${S.ingested ? "↻ Ingest again" : "▶ Ingest events"}</button><button class="btn ghost btn-sm" id="bxMore">＋ Simulate 10 more film runs</button><span class="muted bx-note" id="bxIngNote">${S.ingested ? `${totalRows().toLocaleString()} rows from ${SOURCES.length} sources, ready to transform.` : "Sources: 4 sponsor tools + 2 playground tracks."}</span></div>`;
      $("#bxIngest", main).onclick = () => ingest();
      $("#bxMore", main).onclick = () => { S.nRuns += 10; S.seed += 11; S.D = makeData(S.nRuns, S.seed); S.ingested = false; S.ran = false; S.state = {}; S.checks = {}; drawAll(); ingest(); };
    }
    async function ingest() {
      const t = ++S.token; S.ingesting = true; S.ingested = false; drawIngest(); status();
      ["band", "finch", "adal", "casuro"].forEach((k, i) => setTimeout(() => coord.pulse(k, `${ASSETS.find(a => a.id === RAW_OF[k]).rows(S.D)} rows → raw`, "in"), i * 300));
      const steps = 24;
      for (let s = 1; s <= steps; s++) {
        await sleep(110); if (!alive(t)) return;
        SOURCES.forEach(k => { const a = ASSETS.find(x => x.id === RAW_OF[k]); const el = main.querySelector(`[data-cnt="${a.id}"]`); if (el) el.textContent = Math.round(a.rows(S.D) * s / steps).toLocaleString() + " rows"; });
      }
      S.ingesting = false; S.ingested = true; drawIngest(); status();
    }

    /* ---------------- ② TRANSFORM ---------------- */
    function nodePos(a) {
      const col = ASSETS.filter(x => x.col === a.col), i = col.indexOf(a), n = col.length, H = 360;
      const gap = H / n; return { x: [8, 262, 516][a.col], y: gap * i + (gap - 40) / 2 + 4, w: a.col === 2 ? 196 : 176, h: 40 };
    }
    function drawTransform() {
      const edges = ASSETS.flatMap(a => a.deps.map(d => [ASSETS.find(x => x.id === d), a]));
      const st = id => S.state[id] || "idle";
      const nChecks = a => a.checks.length, nFail = a => a.checks.filter((c, k) => S.checks[a.id + "#" + k] === "fail").length;
      pane("transform").innerHTML = `
        <p class="bx-lead">Each table is a Bruin <b>asset</b>: SQL plus a small header that declares its dependencies and checks. Bruin reads those headers to build the lineage, runs assets in order, and checks each one before anything downstream uses it.</p>
        <div class="bx-dag-wrap"><svg viewBox="0 0 720 368" class="bx-dag" aria-label="Asset lineage">
          ${edges.map(([a, b]) => { const p = nodePos(a), q = nodePos(b), x1 = p.x + p.w, y1 = p.y + 20, x2 = q.x, y2 = q.y + 20; return `<path class="bx-edge ${st(b.id) === "ok" || st(b.id) === "run" ? "hot" : ""} ${st(b.id) === "blocked" ? "blk" : ""}" d="M${x1} ${y1} C${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}"/>`; }).join("")}
          ${ASSETS.map(a => { const p = nodePos(a), s = st(a.id), f = nFail(a); return `<g class="bx-node ${s} ${f ? "fail" : ""} ${S.sel === a.id ? "sel" : ""}" data-a="${a.id}" tabindex="0" role="button" aria-label="${a.id}">
            <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="10"/>
            <text x="${p.x + 12}" y="${p.y + 17}" class="t1">${a.id}</text>
            <text x="${p.x + 12}" y="${p.y + 32}" class="t2">${s === "run" ? "⏳ running…" : s === "blocked" ? "⏸ blocked by upstream check" : s === "ok" ? `✓ ${a.rows(S.D).toLocaleString()} rows · ${f ? `✗ ${f} check failed` : `🛡️ ${nChecks(a)} check${nChecks(a) > 1 ? "s" : ""}`}` : "○ not built"}</text></g>`; }).join("")}
          <text x="8" y="366" class="bx-colh">RAW</text><text x="262" y="366" class="bx-colh">STAGING</text><text x="516" y="366" class="bx-colh">MARTS</text>
        </svg></div>
        <div class="lab-bar"><button class="btn btn-sm" id="bxRun">${S.ran ? "↻ Run pipeline again" : "▶ Run pipeline"}</button><span class="muted bx-note">${S.ingested ? "Click any asset to read its definition." : "Tip: ingest first, or Run pipeline will ingest for you."}</span></div>
        <div class="bx-sql"><div class="bx-sql-h"><span>📄 assets/${S.sel.replace(".", "/")}.sql</span><span class="bx-dep">${(ASSETS.find(a => a.id === S.sel).deps.join(", ") || "source table")}</span></div><pre>${hl(assetSQL(ASSETS.find(a => a.id === S.sel), S.fixed))}</pre></div>`;
      $("#bxRun", main).onclick = () => runPipeline();
      $$(".bx-node", main).forEach(n => { const go = () => { S.sel = n.dataset.a; drawTransform(); }; n.onclick = go; n.onkeydown = e => e.key === "Enter" && go(); });
    }
    function hl(sql) {
      return esc(sql)
        .replace(/(\/\* @bruin|@bruin \*\/)/g, '<i class="h-m">$1</i>')
        .replace(/^(name|type|materialization|depends|columns|checks):/gm, '<i class="h-k">$1</i>:')
        .replace(/\b(SELECT|FROM|JOIN|LEFT|ON|USING|GROUP BY|ORDER BY|UNION ALL|CASE|WHEN|THEN|ELSE|END|AS|COUNT_IF|COUNT|AVG|DESC|NULL)\b/g, '<i class="h-s">$1</i>')
        .replace(/(--[^\n]*)/g, '<i class="h-c">$1</i>');
    }
    async function runPipeline(t) {
      t = t || ++S.token;
      if (!S.ingested) { await ingest(); t = S.token; }
      S.state = {}; S.checks = {}; S.ran = false; tab("transform"); drawTransform(); status();
      for (const col of [0, 1, 2]) {
        const assets = ASSETS.filter(a => a.col === col);
        for (const a of assets) {
          const blocked = a.deps.some(d => ASSETS.find(x => x.id === d).checks.some((c, k) => S.checks[d + "#" + k] === "fail"));
          if (blocked) { S.state[a.id] = "blocked"; drawTransform(); continue; }
          S.state[a.id] = "run"; S.sel = a.id; drawTransform();
          await sleep(col ? 520 : 260); if (!alive(t)) return;
          S.state[a.id] = "ok";
          a.checks.forEach((c, k) => { S.checks[a.id + "#" + k] = c[2] && !S.fixed ? "fail" : "pass"; });
          drawTransform(); status();
        }
      }
      S.ran = true; drawTransform(); drawQuality(); status();
      coord.pulse("team", `${ASSETS.length} assets built`, "in");
    }

    /* ---------------- ③ QUALITY ---------------- */
    function drawQuality() {
      const rows = ASSETS.flatMap(a => a.checks.map((c, k) => ({ a, c, k, s: S.checks[a.id + "#" + k] })));
      const failing = rows.filter(r => r.s === "fail");
      pane("quality").innerHTML = `
        <p class="bx-lead">Checks live next to each asset and run every time it builds. If one fails, Bruin stops downstream assets so bad numbers never reach a dashboard or an answer.</p>
        <div class="bx-checks">${rows.map(r => `<div class="bx-chk ${r.s || "idle"}"><span class="st">${r.s === "pass" ? "✓" : r.s === "fail" ? "✗" : "○"}</span><code>${r.a.id}</code><b>${r.c[0]}</b><span class="v">${esc(r.c[1])}</span></div>`).join("")}</div>
        ${failing.length ? `<div class="bx-fail">
          <b>✗ accepted_values failed on <code>stg.messages.kind</code></b>
          <p>3 rows have <code>kind = 'betrayl'</code>: an agent's LLM misspelled “betray”. If this slipped through, <code>mart.agent_performance</code> would undercount betrayals and every answer about betrayal would be wrong. Bruin blocked that mart until it's fixed.</p>
          <pre>${hl("CASE WHEN kind = 'betrayl' THEN 'betray' ELSE kind END AS kind  -- fix: LLM typo")}</pre>
          <button class="btn btn-sm" id="bxFix">🔧 Fix &amp; re-run</button></div>`
        : S.ran ? `<div class="bx-okmsg">✓ All ${rows.length} checks pass. Every downstream asset is built and safe to query.</div>` : ""}
        <div class="lab-bar"><button class="btn ${failing.length ? "ghost " : ""}btn-sm" id="bxChk">${S.ran ? "↻ Re-run checks" : "▶ Run pipeline + checks"}</button></div>`;
      $("#bxChk", main).onclick = () => runPipeline().then(() => tab("quality"));
      const fx = $("#bxFix", main); if (fx) fx.onclick = async () => { S.fixed = true; S.sel = "stg.messages"; await runPipeline(); tab("quality"); coord.pulse("finch", "typo fixed → betray counted", "out"); };
    }

    /* ---------------- ④ ASK AI (Slack / Teams / browser) ---------------- */
    const QS = ["Which agent betrays the most?", "What ending is most common?", "Who scored best in interviews?", "Which Finch skill is used most?", "Which interview skill is weakest?"];
    function drawAsk() {
      pane("ask").innerHTML = `
        <p class="bx-lead">Bruin's AI analyst answers questions about your data in plain English, right where your team already talks. Same answer, three places:</p>
        <div class="bx-skins">${[["slack", "Slack"], ["teams", "Microsoft Teams"], ["web", "Browser"]].map(([k, l]) => `<button data-skin="${k}" class="${S.skin === k ? "on" : ""}">${l}</button>`).join("")}</div>
        <div class="bx-chat ${S.skin}">
          <aside class="bx-side">${S.skin === "slack" ? `<b>Crewbase Hackathon</b><small>Channels</small><span># general</span><span class="on"># hackathon-data</span><span># agents-film</span><small>Apps</small><span>🏛️ Bruin</span>`
            : S.skin === "teams" ? `<b>Teams</b><span>💬 Chat</span><span class="on">👥 Hackathon · data</span><span>📅 Calendar</span><span>🏛️ Bruin</span>`
            : `<b>🏛️ Bruin Cloud</b><span>Assets</span><span>Lineage</span><span class="on">AI analyst</span><span>Quality</span>`}</aside>
          <div class="bx-main">
            <div class="bx-ch-h">${S.skin === "slack" ? "<b># hackathon-data</b> · Bruin is in this channel" : S.skin === "teams" ? "<b>Hackathon · data</b> · Bruin app" : "<b>AI analyst</b> · connected to hackathon-agents"}</div>
            <div class="bx-msgs" id="bxMsgs">${S.msgs || `<div class="bx-empty">Ask a question below. Bruin queries the marts you just built.</div>`}</div>
            <form class="bx-compose" id="bxForm"><input id="bxQ" maxlength="160" placeholder="${S.skin === "web" ? "Ask anything about your data…" : "@Bruin ask a question about the hackathon data…"}" aria-label="Ask Bruin"><button class="btn btn-sm">Send</button></form>
            <div class="ex-chips bx-ex">${QS.map(q => `<button type="button">${esc(q)}</button>`).join("")}</div>
          </div>
        </div>`;
      $$("[data-skin]", main).forEach(b => b.onclick = () => { S.skin = b.dataset.skin; drawAsk(); });
      $("#bxForm", main).onsubmit = e => { e.preventDefault(); const q = $("#bxQ", main).value.trim(); if (q) ask(q); };
      $(".bx-ex", main).onclick = e => { const b = e.target.closest("button"); if (b) ask(b.textContent); };
      $("#bxMsgs", main).onclick = e => { const l = e.target.closest("[data-lineage]"); if (l) { S.sel = l.dataset.lineage; tab("transform"); drawTransform(); } };
      const m = $("#bxMsgs", main); m.scrollTop = m.scrollHeight;
    }
    function offline(q, s) {
      q = q.toLowerCase();
      const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]);
      const total = o => Object.values(o).reduce((a, b) => a + b, 0);
      if (/betray/.test(q)) { const t = top(s.betrayals_by_agent); return { answer: `${t[0][0]} betrays the most: ${t[0][1]} of ${total(s.betrayals_by_agent)} betrayal messages (${Math.round(t[0][1] / total(s.betrayals_by_agent) * 100)}%), ahead of ${t[1][0]} with ${t[1][1]}.${S.fixed ? "" : " Note: 3 rows are still failing a quality check, so these counts are a little low."}`, chart: "betrayals", highlight: t[0][0], sql: "SELECT agent, betrayals FROM mart.agent_performance ORDER BY betrayals DESC LIMIT 5;", asset: "mart.agent_performance" }; }
      if (/weak|worst|lowest|improve/.test(q)) { const t = top(s.interview_avg_by_skill).reverse(); return { answer: `${t[0][0]} is the weakest interview skill (avg ${t[0][1]} / 5). ${t[t.length - 1][0]} is the strongest (${t[t.length - 1][1]}). Coach candidates on ${t[0][0].toLowerCase()} first.`, chart: "skills_rubric", highlight: t[0][0], sql: "SELECT skill, AVG(avg_score) FROM mart.interview_scores GROUP BY 1 ORDER BY 2;", asset: "mart.interview_scores" }; }
      if (/interview|score|candidate|best/.test(q)) { const t = top(s.interview_avg_by_candidate); return { answer: `${t[0][0]} scored best in interviews with an average of ${t[0][1]} / 5 across every rubric skill, followed by ${t[1][0]} (${t[1][1]}).`, chart: "interviews", highlight: t[0][0], sql: "SELECT candidate, AVG(avg_score) AS score FROM mart.interview_scores GROUP BY 1 ORDER BY 2 DESC;", asset: "mart.interview_scores" }; }
      if (/skill|finch/.test(q)) { const t = top(s.skill_uses); return { answer: `${t[0][0]} is the most-used Finch skill: ${t[0][1]} uses out of ${total(s.skill_uses)}.`, chart: "skills", highlight: t[0][0], sql: "SELECT skill, COUNT(*) FROM stg.decisions WHERE skill IS NOT NULL GROUP BY 1 ORDER BY 2 DESC;", asset: "stg.decisions" }; }
      const t = top(s.endings); return { answer: `${t[0][0]} is the most common ending: ${t[0][1]} of ${s.film_runs} film runs (${Math.round(t[0][1] / s.film_runs * 100)}%). ${t[1][0]} is next with ${t[1][1]}.`, chart: "endings", highlight: t[0][0], sql: "SELECT ending, runs FROM mart.endings ORDER BY runs DESC;", asset: "mart.endings" };
    }
    const CHART = { betrayals: ["Betrayals by agent", s => s.betrayals_by_agent], endings: ["Film endings", s => s.endings], interviews: ["Avg interview score (of 5)", s => s.interview_avg_by_candidate], skills: ["Finch skill uses", s => s.skill_uses], skills_rubric: ["Avg score by interview skill", s => s.interview_avg_by_skill] };
    function chartCard(kind, highlight, s) {
      const c = CHART[kind]; if (!c) return "";
      const rows = Object.entries(c[1](s)).sort((a, b) => b[1] - a[1]).slice(0, 6), max = Math.max(...rows.map(r => r[1]), 1);
      const h = String(highlight || "").toLowerCase();
      return `<div class="bx-card"><small>${esc(c[0])}</small>${rows.map(([l, v]) => `<div class="bx-bar ${l.toLowerCase() === h || (h && l.toLowerCase().includes(h)) ? "hl" : ""}"><span>${esc(l)}</span><i style="width:${(v / max) * 100}%"></i><em>${v}</em></div>`).join("")}</div>`;
    }
    const ASK_TIME = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    async function ask(q) {
      if (S.busy) return; S.busy = true;
      if (!S.ran) { await runPipeline(); tab("ask"); }
      const s = summarize(S.D, S.fixed);
      const you = `<div class="bx-msg you"><span class="av">Y</span><div><b>You <small>${ASK_TIME()}</small></b><p>${S.skin === "web" ? "" : "@Bruin "}${esc(q)}</p></div></div>`;
      S.msgs = (S.msgs || "") + you + `<div class="bx-msg bot typing"><span class="av">🏛️</span><div><b>Bruin <span class="app">APP</span></b><p><span class="dots3"><i></i><i></i><i></i></span> querying marts…</p></div></div>`;
      drawAsk();
      const t0 = performance.now();
      const sys = `You are Bruin's AI data analyst, answering inside a team chat. Use ONLY the JSON data summary (it comes from the hackathon-agents Bruin project: marts mart.agent_performance, mart.endings, mart.interview_scores and staging tables). Be precise, cite numbers, 1-3 short sentences, friendly. If the data_quality field has a WARNING relevant to the question, mention it briefly.
Reply with JSON only: {"answer":"...","chart":"betrayals|endings|interviews|skills|skills_rubric|none","highlight":"exact label to highlight in that chart or empty","sql":"the SQL you ran against the Bruin assets (use the mart/stg table names)","asset":"main asset you queried, e.g. mart.endings"}`;
      coord.pulse("band", "question from #hackathon-data", "in");
      const a = await Brain.ask(sys, `DATA SUMMARY: ${JSON.stringify(s)}\nQUESTION: ${q}`, 0.2, () => offline(q, s));
      const secs = ((performance.now() - t0) / 1000).toFixed(1);
      const asset = ASSETS.some(x => x.id === a.asset) ? a.asset : (offline(q, s).asset);
      S.msgs = S.msgs.replace(/<div class="bx-msg bot typing">[\s\S]*$/, "") + `<div class="bx-msg bot"><span class="av">🏛️</span><div><b>Bruin <span class="app">APP</span> <small>${ASK_TIME()}</small></b>
        <p>${esc(Brain.clip(a.answer, 420))}</p>${chartCard(a.chart, a.highlight, s)}
        ${a.sql ? `<details class="bx-q"><summary>SQL Bruin ran</summary><pre>${hl(Brain.clip(a.sql, 400))}</pre></details>` : ""}
        <div class="bx-meta">⚡ ${secs}s · on <a href="#" data-lineage="${asset}">${asset}</a> · lineage ↗${a._src === "offline" ? " · offline rules" : ""}</div></div></div>`;
      S.asked++; S.busy = false; drawAsk(); status();
      coord.pulse("finch", "insight → tune skills", "out");
      coord.pulse("band", "answer posted to the channel", "out");
    }

    /* ---------------- ⑤ DASHBOARD ---------------- */
    function hbar(title, rows, hlKey) {
      const max = Math.max(...rows.map(r => r[1]), 1);
      return `<div class="lab-panel"><div class="lp-h">${esc(title)}</div><div class="hb">${rows.map(([l, v, sub]) => `<div class="hb-r ${hlKey === l ? "hl" : ""}" title="${esc(l)}: ${esc(sub || v)}"><span class="hb-l">${esc(l)}</span><span class="hb-t"><i style="width:${(v / max) * 100}%"></i></span><span class="hb-v">${esc(sub || v)}</span></div>`).join("")}</div></div>`;
    }
    function drawDash() {
      const s = summarize(S.D, S.fixed), sorted = o => Object.entries(o).sort((a, b) => b[1] - a[1]);
      const nChecks = ASSETS.reduce((t, a) => t + a.checks.length, 0), pass = Object.values(S.checks).filter(v => v === "pass").length;
      pane("dash").innerHTML = `
        <div class="kpis">${[["Events ingested", totalRows().toLocaleString()], ["Assets", ASSETS.length], ["Checks passing", S.ran ? `${pass}/${nChecks}` : "–"], ["Film runs", s.film_runs]].map(([l, v]) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`).join("")}</div>
        <div class="br-charts">
          ${hbar("FILM ENDINGS · mart.endings", sorted(s.endings))}
          ${hbar("BETRAYALS BY AGENT · mart.agent_performance", sorted(s.betrayals_by_agent).slice(0, 6))}
          ${hbar("AVG INTERVIEW SCORE · mart.interview_scores", sorted(s.interview_avg_by_candidate).map(([k, v]) => [k, v, v.toFixed(2)]))}
          ${hbar("FINCH SKILL USES · stg.decisions", sorted(s.skill_uses).slice(0, 6))}
        </div>
        <p class="muted bx-note">${S.fixed ? "Built from checked, fixed data." : "Includes the 3 unfixed 'betrayl' rows. Fix them in ③ Quality and betrayal numbers go up."} AdaL renders: ${s.adal_renders} · BAND messages: ${s.messages_total} · game rounds: ${s.game_rounds}.</p>`;
    }

    /* ---------------- WHY BRUIN ---------------- */
    function drawWhy() {
      const ideas = [
        ["🎬", "Track 01 · Film", "Log every agent decision as a Bruin asset, then prove to the judges that endings really change: “What ending is most common across 50 runs?” answered in Slack, with the chart."],
        ["🎮", "Track 02 · Games", "Stream rounds into Bruin and add quality checks that catch agents breaking the rules. Let agents query a mart between rounds to adapt their strategy."],
        ["🎓", "Track 03 · Grow", "Store every rubric score, track a candidate's progress across sessions, and have the Bruin bot post a coaching summary to Teams after each interview."],
        ["🧾", "The decision log", "Every project needs a visible decision log. Bruin gives you one with lineage and checks, so you can show exactly where each number came from."]
      ];
      pane("why").innerHTML = `
        <p class="bx-lead"><b>Bruin replaces a stack of tools</b> (ingestion, transformation, orchestration, quality, and an AI analyst) with one workspace, so your team spends the hackathon building agents, not plumbing.</p>
        <div class="bx-why">${ideas.map(([i, t, d]) => `<div class="bx-idea"><span>${i}</span><b>${t}</b><p>${d}</p></div>`).join("")}</div>
        <div class="bx-stack"><small>ONE WORKSPACE INSTEAD OF</small>${["Ingestion scripts", "dbt-style transforms", "A scheduler", "Data tests", "A BI tool", "An analytics bot"].map(x => `<span>${x}</span>`).join("")}<b>→ 🏛️ Bruin</b></div>
        <a class="btn btn-sm" href="https://getbruin.com" target="_blank" rel="noopener">Explore Bruin at getbruin.com ↗</a>`;
    }

    function drawAll() { drawIngest(); drawTransform(); drawQuality(); drawAsk(); drawDash(); drawWhy(); status(); }
    $("#bxAll", main).onclick = async () => {
      const b = $("#bxAll", main); b.disabled = true;
      try {
        S.fixed = false; S.msgs = ""; tab("ingest"); await ingest();
        await sleep(500); await runPipeline();
        await sleep(600); tab("quality"); drawQuality(); await sleep(2200);
        if (main.isConnected) { S.fixed = true; await runPipeline(); tab("quality"); await sleep(1400); }
        if (main.isConnected) { tab("ask"); await ask("Which agent betrays the most?"); }
      } finally { if (main.isConnected) b.disabled = false; }
    };
    drawAll();
    return { destroy() { S.token++; } };
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

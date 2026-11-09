# AI Multiplayer Hackathon (visual site) — `/aim-hack-visual`

A standalone plain HTML/CSS/JS site + agent playground, served by the **main** Vercel project at
**crewbasecollective.com/aim-hack-visual**. No shared code with the React app, no build step.
The old URL `/aimultiplayerhackathon-visual` redirects here.

## Files (kept separate from the React app)

```
client/public/aim-hack-visual/
  index.html  tracks.html  sponsors.html (+ Sponsor Labs)  play.html (playground)
  data.js          hackathon content: tracks, ideas, sponsors
  play-data.js     preset characters, preset scenes, which sponsor tools appear in which track
  puppet.js        parametric animated SVG characters (Puppet.svg / mount / toImage)
  scenes.js        16 illustrated backdrops × time of day × weather (Scenes.svg / mount / toImage)
  brain.js         Brain.ask (LLM JSON with offline fallback) + Brain.image
  play.js          playground shell: library (localStorage), pickers, sponsor tool bar, router
  core.css         shared styles for the above
  film.js/.css     Track 1 · agent film (10–20 scenes, 1–3 locations)          → play.html#film
  game.js/.css     Track 2 · game hub; games/zombie.js, snakes.js, rps.js       → play.html#game
  grow.js/.css     Track 3 · expert panel interviews/coaches you                → play.html#grow
  studio.js/.css   character & scene creator (manual + AI)                      → play.html#studio
  labs.js, labs2.js, labs.css  Sponsor Labs (BAND, AdaL, Bruin, Finch, Casuro) → sponsors.html#labs
  map.js, site.js  home/sponsor living map and shared page behaviour
client/api/aim-hack-chat.ts       ← Vercel function → OpenAI chat + images (key stays server-side)
```

Demo routes for quick checks: `play.html#film/demo`, `#grow/demo`, `#game/zombie?demo`, `#game/snakes?demo`, `#game/rps?demo`.

Vercel's Root Directory is `client/`, so only files inside `client/` deploy. **No rewrites / no vercel.json** are used:
`/aim-hack-visual/` is served by its `index.html`; the `spaFallbacks` plugin in `client/vite.config.ts` also writes
`dist/aim-hack-visual.html` and redirect pages for the old URL `/aimultiplayerhackathon-visual`.

All links inside the site are absolute (`/aim-hack-visual/...html`).

## Run locally

```bash
npm run dev     # → http://localhost:5173/aim-hack-visual
```

`client/vite.config.ts` (`aimHackVisualDev` plugin) serves the index page and runs the chat handler in dev.
Put `OPENAI_API_KEY` (optional `OPENAI_MODEL`, `AIMP_ALLOWED_ORIGINS`) in `client/.env.local` (git-ignored);
without a key the playground uses offline (simulated) agents.

## Env (Vercel, main project)

- `OPENAI_API_KEY` — required for LLM mode
- `OPENAI_MODEL` — optional, default `gpt-4.1-mini`
- `OPENAI_IMAGE_MODEL` — optional, default `gpt-image-1-mini` (used by AdaL poster/image/video features)
- `AIMP_IMAGES=off` — optional, disables image generation
- `AIMP_ALLOWED_ORIGINS` — optional, default `crewbasecollective.com,localhost,127.0.0.1`

The endpoint checks Origin/Referer and rate-limits per IP (90 chat calls/min, 8 images/min); set a spending limit on the OpenAI key.

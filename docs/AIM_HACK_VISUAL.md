# AI Multiplayer Hackathon (visual site) — `/aim-hack-visual`

A standalone plain HTML/CSS/JS site + agent playground, served by the **main** Vercel project at
**crewbasecollective.com/aim-hack-visual**. No shared code with the React app, no build step.
The old URL `/aimultiplayerhackathon-visual` redirects here.

## ⚠️ This is a separate project

The hackathon site only shares the **deployment** with the Crewbase Collective app (same repo, same Vercel project).
It shares **no code, data, styles or routes** with the React app, the CMS or the server.

- **Working on the main app?** Ignore everything listed below. Don't edit, refactor, restyle, lint-fix or "clean up" these files, and don't count them when you change the main app's URLs, routes, navigation, styles or data.
- **Working on the hackathon site?** Only touch the files below. Don't change main-app files for it; if you truly need a hook in the main app, keep it to one marked line and list it here.

### Everything that belongs to it (the complete list)

| Path | What it is |
|---|---|
| `client/public/aim-hack-visual/` | The site itself: static HTML/CSS/JS, served at `/aim-hack-visual` |
| `client/api/aim-hack-chat.ts` | Its AI endpoint (`/api/aim-hack-chat`): OpenAI / AdaL chat + images |
| `client/aim-hack-visual.vite.ts` | Vite plugin: dev serving + local API, build-time `aim-hack-visual.html` and old-URL redirect pages |
| `client/vite.config.ts` | **Two marked lines only**: the `import { aimHackVisual }` line and `aimHackVisual(__dirname)` in `plugins` |
| `client/.env.aim-hack.example` | Key template (`OPENAI_*`, `ADAL_*`, `AIMP_*`); real keys go in `client/.env.local` |
| `docs/AIM_HACK_VISUAL.md` | This file |
| Vercel env vars | `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_IMAGE_MODEL`, `ADAL_API_KEY`, `ADAL_AGENT_ID`, `ADAL_*`, `AIMP_*` |

Plus one pointer line each in `AGENTS.md` and `docs/CODE_MAP.md`.

### How to remove it completely

1. Delete `client/public/aim-hack-visual/`, `client/api/aim-hack-chat.ts`, `client/aim-hack-visual.vite.ts`, `client/.env.aim-hack.example` and `docs/AIM_HACK_VISUAL.md`.
2. In `client/vite.config.ts`, delete the two lines marked "Separate /aim-hack-visual hackathon site".
3. Remove the `/aim-hack-visual` lines from `AGENTS.md` and `docs/CODE_MAP.md`.
4. Optionally remove the `OPENAI_*`, `ADAL_*`, `AIMP_*` variables from Vercel and `client/.env.local`.
5. `cd client && npm run build` to check, then push.

## Files inside the site


```
client/public/aim-hack-visual/
  index.html  tracks.html  sponsors.html (+ Sponsor Labs, coord.js tool views)  submit.html (submission guide)  play.html (playground)
  data.js          hackathon content: event, tracks, ideas, sponsors (+ HIDDEN_SPONSORS: organisers hide a sponsor here)
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
  labs*.js, labs.css           Sponsor Labs (BAND, AdaL, Bruin, Finch, Casuro, Glasser) → sponsors.html#labs
  coord.js/.css                "How the tools work together" + per-tool views on sponsors.html
  map.js, site.js  home/sponsor living map and shared page behaviour
client/api/aim-hack-chat.ts       ← Vercel function → OpenAI chat + images (key stays server-side)
```

Demo routes for quick checks: `play.html#film/demo`, `#grow/demo`, `#game/zombie?demo`, `#game/snakes?demo`, `#game/rps?demo`.

Vercel's Root Directory is `client/`, so only files inside `client/` deploy. **No rewrites / no vercel.json** are used:
`/aim-hack-visual/` is served by its `index.html`; the plugin in `client/aim-hack-visual.vite.ts` also writes
`dist/aim-hack-visual.html` and redirect pages for the old URL `/aimultiplayerhackathon-visual`.

All links inside the site are absolute (`/aim-hack-visual/...html`).

## Run locally

```bash
npm run dev     # → http://localhost:5173/aim-hack-visual
```

`client/aim-hack-visual.vite.ts` serves the index page and runs the chat handler in dev.
Put `OPENAI_API_KEY` (optional `OPENAI_MODEL`, `AIMP_ALLOWED_ORIGINS`) in `client/.env.local` (git-ignored);
without a key the playground uses offline (simulated) agents.

## Keys and providers

Where the keys go:
- **Local:** `client/.env.local` (git-ignored). Copy the template `client/.env.aim-hack.example`. The Vite dev plugin loads every `OPENAI_*`, `ADAL_*` and `AIMP_*` value from it.
- **Live site:** Vercel → crewbasecollective-client → Settings → Environment Variables (same names), then redeploy.

OpenAI: `OPENAI_API_KEY`, optional `OPENAI_MODEL` (default `gpt-4.1-mini`), `OPENAI_IMAGE_MODEL` (default `gpt-image-1-mini`).

AdaL Cloud Agents (cloud.adal.sylph.ai, API spec at `/openapi.json`): `ADAL_API_KEY` (token from the cloud app's API tab, a JWT) and `ADAL_AGENT_ID` (the agent you created there), optional `ADAL_API_URL`, `ADAL_MODEL`, `ADAL_TIMEOUT_MS` (default 25000). Flow: create session → provision → `chat/stream`; the reply must be JSON.

**Choosing the provider is done in the page, not in env:** the banner on play.html and sponsors.html has *Agents: OpenAI | AdaL* and *Images: OpenAI | AdaL*. The choice is saved per visitor (localStorage `aimp_provider`) and sent with each request as `provider`. A provider is greyed out until its keys are set. If AdaL fails or times out and `OPENAI_API_KEY` is set, the request falls back to OpenAI.

Other: `AIMP_IMAGES=off` disables image generation; `AIMP_ALLOWED_ORIGINS` (default `crewbasecollective.com,localhost,127.0.0.1`).

The endpoint checks Origin/Referer and rate-limits per IP (90 chat calls/min, 8 images/min); set a spending limit on the OpenAI key.

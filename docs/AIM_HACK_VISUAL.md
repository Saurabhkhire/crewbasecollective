# AI Multiplayer Hackathon (visual site) — `/aim-hack-visual`

A standalone plain HTML/CSS/JS site + agent playground, served by the **main** Vercel project at
**crewbasecollective.com/aim-hack-visual**. No shared code with the React app, no build step.
The old URL `/aimultiplayerhackathon-visual/*` redirects here.

## Files

```
client/public/aim-hack-visual/    ← the website (Vite copies public/ into dist as-is)
  index.html  tracks.html  sponsors.html  play.html
  data.js        content: tracks, ideas, sponsors (edit this)
  play-data.js   playground content: characters, story modes, game worlds
  brain.js       agent decisions (LLM via /aim-hack-visual/api/chat, or offline simulation)
  film.js / game.js / play.js / puppet.js / map.js / site.js / tracks.js
client/api/aim-hack-chat.js       ← Vercel function → OpenAI (key stays server-side)
api/aim-hack-chat.mjs             ← re-export, only used if Vercel Root Directory is the repo root
client/vercel.json                ← rewrites /aim-hack-visual/api/chat → /api/aim-hack-chat (+ old-URL redirect)
```

Production builds from **Root Directory `client/`** (that's why `client/vercel.json` and `client/api/` are live).
The root `vercel.json` mirrors the same rules in case the Root Directory is ever switched to `.`.

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
- `AIMP_ALLOWED_ORIGINS` — optional, default `crewbasecollective.com,localhost,127.0.0.1`

The endpoint checks Origin/Referer and rate-limits per IP; set a spending limit on the OpenAI key.

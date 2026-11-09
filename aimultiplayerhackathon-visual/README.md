# AI Multiplayer Hackathon (visual site)

A standalone static site + agent playground, published at
**crewbasecollective.com/aimultiplayerhackathon-visual**.

It is a separate static site (no shared code, data or styles with the main site), but it is
**deployed by the main Crewbase Collective Vercel project**:
- `npm run build` (root) copies `public/aimultiplayerhackathon-visual/` → `dist/aimultiplayerhackathon-visual/` (`scripts/prepare-vercel-output.ts`).
- The AI endpoint runs as the root function `api/aimultiplayer-chat.mjs`, which re-exports `api/chat.js` here.
- Root `vercel.json` rewrites `/aimultiplayerhackathon-visual/api/chat` → that function, above the SPA catch-all.
- `OPENAI_API_KEY` / `OPENAI_MODEL` are set in the **main** project's Environment Variables.

## Layout

```
aimultiplayerhackathon-visual/
├─ public/aimultiplayerhackathon-visual/   ← the website (plain HTML/CSS/JS, no build step)
│   index.html  tracks.html  sponsors.html  play.html
│   data.js        content: tracks, ideas, sponsors (edit this)
│   play-data.js   playground content: characters, story modes, game worlds
│   brain.js       agent decisions (LLM via api/chat, or offline simulation)
│   film.js / game.js / play.js / puppet.js   playground screens
├─ api/chat.js        Vercel function → OpenAI (key stays server-side)
├─ dev-server.js      local preview (same routing as Vercel)
├─ vercel.json        config for THIS project only
└─ .env.example
```

All links inside the site are absolute (`/aimultiplayerhackathon-visual/...`), so pages work with or without a trailing slash.

## Run locally

```bash
cp aimultiplayerhackathon-visual/.env.example aimultiplayerhackathon-visual/.env   # optional: OPENAI_API_KEY
npm run dev            # from repo root: also starts this site on :3000
```

Open http://localhost:5173/aimultiplayerhackathon-visual (Vite proxies it to :3000) or
http://localhost:3000/aimultiplayerhackathon-visual directly. `npm run dev:aimp` runs just this site.
Without a key the playground uses offline (simulated) agents.

## Deploy

Nothing extra: commit and `git push` to `main`; the main Vercel project builds and serves it.
(`vercel.json` in this folder is only used if you ever deploy this folder as its own project.)

## Notes

- The AI endpoint checks the request's Origin/Referer against `AIMP_ALLOWED_ORIGINS` and rate-limits per IP. This blocks casual misuse but not determined abuse, so set a spending limit on the OpenAI key.
- Sponsor names and descriptions are in `data.js`.

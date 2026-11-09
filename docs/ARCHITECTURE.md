# Architecture

**Updated:** 2026-10-25 — static JSON content + local CMS; Supabase only for newsletter subscribers.

---

## High-level

```
LOCAL (organiser's laptop)                           PRODUCTION (Vercel)
───────────────────────────                          ───────────────────
cms/ Vite app :5174                                  dist/  (static site = built client/)
  └─ routes to client/src/pages/admin/*                └─ fetches /data/*.json, /images/*
  └─ proxies /api, /images → :4001
                                                     api/index.ts (serverless function)
server/src/cms-server.ts :4001                         └─ server/src/app.ts
  ├─ /api/admin/*  → cms-routes.ts (CRUD on data/)          ├─ GET  /api/health
  ├─ /api/places/search → OpenStreetMap Nominatim           ├─ POST /api/subscribe → Supabase
  ├─ /api/subscribe, /api/requests (same as prod)           └─ POST /api/requests  → SMTP email
  └─ /images → data/images/

data/  ──buildDerivedData()──►  client/public/data/ + client/public/images/
                                        │
                                git push (publish:content)
                                        ▼
                               Vercel: npm run build
```

Also for local preview of the public site:
`client/` Vite :5173 proxies `/api` → `server/src/api-server.ts` :4000 (same `createApp()` as production).

---

## Three servers, one codebase

| Entry file | Port | Where it runs | What it mounts |
|------------|------|---------------|----------------|
| `api/index.ts` | — | Vercel serverless | `createApp()` from `server/src/app.ts` |
| `server/src/api-server.ts` | 4000 | Local (`npm run dev`) | `createApp()` + serves `client/dist` and images when not on Vercel |
| `server/src/cms-server.ts` | 4001 | Local only (`npm run dev:cms`) | forms router + `cmsRouter` at `/api/admin` + place search + `/images` |

`server/src/index.ts` is a deprecated alias that imports `api-server.ts`.

---

## Data flow

### Write path (CMS)
```
Admin screen (client/src/pages/admin/*.tsx)
  → api("/api/admin/...")                      client/src/lib/api.ts
  → cmsRouter handler                          server/src/cms-routes.ts (Zod validation)
  → repository function                        server/src/data/repository.ts
      readJson / normalize* / writeJson        data/*.json
  → rebuild() = buildDerivedData()             writes client/public/data/*, copies images
```

### Read path (public site)
```
Page component → loadData("/data/....json")    client/src/lib/api.ts (no-cache fetch)
  → static file from client/public/data (dev) or dist/data (prod)
```

### `buildDerivedData()` outputs (`server/src/data/repository.ts`)

| Output | Built by | Contents |
|--------|----------|----------|
| `events-index.json` | inline | `event` basics of every `isPublished` event |
| `events/{slug}.json` | `buildPublicEventDetail()` | Denormalized event: names, logos, people resolved; admin-only data stripped |
| `sponsors.json` | `buildSponsorsPublic()` | `sponsors`, `partners`, `venuePartners`, `communityPartners` |
| `people.json` | `buildPeoplePublic()` | Public person fields + `judged/spoke/sponsored/partnered/hosted/volunteered` event lists |
| `community-links.json` | `getSiteSettings().communityLinks` | WhatsApp / Discord / X / Luma links |
| `client/public/images/` | `copyImagesToPublic()` | Mirror of `data/images/` |

It deletes and rewrites `client/public/data/events/` each time, so renamed slugs don't leave stale files.

---

## Normalization (backward compatibility)

Old JSON files may miss newer fields. Everything read from disk goes through:
- `normalizePersonRecord()` — migrates legacy `tags` → `roles`, fills nulls.
- `normalizeEventRecord()` — adds `status` to sponsors/partners/judges/etc., migrates `externals` → `associated`, ensures `staffRoles`.
- `normalizeEventBasics()` (types.ts) — migrates single `lumaLink`/`eventbriteLink` → `lumaLinks[]`/`eventbriteLinks[]`.

When adding a field, give it a default here so old files keep working.

---

## Roles model

- **Fixed main roles** (`FIXED_PERSON_ROLES`): judge, speaker, sponsor representative, partner representative, host, volunteer, associated.
- **Sub-roles** (configurable in Settings → `data/settings.json` `subRoles`): e.g. MC, photographer. Each has `visible` — only visible ones appear publicly. Sub-roles apply to host / volunteer / associated.
- **Status** per assignment: `confirmed` | `maybe` | `no_response`. Public output generally shows confirmed people only (`isConfirmed()` in normalize.ts).
- Sponsor representatives on competition events are auto-synced as judges (`syncSponsorRepJudges()`).

---

## Emails

| Kind | Trigger | Code |
|------|---------|------|
| Request-form notification | `POST /api/requests` | `routes/forms.ts` → `email.ts sendNotificationEmail` |
| Sponsorship request (with pitch deck PDF) | CMS People → Send email | `cms-routes.ts /emails/send` + `pdfs.ts getPitchDeckAttachment` |
| Judge / speaker invites | same | templates in `settings.json.emailTemplates` |
| Judge / speaker certificates (generated PDF) | same | `pdfs.ts buildCertificatePdfFromText` (pdfkit) |

SMTP config: `data/settings.json.smtp` (CMS) with `server/.env` filling empty fields; production uses env only. Providers: `gmail` or `brevo` (`SMTP_PROVIDER_PRESETS`).

---

## Images

- Stored under `data/images/`, referenced in JSON as web paths `/images/...`.
- Folders: `companies/` (logos), `covers/` (event covers), `events/{event-name}/` (gallery; folder from event **name**, not slug).
- Upload naming modes (`?naming=`): `random` (default), `named` (from `name`), `sequential` (1, 2, 3…). Logic in `server/src/local-upload.ts` + `image-names.ts`.
- `scripts/rename-named-images.ts` — one-off: rename logos/covers to readable names and fix references.

---

## Build & deploy

`vercel.json`: `buildCommand: npm run build`, `outputDirectory: dist`, SPA rewrite for every non-`/api/` path, function `api/index.ts` bundles `server/**`, `data/**`, `client/public/data/**`.

`npm run build` = `build:data` → `vite build` (client) → `scripts/prepare-vercel-output.ts` (copy `client/dist` → `dist`).
The Vite plugin `spaFallbacks()` (client/vite.config.ts) also writes `index.html` copies for every route and event slug so deep links work.

Vercel Root Directory must be `.` (repo root).

Env vars on Vercel: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_PROVIDER`, `GMAIL_SMTP_USER/PASS` or `BREVO_SMTP_USER/KEY`, `SMTP_FROM`, `NOTIFY_EMAIL`.

---

## Tech stack

| Layer | Tech |
|-------|------|
| UI | React 18, React Router 7, Tailwind CSS, lucide-react icons, Vite |
| Server | Express 4, Zod, multer (uploads), nodemailer, pdfkit |
| Data | JSON files on disk; Supabase JS client for subscribers |
| Tooling | TypeScript, tsx, npm workspaces (`client`, `server`, `cms`) |
| Legacy | Drizzle ORM + postgres.js (only in export/seed scripts) |

Theme: dark, cyan accents; CSS variables in `client/src/index.css`.

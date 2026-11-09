# Workflows

**Updated:** 2026-10-25 — static JSON content + local CMS; Supabase only for newsletter subscribers.

---

## WF-01 — First-time setup

1. `npm install`
2. Copy `server/.env.example` → `server/.env` (all optional locally: Supabase for subscribe, SMTP for emails)
3. `npm run dev:all` → site http://localhost:5173, admin http://localhost:5174/admin

---

## WF-02 — Edit content in the CMS

1. `npm run dev:cms` (or `dev:all`)
2. Open http://localhost:5174/admin
3. **Events** → create an event (name, type, date) → open it → fill tabs (basics, tracks, sponsors, partners, prizes, schedule, speakers, judges, hosts, volunteers, associated, people, links, photos)
4. **Sponsors & Partners** → companies + logos. **People** → directory + role assignments
5. Every save writes `data/` and rebuilds `client/public/data` + `client/public/images` immediately
6. Check the public view at http://localhost:5173 (run `npm run dev` or `dev:all`)

Tips: set assignment status to **confirmed** or it won't show publicly. Toggle `isPublished` on basics to show/hide the event.

---

## WF-03 — Publish to production

```bash
npm run publish:content -- "Add Bay Builders hackathon"
```

Runs `build:data`, stages `data/ client/public/data client/public/images`, commits, and pushes `main`. Vercel redeploys automatically.
(Code changes are committed normally; this script only stages content.)

---

## WF-04 — Add photos to an event gallery

1. Event → **photos** tab → paste/upload images (sequential naming → `images/events/{event-name}/1.jpg, 2.jpg…`)
2. Or drop files into `data/images/events/{event-name}/` by hand, then use **Sync gallery** (`entity: "sync_gallery"`) to renumber and import them into `photos`

---

## WF-05 — Send invites, certificates, sponsorship emails (CMS)

1. Settings → configure SMTP (Gmail app password or Brevo SMTP key) — or set it in `server/.env`
2. Settings → edit email templates (placeholders like `{{person_name}}`, `{{event_name}}`); upload pitch-deck PDF for sponsorship emails
3. People (or an event's People tab) → **Send email** → choose kind + event → preview → send
4. Certificates attach a PDF generated from the template's certificate text; judge/speaker kinds need a hackathon or pitch competition

---

## WF-06 — Newsletter subscribe (production)

1. Run [`supabase/schema.sql`](../supabase/schema.sql) in the Supabase SQL editor
2. Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` on Vercel
3. Footer form → `POST /api/subscribe` → `subscribers` table

---

## WF-07 — Request forms (Get Involved page)

1. Visitor picks a form (sponsorship, judging/speaking, partnership, member/host, volunteer, contact us) and events (from `/data/events-index.json`)
2. `POST /api/requests` → Zod validation → HTML email to `NOTIFY_EMAIL`
3. Nothing is stored. Without SMTP env, the payload is only logged

---

## WF-08 — Deploy (Vercel)

1. Push to `main` (Root Directory `.`)
2. Vercel runs `npm run build` = `build:data` → client Vite build → copy to `dist/`
3. `api/index.ts` serves only health/subscribe/requests
4. Env: Supabase + SMTP vars (see `server/.env.example`)

---

## WF-09 — Public visitor views an event

1. `/events` reads `/data/events-index.json`, splits upcoming / past by local date+time
2. `/events/:slug` reads `/data/events/{slug}.json`
3. Empty sections are omitted

---

## WF-10 — Add a new content field (developer)

1. `server/src/data/types.ts` — add to the interface (+ default in `emptyEvent` / `DEFAULT_*`)
2. `server/src/data/normalize.ts` — default for old files
3. `server/src/cms-routes.ts` — accept it in the Zod schema / `entity` case
4. `client/src/pages/admin/*` — form input
5. `server/src/data/repository.ts` — include in `buildPublicEventDetail` / `buildPeoplePublic` **only if public**
6. Public page in `client/src/pages/` — render it
7. `npm run build:data`, type-check, update `docs/CONTENT_SCHEMA.md`

---

## WF-11 — One-time export from old Postgres (historical)

1. `DATABASE_URL` in `server/.env` (encode `@` as `%40`)
2. `npm run export:data` → writes `data/` + images
3. `npm run cleanup:supabase` → drops content tables, keeps `subscribers`

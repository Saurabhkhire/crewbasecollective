# Workflows

**Updated:** 2026-07-27 — static JSON content + local CMS; Supabase only for newsletter subscribers.

---

## Architecture

| Layer | Role |
|-------|------|
| `data/` | Source of truth (companies, people, events JSON + images) |
| `client/public/data` | Derived JSON for the public site (auto-built) |
| `cms/` | Local-only admin UI (`localhost:5174`) |
| `server` CMS mode | Writes `data/`, rebuilds derived JSON, local image uploads |
| Vercel | Serves static site + slim API (`/api/subscribe`, `/api/requests`) |
| Supabase | `subscribers` table only |

---

## WF-01 — Local CMS (edit content)

1. Copy `server/.env.example` → `server/.env` (SMTP optional for request-form emails)
2. `npm install`
3. `npm run dev:cms`
4. Open http://localhost:5174/admin
5. Edit Events / Companies / People (same UI as before)
6. Changes write to `data/` and refresh `client/public/data` + `client/public/images`
7. Commit `data/` and `client/public/data` (+ images) and push → Vercel rebuilds the site

---

## WF-02 — Public site locally

1. `npm run build:data` (if needed)
2. `npm run dev` — public site on :5173, API on :4000 (subscribe/requests only)
3. Or `npm run dev:all` — public site + local CMS together (:5173 + :5174)
4. Event list/detail/sponsors/people load from `/data/*.json`

---

## WF-03 — One-time export from old Postgres

If you still have content in Supabase Postgres:

1. Set `DATABASE_URL` in `server/.env` (encode `@` in password as `%40`)
2. `npm run export:data` — writes `data/` + `client/public/data` + images
3. Review exported files locally (`npm run dev`)
4. `npm run cleanup:supabase` — drops content tables; keeps `subscribers` only
5. Remove `DATABASE_URL` from `server/.env` when done

---

## WF-04 — Newsletter subscribe

1. Run SQL in [`supabase/schema.sql`](../supabase/schema.sql) on your Supabase project
2. Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` on Vercel
3. Footer form → `POST /api/subscribe` → `subscribers` table

---

## WF-05 — Request forms (sponsorship, etc.)

1. User fills form on home page (events from `/data/events-index.json`)
2. `POST /api/requests` builds an email with all submitted details
3. SMTP sends it to `NOTIFY_EMAIL` (nothing stored in Supabase)

---

## WF-06 — Deploy (Vercel)

1. Push git (includes `data/` + `client/public/data` + images)
2. Build runs `npm run build` → `build:data` + client build
3. API function only handles subscribe + requests (no content CRUD)

---

## WF-07 — Public views event

1. `/events` reads `/data/events-index.json`
2. `/events/:slug` reads `/data/events/{slug}.json`
3. Empty sections omitted on the page
4. Dates use local calendar parsing

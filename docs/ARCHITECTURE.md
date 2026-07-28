# Architecture

**Updated:** 2026-07-26

## High-level

```
┌─────────────────────┐         ┌──────────────────────┐
│  client/ (React)    │  /api/* │  server/ (Express)   │
│  Vite + React Router│ ──────► │  Drizzle + Postgres  │
│  Tailwind (dark)    │         │  Auth + Email + Upload│
└─────────────────────┘         └──────────┬───────────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │ Supabase Postgres│
                                  │ (+ optional Storage)│
                                  └─────────────────┘
```

**Local:** Vite `:5173` proxies `/api` → Express `:4000`  
**Production (Vercel):** static `client/dist` + serverless `api/index.ts` → same Express app

---

## Repo layout

```
crewbasecollective/
├── client/                 # React SPA
│   ├── src/
│   │   ├── App.tsx         # Routes
│   │   ├── main.tsx
│   │   ├── index.css       # Dark theme + shared UI classes
│   │   ├── components/     # Navbar, EventCard, RequestForms, PeopleList…
│   │   ├── pages/          # Public pages
│   │   ├── pages/admin/    # Admin UI
│   │   └── lib/            # api.ts, upload.ts, utils.ts
│   └── vite.config.ts
├── server/                 # API + DB
│   ├── src/
│   │   ├── app.ts          # createApp() — middleware + routers
│   │   ├── index.ts        # Local listen + static client
│   │   ├── auth.ts         # Session cookie + bcrypt
│   │   ├── email.ts        # Nodemailer notifications
│   │   ├── upload.ts       # Image upload (Supabase or data URL)
│   │   ├── db/
│   │   │   ├── schema.ts   # All tables (Drizzle)
│   │   │   └── index.ts    # postgres.js client
│   │   ├── routes/
│   │   │   ├── public.ts   # /api/events, people, sponsors, requests
│   │   │   └── admin.ts    # /api/admin/*
│   │   └── scripts/seed.ts
│   └── drizzle.config.ts
├── api/index.ts            # Vercel entry → createApp()
├── docs/                   # Schema, workflows, architecture, tests
├── vercel.json
└── package.json            # Workspaces: client + server
```

---

## Request flow

### Public read

`Browser → GET /api/events → publicRouter → Drizzle → Supabase → JSON → React`

### Admin write

`Browser → cookie session → requireAdmin → POST /api/admin/events/:id/detail → insert child row`

### Form request

`Home modal → POST /api/requests → validate (Zod) → insert requests → send email`

---

## Auth model

- Only **admins** log in (username/password).
- People on the site are **directory records**, not accounts.
- Session: HMAC-signed payload in httpOnly cookie.
- All `/api/admin/*` (except login/session check) use `requireAdmin`.

---

## Data model (simplified)

```
companies (sponsors)
    ↑ optional
users (people) ←── event_judges / event_speakers / event_hosts / event_sponsors.person
    ↑
events ──┬── tracks, prizes (competition only)
         ├── event_sponsors, event_partners
         ├── schedule_items → schedule_speakers
         └── links, photos

requests → request_events → events
```

---

## UI rules

| Page | Behavior |
|------|----------|
| Home | Hero, featured events, 5 request forms |
| Events | All published events |
| Event detail | Full related data; hide empty sections |
| Sponsors | All companies |
| People | Grouped by involvement role + counts + history |
| Admin Events | Save = live; then Configure tabs for children |

---

## Deploy

| Piece | Where |
|-------|--------|
| Frontend + API | Vercel |
| Database | Supabase Postgres |
| Domain DNS | Hostinger → Vercel |

Env (Vercel + `server/.env`): `DATABASE_URL`, `SESSION_SECRET`, optional SMTP + `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` for file storage.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | API + Vite together |
| `npm run build` | Client for Vercel |
| `npm run db:push` | Sync schema to Supabase |
| `npm run db:seed` | Admin + sample companies/people/events |

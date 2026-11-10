# Agent guide — Crewbase Collective

**Read this first.** Works for Claude Code, Cursor, Copilot, Codex, or a human joining the project.
`CLAUDE.md` and `.cursor/rules/project-context.mdc` both point here, so this is the single source of truth for "how this repo works".

**Last full review:** 2026-10-25

---

## 1. What this project is (one paragraph)

Crewbase Collective is a community that runs hackathons, pitch competitions, workshops and mixers.
This repo is its **website** (public, on Vercel) plus a **local-only admin CMS** used to edit events, people and sponsor companies.
Content is **plain JSON files in `data/`** committed to git — there is **no content database**.
Supabase only stores newsletter email addresses. Request forms just send an email.

New to the code? Read **[docs/SIMPLE_GUIDE.md](docs/SIMPLE_GUIDE.md)** (plain-language explanation) first.

---

## 2. Doc map

| Doc | Read when you need… |
|-----|---------------------|
| [docs/SIMPLE_GUIDE.md](docs/SIMPLE_GUIDE.md) | The whole system explained simply, with analogies |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the pieces connect, local vs production, build pipeline |
| [docs/CODE_MAP.md](docs/CODE_MAP.md) | What **every file** does, and which files are legacy/dead |
| [docs/API.md](docs/API.md) | Every HTTP endpoint (production API + CMS API) with request shapes |
| [docs/CONTENT_SCHEMA.md](docs/CONTENT_SCHEMA.md) | JSON file formats, field names, enums, image paths |
| [docs/WORKFLOWS.md](docs/WORKFLOWS.md) | Step-by-step: edit content, publish, deploy, send emails |
| [docs/TEST_CASES.md](docs/TEST_CASES.md) | Manual test checklist (partly legacy) |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | **Legacy** Postgres tables — only for re-importing to a DB |
| [data/README.md](data/README.md) | Short `data/` folder layout |
| [server/src/data/types.ts](server/src/data/types.ts) | Canonical TypeScript types for all content |

---

## 3. The 30-second architecture

```
          EDIT (your laptop only)                         SHOW (internet)
┌──────────────────────────────┐                ┌──────────────────────────────┐
│ cms/ (React, :5174)          │                │ client/ (React, Vite)        │
│  reuses client/src/pages/    │                │  reads /data/*.json          │
│  admin/* screens             │                │  served by Vercel as static  │
│        │ /api/admin/*        │                │        │ /api/subscribe      │
│        ▼                     │                │        │ /api/requests       │
│ server/src/cms-server.ts     │   git push     │        ▼                     │
│  (:4001) writes data/*.json  │ ─────────────► │ api/index.ts → server/src/   │
│  then buildDerivedData()     │                │  app.ts (forms only)         │
│  → client/public/data + imgs │                │   ├─ Supabase: subscribers   │
└──────────────────────────────┘                │   └─ SMTP: request emails    │
                                                └──────────────────────────────┘
```

- `data/` = **source of truth** (edit via CMS).
- `client/public/data/` + `client/public/images/` = **generated** by `buildDerivedData()` in `server/src/data/repository.ts`. Never hand-edit.
- Production API (`server/src/app.ts`) has only: `GET /api/health`, `POST /api/subscribe`, `POST /api/requests`.

---

## 4. Commands

```bash
npm install
npm run dev            # public site :5173 + forms API :4000
npm run dev:cms        # admin UI :5174/admin + CMS API :4001
npm run dev:all        # all four together
npm run build:data     # regenerate client/public/data + images from data/
npm run publish:content -- "message"   # build:data + git commit content + push main
npm run build          # what Vercel runs: build:data → vite build → copy to dist/
```

Config: copy `server/.env.example` → `server/.env` (Supabase + SMTP; all optional locally).

---

## 5. Rules — do / don't

**Do**
- Change content through the CMS or by editing `data/` files, then run `npm run build:data`.
- Treat `server/src/data/types.ts` as the schema. If you add a field, update: `types.ts` → `normalize.ts` (defaults for old files) → `repository.ts` (`buildPublicEventDetail` / `buildPeoplePublic` if it should be public) → `cms-routes.ts` (accept it) → admin page → public page → `docs/CONTENT_SCHEMA.md`.
- Keep admin-only fields private: `Person.email/phone/notes/roles`, event `associated`, `staffRoles` (non-visible ones) must **never** reach `client/public/data/`.
- Run `npx tsc --noEmit -p client` and `npx tsc --noEmit -p server` after code changes.

**Don't**
- Hand-edit `client/public/data/` or `client/public/images/` (overwritten on every build).
- Deploy the CMS, or add content CRUD to the production API (`app.ts`). The CMS has **no login** — it is safe only because it runs on localhost.
- Revive legacy Postgres code (`server/src/db/`, `auth.ts`, `upload.ts`, `routes/admin.ts`, `routes/public.ts`) unless asked.

---

## 5b. Separate project in this repo: `/aim-hack-visual` (ignore it for main-app work)

The "AI Multiplayer Hackathon" site at crewbasecollective.com/aim-hack-visual is a **separate, standalone project** that only shares this repo and the Vercel deployment. It is not part of the Crewbase Collective app.
- **When working on the main app** (client/src, cms, server, data, routes, URLs, nav, styles): do **not** read, edit, refactor or account for these paths: `client/public/aim-hack-visual/`, `client/api/aim-hack-chat.ts`, `client/aim-hack-visual.vite.ts`, `client/.env.aim-hack.example`, `docs/AIM_HACK_VISUAL.md`, and the two marked lines in `client/vite.config.ts`.
- **When working on the hackathon site**: stay inside those paths. Full file list, keys and a removal checklist: [docs/AIM_HACK_VISUAL.md](docs/AIM_HACK_VISUAL.md).

---

## 6. Gotchas an agent will trip on

1. **Admin UI code lives in `client/`, not `cms/`.** `cms/src/App.tsx` only routes to `client/src/pages/admin/*` via the `@` alias (`cms/vite.config.ts`). Edit admin screens in `client/src/pages/admin/`.
2. **Vercel's Root Directory is `client/`** (verified 2026-11-08: `/api/index` 404s, `client/api/health.ts` answers, root `vercel.json` rewrites are ignored). So production uses `client/api/*` and `client/public/*` (no `client/vercel.json`; adding one made the deploy fail with STATIC_BUILD_NO_OUT_DIR); the root `vercel.json`, `api/` and `npm run build` only matter if the Root Directory is switched to `.`. Locally `server/src/routes/forms.ts` serves the forms API. Two copies of the forms API exist, so if you change form fields, update both.
3. **Request form types** must match in three places: `client/src/components/RequestForms.tsx`, `server/src/routes/forms.ts`, `client/api/requests.ts`. Types: `sponsorship`, `judging_speaking`, `partnership`, `member_host`, `volunteer`, `contact_us`.
4. **Event slugs have a random suffix** (`slugify()` appends a base-36 timestamp, e.g. `universal-hackathon-mvebl5cy`). Image folders use the **name without suffix** (`events/universal-hackathon/`). Renaming an event can change its slug → public JSON filename changes.
5. **`data/settings.json` is committed** and holds SMTP settings. Never put real SMTP passwords there if the repo is shared — use `server/.env` instead (env fills empty fields).
6. **Event saves are immediate.** Every CMS action writes the file and rebuilds public JSON. There is no draft/undo — git is the undo button.
7. **Competition-only features**: tracks, prizes, judges, judge/speaker invite & certificate emails only apply when `isCompetitionEvent(type)` (`hackathon` or `pitch_competition`).
8. **Deleting a person or company doesn't cascade.** `deletePerson` / `deleteCompany` only edit `people.json` / `companies.json`; events keep the dangling IDs, and the public build may show them as **"Unknown"** (e.g. judges). Remove the person from events first, or clean up event rows afterwards.
9. **Public output shows only `confirmed` assignments** (`isConfirmed()`); `maybe` / `no_response` stay CMS-only.
10. **RocketRide rules** in `.claude/rules/rocketride.md` / `.cursor/rules/rocketride.mdc` are generic tooling docs; RocketRide is **not used** by this codebase today.

---

## 7. Keeping docs current

When you change behaviour, update the matching doc in the same change:
new file → `docs/CODE_MAP.md`; new endpoint → `docs/API.md`; new field → `docs/CONTENT_SCHEMA.md`; new flow → `docs/WORKFLOWS.md`. Bump the "Last full review" date above after a full sweep.

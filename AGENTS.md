# Agent guide — Crewbase Collective

Read this first when editing content, data, or architecture.

## Data structure (human + agent readable)

| Doc | Purpose |
|-----|---------|
| **[docs/CONTENT_SCHEMA.md](docs/CONTENT_SCHEMA.md)** | **Main reference** — folders, JSON shapes, field names, Supabase table mapping |
| [data/README.md](data/README.md) | Short folder layout for `data/` |
| [server/src/data/types.ts](server/src/data/types.ts) | TypeScript types (canonical schema in code) |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Legacy Postgres tables (for re-import to a DB) |

## Where static content lives

```
data/                          ← source of truth (edit via CMS)
  companies.json
  people.json
  events/{uuid}.json
  images/companies/...
  images/events/{slug}/...

client/public/data/            ← auto-built for the website
client/public/images/          ← copied from data/images/
```

Rebuild public files: `npm run build:data` (CMS does this on save).

## Architecture

| Piece | Location |
|-------|----------|
| Public site | `client/` — loads `/data/*.json` |
| Local CMS | `cms/` — not deployed; writes `data/` |
| Production API | `api/` + `server/src/app.ts` — subscribe + request forms only |
| Supabase | `subscribers` table only — `supabase/schema.sql` |

## Local dev

```bash
npm run dev        # public site :5173 + API :4000
npm run dev:cms    # admin :5174 + CMS API :4001
npm run dev:all    # both together
```

## Request forms (home page)

Types in `client/src/components/RequestForms.tsx` + `server/src/routes/forms.ts`:

`sponsorship` · `judging_speaking` · `partnership` · `member_host` · `volunteer` · `contact_us`

Submissions email `NOTIFY_EMAIL` via SMTP — not stored in a database.

Request types: `sponsorship`, `judging_speaking`, `partnership`, `member_host`, `volunteer`, `contact_us`

## Do not

- Edit `client/public/data/` by hand (regenerate from `data/`)
- Deploy the CMS to Vercel
- Add content CRUD to the production API

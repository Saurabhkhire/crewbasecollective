# Crewbase Collective

Website for Crewbase Collective — hackathons, pitch competitions, workshops and community events — plus a local admin CMS to manage them.

| Piece | Service |
|-------|---------|
| Website + forms API | [Vercel](https://vercel.com) (static React site + one serverless function) |
| Content (events, people, companies) | JSON files in `data/`, committed to git |
| Newsletter emails | [Supabase](https://supabase.com) `subscribers` table |
| Request-form & CMS emails | SMTP (Gmail or Brevo) |
| Domain | Hostinger DNS → Vercel |

## Quick start

```bash
npm install
cp server/.env.example server/.env   # optional: Supabase + SMTP
npm run dev:all
```

- Public site: http://localhost:5173
- Admin CMS: http://localhost:5174/admin (local only, no login)

Edit content in the CMS, then publish:

```bash
npm run publish:content -- "Add Bay Builders hackathon"
```

## Docs

| Doc | Contents |
|-----|----------|
| [AGENTS.md](AGENTS.md) | **Start here** — guide for humans & AI agents (Claude, Cursor, …) |
| [Simple guide](docs/SIMPLE_GUIDE.md) | Whole system explained in plain language |
| [Architecture](docs/ARCHITECTURE.md) | How the pieces connect, build & deploy |
| [Code map](docs/CODE_MAP.md) | What every file does |
| [API](docs/API.md) | All HTTP endpoints |
| [Content schema](docs/CONTENT_SCHEMA.md) | JSON data structure + file layout |
| [Workflows](docs/WORKFLOWS.md) | Step-by-step tasks |
| [Test cases](docs/TEST_CASES.md) | Manual checklist |
| [Database schema](docs/DATABASE_SCHEMA.md) | Legacy Postgres tables |

## Structure

```
client/     Public React site + admin screens (pages/admin) + Vercel fallback functions (api/)
cms/        Local admin app shell (reuses client admin pages)
server/     Express: forms API (prod) + CMS API (local) + data repository
api/        Vercel serverless entry → server/src/app.ts
data/       Content source of truth (JSON + images)
scripts/    build-data, publish-content, image helpers
supabase/   SQL for the subscribers table
docs/       Documentation
```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Forms API `:4000` + public site `:5173` |
| `npm run dev:cms` | CMS API `:4001` + admin UI `:5174` |
| `npm run dev:all` | Everything |
| `npm run build:data` | Regenerate `client/public/data` + images from `data/` |
| `npm run publish:content` | build:data → commit content → push `main` |
| `npm run build` | Production build (what Vercel runs) |

## Product rules

- Saving in the CMS writes immediately; `isPublished` controls whether an event appears on the site.
- Companies = sponsors/partners; people can also have a free-text company name.
- Tracks, prizes and judges exist only for hackathons and pitch competitions.
- People page groups by involvement (judged, spoke, sponsored, partnered, hosted, volunteered) with event history.

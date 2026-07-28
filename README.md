# Crewbase Collective

Simple React site for hackathons, pitch competitions, workshops, and community events.

| Piece | Service |
|-------|---------|
| Website + API | [Vercel](https://vercel.com) |
| Database | [Supabase](https://supabase.com) Postgres |
| Domain | Hostinger DNS → Vercel |

## Quick start

```bash
npm install
cp server/.env.example server/.env   # set DATABASE_URL (encode @ in password as %40)
npm run db:push
npm run db:seed
npm run dev
```

- Site: http://localhost:5173  
- Admin CMS: http://localhost:5174/admin (`npm run dev:cms` or `npm run dev:all`)

## Docs

| Doc | Contents |
|-----|----------|
| [AGENTS.md](AGENTS.md) | Quick guide for humans & AI agents |
| [Content schema](docs/CONTENT_SCHEMA.md) | Static JSON data structure + file layout |
| [Architecture](docs/ARCHITECTURE.md) | Folders, deploy, request flow |
| [Database schema](docs/DATABASE_SCHEMA.md) | Legacy Postgres tables (Supabase export) |
| [Workflows](docs/WORKFLOWS.md) | Admin + public flows step-by-step |
| [Test cases](docs/TEST_CASES.md) | Positive / negative checklist |

## Structure (short)

```
client/   React + Vite + React Router (dark UI)
server/   Express API + Drizzle + auth + uploads + seed
api/      Vercel serverless entry
docs/     Schema, workflows, architecture, tests
```

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | API `:4000` + client `:5173` |
| `npm run build` | Production client build |
| `npm run db:push` | Apply schema to Supabase |
| `npm run db:seed` | Admin + sponsors + people + events |

## Product rules

- Saving an event **publishes it** (no draft toggle).
- Then use **Configure** for tracks, sponsors, partners, prizes, schedule, speakers, judges, hosts, links, photos.
- Companies = **sponsors only**; people can type any company name.
- People page groups by **Judges / Speakers / Sponsors / Partners / Volunteers / Hosts** with counts and event history.
# crewbasecollective

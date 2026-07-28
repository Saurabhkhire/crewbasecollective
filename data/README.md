# Content data (source of truth)

Edit via the local CMS (`npm run dev:cms`), then publish with `npm run publish:content`.

**Full schema & Supabase mapping:** [`docs/CONTENT_SCHEMA.md`](../docs/CONTENT_SCHEMA.md)  
**TypeScript types:** `server/src/data/types.ts`

## Layout

```
data/
├── companies.json          # 33 sponsor/partner companies
├── people.json             # 64 people
├── events/
│   └── {uuid}.json         # 15 events (nested tracks, sponsors, schedule, etc.)
└── images/
    ├── companies/          # logos → referenced as /images/companies/...
    └── events/{slug}/      # covers + gallery → /images/events/...
```

## Derived (auto-built — do not edit)

```
client/public/data/         # website reads these JSON files
client/public/images/       # copy of data/images/
```

Rebuild: `npm run build:data` (CMS does this automatically on save).

## Publish to production

```bash
npm run publish:content
# or: npm run publish:content -- "Add Bay Builders hackathon"
```

Rebuilds `client/public/` from `data/`, commits content files, and pushes to `main`. Vercel redeploys automatically.

**Vercel:** Root Directory must be `.` (repo root), not `client/`.

## One-time import from Postgres

`npm run export:data` (requires `DATABASE_URL` in `server/.env`)

# Content data (source of truth)

Edit via the local CMS (`npm run dev:cms`), then commit this folder plus `client/public/data` and `client/public/images`.

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

## One-time import from Postgres

`npm run export:data` (requires `DATABASE_URL` in `server/.env`)

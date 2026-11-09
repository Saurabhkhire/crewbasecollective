# Content data (source of truth)

Edit via the local CMS (`npm run dev:cms`), then publish with `npm run publish:content`.

**Full schema & Supabase mapping:** [`docs/CONTENT_SCHEMA.md`](../docs/CONTENT_SCHEMA.md)  
**TypeScript types:** `server/src/data/types.ts`  
**Plain-language overview:** [`docs/SIMPLE_GUIDE.md`](../docs/SIMPLE_GUIDE.md)

## Layout

```
data/
├── companies.json          # sponsor/partner companies (~78 as of 2026-10)
├── people.json             # people directory (~121)
├── settings.json           # CMS settings: sub-roles, community links, SMTP, email templates
├── assets/                 # pitch-deck.pdf for sponsorship emails
├── events/
│   └── {uuid}.json         # one file per event (~23; nested tracks, sponsors, schedule, etc.)
└── images/
    ├── companies/          # logos → /images/companies/...
    ├── covers/             # event covers → /images/covers/...
    └── events/{event-name}/ # gallery → /images/events/...  (folder = event name, not slug)
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

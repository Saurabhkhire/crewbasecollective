# Content schema (static JSON)

**Updated:** 2026-07-27  
**Source of truth in code:** `server/src/data/types.ts`  
**Legacy Postgres mapping:** `docs/DATABASE_SCHEMA.md` (old Supabase tables)

This is the canonical description of how **events, people, companies (sponsors), and images** are stored now. Supabase only holds `subscribers` (newsletter emails).

---

## Where files live

```
crewbasecollective/
├── data/                              ← EDIT HERE (via local CMS or by hand)
│   ├── companies.json                 ← all sponsor/partner companies
│   ├── people.json                    ← all people
│   ├── events/
│   │   └── {event-uuid}.json          ← one file per event (full nested data)
│   └── images/
│       ├── companies/{company-id}.jpg ← company logos
│       └── events/{slug}/             ← event covers + gallery photos
│           ├── cover.jpg
│           ├── cover-page.jpg
│           └── photos/{photo-id}.jpg
│
├── client/public/data/                ← AUTO-BUILT (do not edit by hand)
│   ├── events-index.json              ← list of published events (summary)
│   ├── sponsors.json                  ← companies for /sponsors page
│   ├── people.json                    ← people + computed involvement lists
│   └── events/{slug}.json             ← denormalized event detail for public site
│
└── client/public/images/              ← AUTO-COPIED from data/images/
```

| Layer | Purpose | Who writes it |
|-------|---------|---------------|
| `data/` | Source of truth | Local CMS (`npm run dev:cms`) or `export:data` |
| `client/public/data/` | Public website JSON | `npm run build:data` or CMS after every save |
| `client/public/images/` | Public image URLs (`/images/...`) | Copied from `data/images/` on build |

**Image paths in JSON** use web paths like `/images/companies/{id}.png` or `/images/events/{slug}/cover.jpg`. Files live under `data/images/`; the build copies them to `client/public/images/`.

---

## File formats

### `data/companies.json`

```json
{
  "companies": [
    {
      "id": "uuid",
      "name": "Nebius",
      "logoUrl": "/images/companies/uuid.png",
      "website": "https://...",
      "linkedin": "https://...",
      "information": "Description text",
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601"
    }
  ]
}
```

**Was Supabase table:** `companies`

---

### `data/people.json`

```json
{
  "people": [
    {
      "id": "uuid",
      "username": "Display Name",
      "email": "email@example.com",
      "linkedin": "https://...",
      "role": "participant",
      "title": "Founder",
      "phone": null,
      "notes": null,
      "companyId": "uuid-or-null",
      "companyName": "Crewbase Collective",
      "roles": [],
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601"
    }
  ]
}
```

**Was Supabase table:** `users`  
`role` values: `participant`, `speaker`, `judge`, `host`, `volunteer`, `sponsor_rep`, `organizer`, `other`  
`email`, `phone`, and `notes` are admin-only (not written to public `people.json`).

---

### `data/events/{id}.json`

One JSON file per event. Top-level shape:

```json
{
  "event": { /* EventBasics — see types.ts */ },
  "tracks": [],
  "sponsors": [],
  "partners": [],
  "prizes": [],
  "schedule": [],
  "speakers": [],
  "judges": [],
  "hosts": [],
  "associated": [],
  "staffRoles": [],
  "links": [],
  "photos": [],
  "liveState": { "liveReassignmentAt": null }
}
```

`associated` are admin-only contacts and are **never** written to `client/public/data`. Partners may use `companyId: null` with `customName` + a representative for an individual (no company). Legacy `externals` are migrated into `associated` on load.

#### `event` (basics)

| Field | Type | Was Supabase `events` column |
|-------|------|------------------------------|
| `id` | uuid | `id` |
| `slug` | string | `slug` |
| `name` | string | `name` |
| `type` | enum | `type` |
| `description` | string \| null | `description` |
| `theme` | string \| null | `theme` |
| `dayLabel` | string \| null | `day_label` |
| `eventDate` | `YYYY-MM-DD` | `event_date` |
| `endDate` | `YYYY-MM-DD` \| null | `end_date` |
| `startTime` / `endTime` | `HH:MM:SS` \| null | `start_time` / `end_time` |
| `location` | string \| null | `location` |
| `locationLat` / `locationLng` | string \| null | `location_lat` / `location_lng` |
| `coverImageUrl` / `coverPageUrl` | string \| null | `cover_image_url` / `cover_page_url` |
| `lumaLink` / `eventbriteLink` / `groupLink` | string \| null | same |
| `isPartnerEvent` | boolean | `is_partner_event` |
| `isPublished` | boolean | `is_published` |
| `createdAt` / `updatedAt` | ISO string | `created_at` / `updated_at` |

`type` values: `hackathon`, `pitch_competition`, `workshop`, `mixer`, `dinner`, `demo`, `other`

#### Nested arrays (inside same event file)

| JSON key | Was Supabase table(s) | Notes |
|----------|----------------------|--------|
| `tracks` | `tracks` | Hackathon / pitch only |
| `sponsors` | `event_sponsors` + `event_sponsor_representatives` | `representatives: [{ userId }]` |
| `partners` | `event_partners` | `partnerType`: venue, technology, community, media, food, other, custom. `companyId` may be null for an individual (`customName` + reps) |
| `prizes` | `prizes` | `placement`: first, second, third, winning, custom |
| `schedule` | `schedule_items` + `schedule_speakers` | Nested `speakers` per slot |
| `speakers` | `event_speakers` | Standalone speaker timeline |
| `judges` | `event_judges` | Hackathon / pitch only |
| `hosts` | `event_hosts` | `hostType`: host, sponsor, venue_partner, volunteer, other |
| `associated` | — | Admin-only associated people; never published. Legacy `externals` migrate here |
| `staffRoles` | — | Legacy sub-role rows; visible ones may appear as public `team` |
| `links` | `event_links` | |
| `photos` | `event_photos` | `imageUrl` → `/images/events/{slug}/photos/...` |
| `liveState` | `schedule_live_state` | Optional 1:1 per event |

**Not migrated to static JSON** (were empty / unused in production): `registrations`, `projects`, `track_sponsors`, `track_partners`, `requests`, `request_events`, `admin_users`.

---

## Public derived files (`client/public/data/`)

Built by `buildDerivedData()` in `server/src/data/repository.ts`:

| File | Built from | Used by |
|------|------------|---------|
| `events-index.json` | Published events only (`isPublished: true`) | `/events`, home, request forms |
| `events/{slug}.json` | Denormalized event (names, logos resolved) | `/events/:slug` |
| `sponsors.json` | All companies | `/sponsors` |
| `people.json` | People + computed `judged`, `spoke`, `sponsored`, `hosted`, `volunteered` arrays | `/people` |

Run manually: `npm run build:data`  
CMS runs this automatically after every save.

---

## Enums (same as old Postgres)

| Name | Values |
|------|--------|
| Event type | `hackathon`, `pitch_competition`, `workshop`, `mixer`, `dinner`, `demo`, `other` |
| Partner type | `venue`, `technology`, `community`, `media`, `food`, `other`, `custom` |
| Prize placement | `first`, `second`, `third`, `winning`, `custom` |
| Host type | `host`, `sponsor`, `venue_partner`, `volunteer`, `other` |
| Person role | `participant`, `speaker`, `judge`, `host`, `volunteer`, `sponsor_rep`, `organizer`, `other` |

Defined in TypeScript: `server/src/data/types.ts`  
Old Drizzle/Postgres enums: `server/src/db/schema.ts`

---

## Supabase today (production only)

| Table | Purpose |
|-------|---------|
| `subscribers` | Newsletter emails from footer `POST /api/subscribe` |

Schema: `supabase/schema.sql`  
Request forms are **email only** (not stored in DB).

---

## Re-importing to a database later

1. Read shapes from `server/src/data/types.ts`
2. Compare with `docs/DATABASE_SCHEMA.md` for column names (snake_case in SQL, camelCase in JSON)
3. One-time export script (reverse direction): `server/src/scripts/export-to-json.ts` shows the exact field mapping from Postgres → JSON
4. Drizzle schema for full SQL DDL: `server/src/db/schema.ts`

**IDs are preserved** from the Supabase migration (UUIDs in JSON match old rows), so you can round-trip if needed.

---

## Quick reference commands

```bash
npm run dev:cms          # edit content → writes data/
npm run build:data       # rebuild client/public/data + copy images
npm run export:data      # one-time Postgres → data/ (needs DATABASE_URL)
npm run dev              # preview public site from static files
```

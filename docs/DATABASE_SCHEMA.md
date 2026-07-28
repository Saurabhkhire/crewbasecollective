# Database Schema (legacy Postgres / Supabase)

> **Current content storage is static JSON**, not Postgres. See [`CONTENT_SCHEMA.md`](./CONTENT_SCHEMA.md) for file layout, types, and how each JSON field maps to the tables below.

**Stack:** PostgreSQL (Supabase) · Drizzle ORM  
**Updated:** 2026-07-26

## Rules

- **Companies** = sponsor / partner orgs only (not every employer).
- **People (`users`)** can pick a sponsor company *or* type a free-text company name.
- **Events** go live on save (`is_published` is always set `true` by the API).
- **Hackathon & pitch competition** get tracks, prizes, and judges.
- **Other event types** get schedule, speakers, hosts, sponsors, partners, links, photos only.

---

## Enums

| Enum | Values |
|------|--------|
| `user_role` | `participant`, `speaker`, `judge`, `host`, `volunteer`, `sponsor_rep`, `organizer`, `other` |
| `event_type` | `hackathon`, `pitch_competition`, `workshop`, `mixer`, `dinner`, `demo`, `other` |
| `partner_type` | `venue`, `technology`, `community`, `media`, `food`, `other`, `custom` |
| `prize_placement` | `first`, `second`, `third`, `winning`, `custom` |
| `host_type` | `host`, `sponsor`, `venue_partner`, `volunteer`, `other` |
| `request_type` | `sponsorship`, `judging_speaking`, `partnership`, `member_host`, `volunteer` |
| `judging_speaking_role` | `judging`, `speaking`, `both` |
| `member_host_role` | `member`, `host` |
| `member_host_scope` | `all_hackathons`, `specific_events` |

---

## Core tables

### `admin_users`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `username` | VARCHAR(100) UNIQUE | Login |
| `password_hash` | TEXT | bcrypt |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

### `companies` (sponsors)

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `name` | VARCHAR(255) | Required |
| `logo_url` | TEXT | Uploaded image or URL |
| `website` | TEXT | Public click → website |
| `linkedin` | TEXT | Optional |
| `information` | TEXT | Description |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

### `users` (people — not login accounts)

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `username` | VARCHAR(100) | Display name |
| `email` | VARCHAR(255) UNIQUE | |
| `linkedin` | TEXT | Public click → LinkedIn |
| `role` | `user_role` | Internal default only; public roles come from event assignments |
| `title` | VARCHAR(255) | Job title (Founder, DevRel, …) |
| `phone` | VARCHAR(50) | Admin only |
| `company_id` | UUID FK → companies | Optional sponsor link |
| `company_name` | VARCHAR(255) | Free-text company (always stored when typed/selected) |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

### `events`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `slug` | VARCHAR(255) UNIQUE | From name |
| `name` | VARCHAR(255) | |
| `type` | `event_type` | |
| `description` | TEXT | |
| `theme` | VARCHAR(255) | |
| `day_label` | VARCHAR(100) | Auto from `event_date` weekday (e.g. Saturday, or Friday – Sunday for multi-day) |
| `end_date` | DATE | Optional, for multi-day events |
| `event_date` | DATE | Required |
| `start_time` / `end_time` | TIME | |
| `location` | TEXT | Free text or map-selected place name |
| `location_lat` / `location_lng` | DECIMAL | Set when chosen from map search |
| `cover_image_url` | TEXT | File upload |
| `cover_page_url` | TEXT | Optional |
| `luma_link` / `eventbrite_link` | TEXT | Registration links |
| `group_link` | TEXT | Discord / WhatsApp (or other) invite to join the event group |
| `is_partner_event` | BOOLEAN | default false |
| `is_published` | BOOLEAN | Always `true` on admin save |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

---

## Event child tables

### `tracks` (hackathon / pitch only)

`id`, `event_id` → events, `name`, `description`, `access`, `sort_order`, timestamps

### `track_sponsors` / `track_partners`

Link tracks to companies (and optional person). Used when a track has its own sponsors/partners.

### `event_sponsors`

| Column | Notes |
|--------|--------|
| `event_id`, `company_id` | Required |
| `person_id` | Legacy single sponsor representative |
| `sort_order` | |
| UNIQUE `(event_id, company_id)` | |

Logo and description are **not** stored here — they come live from `companies`.

### `event_sponsor_representatives`

Links one event sponsor to any number of people using `event_sponsor_id` and
`user_id`. The pair is unique, so the same representative cannot be added twice.

### `event_partners`

| Column | Notes |
|--------|--------|
| `event_id` | |
| `company_id` | Selected partner company |
| `partner_type` | venue / technology / community / media / food / other / custom |
| `custom_type` | When type = custom |

Logo and description come live from `companies` (not duplicated on the partner row).

### `prizes` (hackathon / pitch only)

`event_id`, optional `track_id` / `sponsor_id` / `company_id`, `placement`, `custom_label`, `prize_name`, `amount` (free text, e.g. `$500 cash + $400 credits`), optional `currency`, `sort_order`

### `schedule_items`

`event_id`, `start_time`, `end_time` (timestamptz), `topic`, `sort_order`, `is_skipped` (live reassignment)

### `schedule_speakers`

`schedule_item_id` + `user_id` (speakers on a specific agenda slot)

### `schedule_live_state`

One row per event: `live_reassignment_at`

### `event_speakers`

Multiple rows per person allowed (same speaker can have several time slots).  
`event_id`, `user_id`, `event_day`, `start_time`, `end_time`, `topic`, `is_skipped`, `sort_order`  
"Reassign from current time" marks speakers whose `end_time` has passed as skipped; skipped speakers are hidden publicly.

### `event_judges` (hackathon / pitch only)

`event_id` + `user_id`, `sort_order`. The legacy `role` column is not exposed.

### `event_hosts`

`event_id` + `user_id`, `host_type`, optional `custom_type`, `sort_order`  
`host_type = volunteer` → Volunteers section; `venue_partner` → Partners on People page

### `event_links` / `event_photos`

External links and gallery images (`image_url` from file upload)

### `registrations` / `projects`

Optional attendee and project records for future use

---

## Public request forms

### `requests`

Common: `type`, `name`, `email`, `linkedin`, `comments`  
Type-specific: `company_name`, `website`, `description`, `sponsorship_details`, `judging_speaking_role`, `partnership_type`, `member_host_role`, `member_host_scope`

### `request_events`

Junction: `request_id` + `event_id` (multi-select events)

---

## Relationships (summary)

```
companies ──< users (optional company_id)
companies ──< event_sponsors / event_partners / track_sponsors / prizes

events ──< tracks ──< track_sponsors / track_partners
events ──< event_sponsors ──< event_sponsor_representatives >── users
events ──< event_partners, prizes
events ──< schedule_items ──< schedule_speakers >── users
events ──< event_speakers / event_judges / event_hosts >── users
events ──< event_links / event_photos / registrations / projects
events ──  schedule_live_state (1:1)

requests ──< request_events >── events
```

## Source of truth

- **Static content (current):** `data/` + `server/src/data/types.ts` — see [`CONTENT_SCHEMA.md`](./CONTENT_SCHEMA.md)
- **Legacy SQL DDL:** Drizzle schema `server/src/db/schema.ts`
- **Production DB (now):** `subscribers` only — `supabase/schema.sql`

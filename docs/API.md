# API reference

**Updated:** 2026-10-25

Two APIs exist. The **production API** is on the internet. The **CMS API** only runs on localhost and has **no authentication**.

---

## Production API (`server/src/app.ts` → `routes/forms.ts`)

Also mounted by the CMS server, so forms work locally too.

### `GET /api/health`
→ `{ ok: true, mode: "api" }` (`mode: "cms"` on the CMS server)

### `POST /api/subscribe`
Body: `{ email }` → upsert into Supabase `subscribers`.
- `200 { success: true, stored: true }` (duplicates count as success)
- `400` invalid email · `503` Supabase env not set · `500` DB error

### `POST /api/requests`
Body is a discriminated union on `type`. Common fields: `name` (required), `email` (required), `linkedin?`, `comments?`, `eventIds: string[]` (≥1, except `contact_us`).

| `type` | Extra fields |
|--------|--------------|
| `sponsorship` | `companyName` (req), `website?`, `description?`, `sponsorshipDetails?` |
| `judging_speaking` | `judgingSpeakingRole`: `judging` \| `speaking` \| `both` |
| `partnership` | `partnershipType`: `venue` \| `ventures` \| `community` \| `media` \| `food` \| `other` \| `custom`, `partnershipCustomType?`, `companyName?`, `website?`, `description?` |
| `member_host` | `memberHostRole`: `member` \| `host` |
| `volunteer` | — |
| `contact_us` | `comments` required; `eventIds` optional |

Event names are looked up from `events-index.json`. An HTML email goes to `NOTIFY_EMAIL`.
- `201 { success: true, emailed: boolean }` — if SMTP isn't configured, payload is logged and `emailed: false`.
- `400 { error: zodFlatten }` · `500` SMTP configured but send failed.

> Duplicate implementation: `client/api/{health,subscribe,requests}.ts` (standalone Vercel functions, only active if Vercel Root Directory = `client/`). Keep in sync.

---

## CMS API (`server/src/cms-server.ts`, port 4001, prefix `/api/admin` unless noted)

Every write saves to `data/` and calls `buildDerivedData()`.

### Places
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/places/search?q=` | Proxy to OpenStreetMap Nominatim → `[{ label, lat, lng, type }]` (used by `LocationPicker`) |

### Uploads (`local-upload.ts`)
| Method | Path | Body / query |
|--------|------|--------------|
| POST | `/upload-logo` | multipart `logo`; query `name` → `/images/companies/...` |
| POST | `/upload-image` | multipart `image`; query `folder`, `naming` (`random`\|`named`\|`sequential`), `name` |
| POST | `/upload-images` | multipart `images` (≤20); same query |
| GET | `/resolve-image` | `folder`, `name`, optional `folders[]`, `names[]` → find existing named image URL |
| GET | `/list-images` | `folder` → URLs in folder |

### Companies
| Method | Path | Body |
|--------|------|------|
| GET | `/companies` | → companies with involvement info |
| POST | `/companies` | `{ name, logoUrl?, website?, linkedin?, email?, information? }` |
| PUT | `/companies` | `{ id, ...fields }` |
| DELETE | `/companies` | `{ id }` — removes from `companies.json` only; event sponsor/partner rows pointing at it are **not** cleaned up |

### People
| Method | Path | Body |
|--------|------|------|
| GET | `/people` | → people + computed main roles, sub-roles, event involvements |
| POST | `/people` | person fields (`username`, `email`, `linkedin`, `title`, `companyId`/`companyName`, `roles`, …) |
| PUT | `/people` | `{ id, ...fields }` |
| DELETE | `/people` | `{ id }` — removes from `people.json` only; event rows with that `userId` are **not** cleaned up |

### Events (basics)
| Method | Path | Body |
|--------|------|------|
| GET | `/events` | → all event records (incl. unpublished) |
| POST | `/events` | event basics → creates `data/events/{uuid}.json`, slug via `slugify()` |
| PUT | `/events` | `{ id, ...partialBasics }` |
| DELETE | `/events` | `{ id }` |
| GET | `/requests` | always `[]` (forms are email-only) |

### Event detail (nested collections)
`GET /events/:id/detail` → `adminEventDetail(record)` (record + resolved names).

`POST | PUT | DELETE /events/:id/detail` with body `{ entity, entityId?, data? }` (`entityId` required for PUT/DELETE).

| `entity` | Collection in event file |
|----------|--------------------------|
| `track` | `tracks` |
| `sponsor` | `sponsors` (+ `representatives`) |
| `partner` | `partners` (+ `representatives`) |
| `prize` | `prizes` |
| `schedule` / `schedule_speaker` | `schedule` / its `speakers` |
| `speaker` | `speakers` |
| `judge` | `judges` |
| `host` | `hosts` (volunteers are hosts with `hostType: "volunteer"`) |
| `associated` | `associated` (admin-only) |
| `staff_role` | `staffRoles` |
| `link` | `links` |
| `photo` | `photos` |
| `reorder` | reorder any collection (`reorderEventCollection`) |
| `reorder_schedule` | reorder schedule |
| `reassign_schedule` | mark schedule slots that already ended as `isSkipped`; set `liveState.liveReassignmentAt` |
| `reassign_speakers` | mark speakers whose `endTime` passed as `isSkipped` |
| `sync_gallery` | re-scan `images/events/{name}/` into `photos` |

### Settings
| Method | Path | Notes |
|--------|------|-------|
| GET | `/settings` | settings via `publicAdminSettings()` (SMTP passwords are returned **unmasked** — local only) + `smtpPasswordSet`, `emailPlaceholders`, `hasPitchDeck` |
| PUT | `/settings` | `{ subRoles?, communityLinks?, emailTemplates?, smtp? }` |
| POST | `/settings/pitch-deck` | multipart `file` (PDF ≤20MB) → `data/assets/pitch-deck.pdf` |

### Emails
| Method | Path | Body |
|--------|------|------|
| POST | `/emails/preview` | `{ personId, kind, eventId?, subject?, body? }` → filled subject/body |
| POST | `/emails/send` | `{ personId, kind, eventId?, toEmail?, subject?, body? }` |

`kind`: `sponsorship_request` (attaches pitch deck), `speaker_invite`, `judge_invite`, `judge_speaker_invite`, `judge_certification`, `speaker_certification`, `judge_speaker_certification` (certificates attach a generated PDF). These kinds require `eventId`; judge/speaker kinds require a competition event.

Placeholders: `{{person_name}} {{event_name}} {{event_date}} {{event_date_clause}} {{event_time}} {{event_place}} {{luma_link}} {{sponsor_names}} {{partner_names}} {{theme}} {{tracks}}`.

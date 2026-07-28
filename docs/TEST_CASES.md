# Test Cases

**Updated:** 2026-07-26  
✅ = positive · ❌ = negative

---

## Authentication

| ID | Type | Case | Steps | Expected |
|----|------|------|-------|----------|
| AUTH-P01 | ✅ | Valid login | Correct username/password | Cookie set, `/admin` loads |
| AUTH-P02 | ✅ | Logout | Click logout | Cookie cleared, back to login |
| AUTH-P03 | ✅ | Session persists | Refresh `/admin` | Still authenticated |
| AUTH-N01 | ❌ | Wrong password | Valid user, bad password | 401, no cookie |
| AUTH-N02 | ❌ | Empty form | Submit blank | Validation error |
| AUTH-N03 | ❌ | No session | `POST /api/admin/events` | 401 |
| AUTH-N04 | ❌ | Expired cookie | Corrupt/expire cookie | Treated as logged out |

---

## Companies (sponsors)

| ID | Type | Case | Steps | Expected |
|----|------|------|-------|----------|
| CO-P01 | ✅ | Create with logo | Name, website, description, upload logo | Row in DB; on `/sponsors` |
| CO-P02 | ✅ | Edit website | Change URL | Public sponsors updated |
| CO-P03 | ✅ | Click company | Click name on sponsors/event | Opens website |
| CO-N01 | ❌ | Missing name | Submit empty name | 400 |
| CO-N02 | ❌ | Non-admin create | No cookie | 401 |

---

## People

| ID | Type | Case | Steps | Expected |
|----|------|------|-------|----------|
| US-P01 | ✅ | Create + type company | Type “META” (not in sponsors) | `company_name` saved; no new company row |
| US-P02 | ✅ | Create + matching sponsor name | Type exact existing company name | May link `company_id` if name matches; still no new company row |
| US-P03 | ✅ | People Judges section | Assign as judge on event | Appears under Judges with Judged: N |
| US-P04 | ✅ | Expand history | Click judge row | Lists judged event names (links) |
| US-P05 | ✅ | Speakers / hosts / volunteers | Assign roles on event | Correct section + count |
| US-P06 | ✅ | LinkedIn | Click name | Opens LinkedIn |
| US-P07 | ✅ | No site role field | Open Add Person | No participant/speaker/judge dropdown |
| US-N01 | ❌ | Duplicate email | Same email twice | Unique constraint / error |
| US-N02 | ❌ | Invalid email | `not-an-email` | 400 |
| US-N03 | ❌ | No involvement | Person never assigned | Not listed in role sections |

---

## Events

| ID | Type | Case | Steps | Expected |
|----|------|------|-------|----------|
| EV-P01 | ✅ | Create hackathon | Save event | Auto-published; redirect to Manage |
| EV-P02 | ✅ | Create workshop | type=workshop | No Tracks/Prizes/Judges tabs |
| EV-P03 | ✅ | Create pitch | type=pitch_competition | Tracks/Prizes/Judges available |
| EV-P04 | ✅ | Public list | Open `/events` | Event visible immediately after save |
| EV-P05 | ✅ | Cover upload | Upload image file | Cover shows on public page |
| EV-P06 | ✅ | Single Manage button | Click Manage on list | Opens Basics + detail tabs; can edit basics and all sections |
| EV-N01 | ❌ | Missing name | Save without name | Blocked / 400 |
| EV-N02 | ❌ | Missing date | Save without date | Blocked / 400 |
| EV-N03 | ❌ | Bad type enum | Invalid type in API | 400 |

---

## Event children (Configure)

| ID | Type | Case | Steps | Expected |
|----|------|------|-------|----------|
| HK-P01 | ✅ | Add track | Name and description | On public event page; no access field |
| HK-P02 | ✅ | Add sponsor | Company + multiple people | Logo/description from company; representatives shown; reps also appear under Judges |
| HK-P03 | ✅ | Add prize 1st | Select sponsor, placement=first, amount | Name defaults to “Best use of {company}” and remains editable |
| HK-P04 | ✅ | Custom prize | placement=custom + label | Custom label shown |
| HK-P05 | ✅ | Food partner | Select company and type=food | Shows as Food Partner |
| HK-P06 | ✅ | Schedule + speaker | Add day/time/topic slot and timed speaker | Both display day, start/end and topic |
| HK-P07 | ✅ | Reorder schedule | ▲ / ▼ | Order updates |
| HK-P08 | ✅ | Live reassign | Click reassign on Speakers | Past speakers skipped/hidden |
| HK-P09 | ✅ | Add judge | Select person only | Judges section has no role field |
| HK-P10 | ✅ | Add volunteer | host_type=volunteer | Volunteers section; People → Volunteers |
| HK-P11 | ✅ | Custom host type | Select Custom and write type | Written type shown publicly |
| HK-P12 | ✅ | Multi photo upload | Select several images | Gallery populated |
| HK-P13 | ✅ | Edit prize | Pencil → change amount/name → Save | List and public page update |
| HK-P14 | ✅ | Edit track/schedule/speaker/etc. | Pencil on any child row → Save | Form prefills; PUT updates row |
| HK-P15 | ✅ | Edit photo caption | Pencil on photo → Save caption | Caption updates; image unchanged |
| HK-P16 | ✅ | Remove sponsor rep | Edit sponsor, remove a rep, Save | Removed from Judges unless still a rep for another sponsor |
| HK-P17 | ✅ | Delete sponsor | Delete sponsor with reps | Reps dropped from Judges if not still reps elsewhere |
| HK-N01 | ❌ | Prize on workshop | UI has no Prizes tab | Cannot add |
| HK-N02 | ❌ | Sponsor without company | Submit empty company | Button disabled / 400 |

---

## Public display

| ID | Type | Case | Steps | Expected |
|----|------|------|-------|----------|
| PB-P01 | ✅ | Empty section hidden | No partners | Partners block not shown |
| PB-P02 | ✅ | Sponsors page | Open `/sponsors` | All companies listed |
| PB-P03 | ✅ | Competition only fields | Open hackathon | Tracks/prizes/judges if present |
| PB-P04 | ✅ | Workshop | Open workshop | No tracks/prizes/judges |
| PB-N01 | ❌ | Bad slug | `/events/does-not-exist` | Not found UI |

---

## Request forms

| ID | Type | Case | Steps | Expected |
|----|------|------|-------|----------|
| RF-P01 | ✅ | Sponsorship | Fill required + events | Row + email (or console) |
| RF-P02 | ✅ | Judging/speaking | Role + events | Saved |
| RF-P03 | ✅ | Partnership | Type + events | Saved |
| RF-P04 | ✅ | Member/host all | Scope=all_hackathons | Saved without specific events |
| RF-P05 | ✅ | Volunteer specific | Scope=specific + events | Saved |
| RF-N01 | ❌ | Missing email | Omit email | 400 |
| RF-N02 | ❌ | Sponsorship no company | Omit company | 400 |
| RF-N03 | ❌ | Specific events empty | Scope=specific, no events | 400 |

---

## Uploads

| ID | Type | Case | Steps | Expected |
|----|------|------|-------|----------|
| UP-P01 | ✅ | Logo upload | Image file on company | Preview + saved URL |
| UP-P02 | ✅ | Cover upload | Image on event form | Cover on public page |
| UP-P03 | ✅ | Multi photos | Several files | Multiple photo rows |
| UP-N01 | ❌ | Non-image file | Upload .pdf | Rejected |
| UP-N02 | ❌ | Unauthenticated upload | No cookie | 401 |

---

## Admin requests inbox

| ID | Type | Case | Steps | Expected |
|----|------|------|-------|----------|
| RQ-P01 | ✅ | List requests | Open `/admin/requests` | Newest first |
| RQ-P02 | ✅ | Expand volunteer | Open volunteer row | Shows scope + comments |

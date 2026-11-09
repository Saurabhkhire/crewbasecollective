# The simple guide — how this website works

*Written so anyone (even someone who has never coded) can understand it. No jargon without an explanation.*

---

## 🏠 The big picture: a bulletin board and a notebook

Imagine a school **bulletin board** in the hallway. Everyone can walk by and read it.
That's the **public website** (`client/`). People visit it to see upcoming events, sponsors, and who judged or spoke.

Now imagine the teacher has a **notebook** at home where they write all the event details first.
That's the **CMS** (`cms/` + `server/src/cms-server.ts`). Only the organiser uses it, on their own computer.

The notebook's pages are the **`data/` folder**: plain text files (JSON) listing every event, person and company.

When the teacher finishes writing, they **photocopy** the important pages and pin them on the board.
That photocopy step is `npm run build:data`. It makes neat, public-only copies in `client/public/data/`.
Private stuff (phone numbers, emails, notes) is **left out of the photocopy**.

Finally the teacher **carries the copies to school**: that's `git push`. Vercel (the school) sees the new copies and puts them up on the board (redeploys the site) automatically.

```
 Notebook (data/)  ──photocopy──►  Clean copies (client/public/data/)  ──git push──►  Bulletin board (website)
   edit with CMS     build:data       public info only                    Vercel
```

---

## 🧩 The pieces, one by one

| Piece | Folder | What it is, simply |
|-------|--------|---------------------|
| **Website** | `client/` | The pages people see: Home, Events, Event details, Sponsors, People, Get Involved. Built with React (a tool for building pages out of reusable blocks called *components*). |
| **Admin screens** | `client/src/pages/admin/` | The forms the organiser fills in to add events, people, companies, and send emails. |
| **CMS app** | `cms/` | A tiny wrapper that shows those admin screens on `localhost:5174`. It has almost no code of its own. |
| **CMS server** | `server/src/cms-server.ts` + `cms-routes.ts` | The "pen" — when you click Save, it writes into the `data/` files and makes fresh public copies. |
| **Repository** | `server/src/data/repository.ts` | The "librarian" — knows how to read/write every file and how to build the public copies. |
| **Types** | `server/src/data/types.ts` | The "dictionary" — describes exactly what an Event, Person, Company looks like. |
| **Forms API** | `server/src/app.ts` + `routes/forms.ts` | The only bit that runs on the internet besides the pages. It handles two things: newsletter sign-up and "contact us / sponsor us" forms. |
| **Supabase** | `supabase/schema.sql` | An online database used **only** to remember newsletter email addresses. |
| **Email (SMTP)** | `server/src/email.ts` | Sends emails through Gmail or Brevo — for form submissions and for invites/certificates from the CMS. |

---

## 📦 What's inside `data/`

Think of it as a filing cabinet with three drawers:

1. **`companies.json`** — one list of every sponsor/partner company (name, logo, website).
2. **`people.json`** — one list of every person (name, LinkedIn, title, company — plus private email/phone/notes).
3. **`events/`** — one file **per event**. Inside each file is *everything* about that event: date, place, tracks, sponsors, prizes, schedule, judges, speakers, hosts, photos, links.

Plus:
- **`images/`** — logos (`companies/`), event cover pictures (`covers/`), and event photo galleries (`events/{event-name}/`).
- **`settings.json`** — CMS settings: extra role names (MC, photographer…), community links (Discord, Luma), email setup, email templates.
- **`assets/`** — the sponsorship pitch-deck PDF attached to sponsor emails.

Events don't copy a person's details. They just say "person **#abc123** is a judge". When the public copy is built, the librarian looks up #abc123 and writes in their name and LinkedIn. That way if someone changes their title, it updates everywhere.

---

## 🚶 What happens when…

### …a visitor opens the Events page?
1. Their browser downloads the page (`client/`).
2. The page asks for `/data/events-index.json` (the public list).
3. It shows upcoming events first, past events after.
4. Clicking one loads `/data/events/{slug}.json` and shows sponsors, schedule, judges, photos. Empty sections are hidden.

No server thinking is needed — it's just reading files. That's why the site is fast and cheap.

### …someone fills the "Sponsor us" form (on the Get Involved page)?
1. The form sends the answers to `POST /api/requests`.
2. The server checks the answers make sense (using a checker called **Zod**).
3. It writes a nice email and sends it to the organiser's inbox (`NOTIFY_EMAIL`).
4. Nothing is saved in a database.

### …someone subscribes to the newsletter?
Footer form → `POST /api/subscribe` → email saved in Supabase's `subscribers` table.

### …the organiser adds a judge to an event in the CMS?
1. Admin screen sends `POST /api/admin/events/{id}/detail` with `{ entity: "judge", data: {...} }`.
2. CMS server opens `data/events/{id}.json`, adds the judge, saves the file.
3. It rebuilds all public copies (`buildDerivedData()`).
4. Organiser runs `npm run publish:content` → commit + push → website updates in a minute or two.

### …the organiser sends a judge certificate?
On the People page they click "Send email", pick an event and "judge certification". The server fills in the template (`{{person_name}}`, `{{event_name}}` …) from Settings, makes a PDF certificate, and emails it.

---

## 📖 Little dictionary

| Word | Meaning |
|------|---------|
| **JSON** | A text format for data, like a labelled list: `{ "name": "Bay Builders" }` |
| **Component** | A reusable building block of a page (e.g. `EventCard` = one event tile) |
| **API / endpoint** | A web address a program talks to, e.g. `/api/subscribe` |
| **Slug** | The URL-friendly name of an event, e.g. `bay-builders-hackathon-m3x9k2` |
| **Derived / generated** | Made automatically from something else — don't edit by hand |
| **Vercel** | The company hosting the website |
| **Supabase** | Online database (only newsletter emails here) |
| **SMTP** | The way programs send email |
| **CMS** | "Content Management System" — the admin editor |
| **Competition event** | A `hackathon` or `pitch_competition` — the only kinds with tracks, prizes and judges |
| **Legacy** | Old code kept around but no longer used |

---

## ✅ Three rules to remember

1. **Edit the notebook, not the bulletin board.** Change `data/` (via the CMS), never `client/public/data/`.
2. **The CMS stays at home.** It has no password, so it must never be put on the internet.
3. **Private stays private.** Emails, phones, notes and "associated" contacts never go into public files.

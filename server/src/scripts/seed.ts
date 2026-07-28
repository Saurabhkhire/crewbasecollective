import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { adminUsers, companies, users, events } from "../db/schema.js";
import { hashPassword } from "../auth.js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Sponsor companies only — from Events Data.xlsx Companies sheet (deduped) */
const SPONSOR_COMPANIES = [
  "Nebius",
  "You.com",
  "Replit",
  "InsForge",
  "Daytona",
  "Render",
  "Apify",
  "Kylon",
  "Nimble",
  "GrowthMasters",
  "HydraDB",
  "Tigris Data",
  "TRAE",
  "Retriver AI",
  "Brain2",
  "Opserra",
  "RocketRide",
  "Homebrew Club",
  "Amazon",
  "Govia",
  "NeverZero",
  "Finchip AI",
  "Cognee",
  "BAND",
  "Growing Pies",
  "Kalibr",
];

/** Users from Events Data.xlsx — company is free text; linked to sponsors only when name matches */
const USER_ROWS: [string, string, string, string, string][] = [
  ["Saurabh Khire", "saurabhskhire@gmail.com", "https://www.linkedin.com/in/saurabhkhire", "Founder", "Crewbase Collective"],
  ["Colin Lowenberg", "colin.lowenberg@ex.nebius.com", "https://www.linkedin.com/in/wifi/", "DevRel", "Nebius"],
  ["Tony Chwang", "tony.chang@insforge.dev", "https://www.linkedin.com/in/tony-chang-0430/", "Co Founder", "InsForge"],
  ["Can Lyu", "can.lyu@insforge.dev", "https://www.linkedin.com/in/can-lyu-3039aa140/", "Software Developer", "InsForge"],
  ["Wei Dou", "carmen.dou@insforge.dev", "https://www.linkedin.com/in/wei-dou-2b15a628b/", "Software Developer", "InsForge"],
  ["Anna Zakowska", "Anna.j.zakowska@gmail.com", "https://www.linkedin.com/in/zakowska/", "Investor and Managing Partner", "Dragons and Angels Fund"],
  ["Merve Isler", "merve@themarvelo.us", "https://www.linkedin.com/in/misslers/", "Ecosystem Builder", "AI Builders"],
  ["Gunjan Ramateke", "Gunjanramteke@gmail.com", "https://www.linkedin.com/in/gunjan-ramteke-18276642/", "Strategic Partnerships Development Manager", "Amazon"],
  ["Apurva Jain", "Apurvajain.kota@gmail.com", "https://www.linkedin.com/in/apurva-jain22/", "Software Engineer", "META"],
  ["Dhruvil Darji", "Dhruvildarji1409@gmail.com", "https://www.linkedin.com/in/dhruvildarji/", "Senior Software Engineer", "NVDIA"],
  ["Shouvik Sharma", "shouvik19@gmail.com", "https://www.linkedin.com/in/shouvik-sharma/", "Software Engineer", "Chime"],
  ["Vince Kohli", "vincekohli@gmail.com", "https://www.linkedin.com/in/vincekohli/", "Strategic Advisor", "Google Deepmind"],
  ["Abhi Vasanth", "abhivasanth@gmail.com", "https://www.linkedin.com/in/abhinandanvasanthin/", "Senior Data Engineer", "Pacific Gas and Electric Company"],
  ["Ayush Ojha", "ayushojzha@gmail.com", "https://www.linkedin.com/in/ayushozha/", "Software Engineer", "HiJenny"],
  ["Aviral Bharadwaj", "aviral.lancer@gmail.com", "https://www.linkedin.com/in/aviral-bhardwaj/", "Event Organizer", "Devnovate"],
  ["Amitabh Das", "amitabh.das1998@gmail.com", "https://www.linkedin.com/in/das-amitabh/", "Founder", "AgentOS"],
  ["Martina Beg", "Beg.Martina@gmail.com", "https://www.linkedin.com/in/martinabeg/", "GTM Lead", "Abaka AI"],
  ["Ann Cai", "xiaoran.cai@ethis.tech", "https://www.linkedin.com/in/qianjiangwork/", "Product Designer", "Microsoft"],
  ["Mahek Pervez", "mahek07615@gmail.com", "https://www.linkedin.com/in/mahekparvez/", "Tech Content Creator", "Instagram"],
  ["Kolliakal Rupesh", "kollaikalrupesh@gmail.com", "https://www.linkedin.com/in/kollaikalrupesh/", "Applied AI Engineer", "WayLine"],
  ["Katherine Brough", "katherine@nupathapp.com", "https://www.linkedin.com/in/katherine-brough-751682113", "Founder", "NuPath AI"],
  ["Anya Ozmen", "anya@gameer.ai", "https://www.linkedin.com/in/anyakaryaozmen/", "Founder", "Gameer"],
  ["Zhi Ling", "zhi@attrilo.co", "https://www.linkedin.com/in/zhilinglim/", "Founder", "Attrilo"],
  ["Elaine H", "elaine@getclera.com", "https://www.linkedin.com/in/elaine-hladik/", "Founding Grwth", "Clera"],
  ["Eeshan Gulhati", "eshaan@argide.ai", "https://www.linkedin.com/in/eshaangulati/", "Founder", "Argide"],
  ["Devinder Sodhi", "Dev@sodhirao.com", "https://www.linkedin.com/in/devindersodhi/", "Founder", "Learning Layer Labs"],
  ["Dathan Guiley", "dathan@wilde.agency", "https://www.linkedin.com/in/dathan-guiley/", "Founder", "WildLife Agency LLC"],
  ["Ruomeng Sun", "synruomeng@gmail.com", "https://www.linkedin.com/in/ruomengsun/", "GTM", "Photon.codes"],
  ["Harnoor Singh", "harnoor@hydradb.com", "https://www.linkedin.com/in/iharnoor/", "DevRel", "HydraDB"],
  ["Katherine Gao", "sgao@ucsd.edu", "https://www.linkedin.com/in/katherine-siyi-gao-853095204/", "Founder", "Stealth"],
  ["Mike Rice", "mike.rice@gmail.com", "https://www.linkedin.com/in/infogurus/", "Founder", "Agi Corp"],
  ["Haruka Takamori", "a@gmail.com", "https://www.linkedin.com/in/haruka-takamori-morimori/", "Co-Founder", "Svyal"],
  ["Wendy Wang", "b@mail.com", "https://www.linkedin.com/in/wendianwang/", "Computer Teaching Assistant", "Welsey College"],
  ["Fabian C", "fabian@getclera.com", "https://www.linkedin.com/in/fabian-c-544a10276/", "Founding Engineer", "Clera"],
  ["Chelsey Huang", "Chenxi.huang1028@gmail.com", "https://www.linkedin.com/in/chenxi-huang-017107327/", "Co-Founder", "Finchip AI"],
  ["Coco Wang", "coco@finchip.ai", "https://www.linkedin.com/in/coco-wang-28781b87/", "GTM", "Finchip AI"],
  ["Gary Yang", "gary@finchip.ai", "https://www.linkedin.com/in/gary-yangge/", "Founding Partner", "Finchip AI"],
  ["Dave Neilsan", "dnielsen@gmail.com", "https://www.linkedin.com/in/dnielsen/", "Founding Head of DevRel", "Cognee"],
  ["Ofer Mendelevitch", "ofer.mendelevitch@band.ai", "https://www.linkedin.com/in/ofermend/", "Head of DevRel", "BAND"],
  ["Quinn Leng", "quinn.leng.666@gmail.com", "https://www.linkedin.com/in/suanmiao/", "Co-Founder", "Kylon"],
  ["Christina Bowllan", "cbowllan1@gmail.com", "https://www.linkedin.com/in/christina-bowllan-074563177/", "Founding Team", "Kylon"],
  ["Eva Reader", "eva.c.reder@gmail.com", "https://www.linkedin.com/in/evareder/", "Founder", "GrowthMasters"],
  ["Juan Felipe Campos", "jfcampos.surmount@gmail.com", "https://www.linkedin.com/in/juanfelipecampos/", "Founder", "GrowthMasters"],
  ["Rene Turcios", "cloudtheboy@gmail.com", "https://www.linkedin.com/in/reneturcios/", "Ambdassedor", "Replit"],
  ["Barada Sahu", "barada@kubric.io", "https://www.linkedin.com/in/baradas/", "Technical Founder", "Mason"],
  ["Tejal Rangdal", "tejalrangdal24@gmail.com", "https://www.linkedin.com/in/tejalrangdal/", "Co-Founder", "Brain2"],
  ["JJ Caffey", "jj@jjcaffey.com", "https://www.linkedin.com/in/sarahjjcaffey/", "Angel Investor and Co Founder", "Venture Foragers"],
  ["Rebecca Burd", "rebecca@tigrisdata.com", "https://www.linkedin.com/in/rebecca-burd/", "GTM", "Tigris Data"],
  ["Arjun Chintapalli", "arjun@rtrvr.ai", "https://www.linkedin.com/in/arjun-chintapalli/", "Co-Founder", "Retriver AI"],
  ["Petros Hong", "petros.hong@apify.com", "https://www.linkedin.com/in/petroshong/", "DevRel", "Apify"],
  ["Devon Kelly", "devon@kalibr.systems", "https://www.linkedin.com/in/devon-kelley-0333a674/", "Founder", "Kalibr"],
  ["Bhavani Kalisetty", "bhavani@rtrvr.ai", "https://www.linkedin.com/in/bhavani-kalisetty/", "Co-Founder", "Retriver AI"],
  ["Hazal Mestci", "hazal@render.com", "https://www.linkedin.com/in/hazalmestci/", "DevRel", "Render"],
];

const EVENT_ROWS: { name: string; date: string; description: string }[] = [
  {
    name: "Wizard Hackathon",
    date: "2025-06-28",
    description: "Wizard Hackathon — build, demo, and win prizes with the community.",
  },
  {
    name: "Bay Builders Hackathon",
    date: "2025-07-13",
    description: "Bay Builders Hackathon — a day of building with Bay Area founders and engineers.",
  },
  {
    name: "Sports World Cup Hackathon",
    date: "2025-07-13",
    description: "Sports World Cup Hackathon (July 13-17) — sports-tech themed multi-day hackathon.",
  },
  {
    name: "Applied Intelligence Hackathon",
    date: "2025-08-28",
    description: "Applied Intelligence Hackathon — applied AI projects, judging, and prizes.",
  },
];

async function seed() {
  console.log("Seeding database (reset people/companies/events)...");

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await hashPassword(password);

  await db.insert(adminUsers).values({ username, passwordHash }).onConflictDoNothing();
  console.log(`Admin user: ${username}`);

  // Clear content tables so sponsors-only companies replace the old mixed list
  await db.execute(sql`TRUNCATE TABLE
    request_events, requests,
    schedule_speakers, schedule_items, schedule_live_state,
    track_sponsors, track_partners, tracks,
    event_sponsors, event_partners, event_speakers, event_judges, event_hosts,
    event_links, event_photos, prizes, projects, registrations,
    events, users, companies
    RESTART IDENTITY CASCADE`);

  const companyRows = await db
    .insert(companies)
    .values(SPONSOR_COMPANIES.map((name) => ({ name })))
    .returning({ id: companies.id, name: companies.name });
  const companyIdByName = new Map(companyRows.map((c) => [c.name, c.id]));
  console.log(`Inserted ${companyRows.length} sponsor companies`);

  await db.insert(users).values(
    USER_ROWS.map(([name, email, linkedin, title, company]) => {
      const sponsorId = companyIdByName.get(company) ?? null;
      return {
        username: name,
        email: email.trim() || null,
        linkedin: linkedin.trim() || null,
        title: title.trim() || null,
        role: "participant" as const,
        companyId: sponsorId,
        companyName: company.trim() || null,
      };
    })
  );
  console.log(`Inserted ${USER_ROWS.length} users`);

  await db.insert(events).values(
    EVENT_ROWS.map((ev) => ({
      slug: slugify(ev.name),
      name: ev.name,
      type: "hackathon" as const,
      description: ev.description,
      eventDate: ev.date,
      isPublished: true,
    }))
  );
  console.log(`Inserted ${EVENT_ROWS.length} events (published)`);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

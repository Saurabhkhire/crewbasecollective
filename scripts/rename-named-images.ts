/**
 * Rename company logos → companies/{company-name}.ext
 * Rename event covers → covers/{event-name}.ext
 * Update JSON references, remove unused orphan files, rebuild public assets.
 *
 * Usage: npx tsx scripts/rename-named-images.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sanitizeBasename } from "../server/src/image-names.js";
import { buildDerivedData } from "../server/src/data/repository.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const IMAGES = path.join(DATA, "images");
const COMPANIES_DIR = path.join(IMAGES, "companies");
const COVERS_DIR = path.join(IMAGES, "covers");
const EVENTS_DIR = path.join(DATA, "events");

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

function isImage(name: string) {
  return IMAGE_EXTS.has(path.extname(name).toLowerCase());
}

function normalizeExt(ext: string): string {
  const e = ext.toLowerCase();
  return e === ".jpeg" ? ".jpg" : e;
}

function uniqueStem(desired: string, taken: Set<string>): string {
  let stem = desired;
  let n = 2;
  while (taken.has(stem)) {
    stem = `${desired}-${n}`;
    n += 1;
  }
  taken.add(stem);
  return stem;
}

function absFromPublicUrl(url: string): string | null {
  if (!url?.startsWith("/images/")) return null;
  return path.join(IMAGES, url.slice("/images/".length));
}

function renameOrCopy(srcAbs: string, destAbs: string) {
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  if (path.resolve(srcAbs) === path.resolve(destAbs)) return;
  if (fs.existsSync(destAbs)) fs.unlinkSync(destAbs);
  fs.copyFileSync(srcAbs, destAbs);
}

type RenamePlan = {
  kind: "company" | "cover";
  label: string;
  oldUrl: string;
  newUrl: string;
  srcAbs: string;
  destAbs: string;
};

function planCompanyRenames(): RenamePlan[] {
  const file = path.join(DATA, "companies.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8")) as {
    companies: { id: string; name: string; logoUrl: string | null }[];
  };
  const taken = new Set<string>();
  const plans: RenamePlan[] = [];

  for (const company of data.companies) {
    const oldUrl = company.logoUrl?.trim();
    if (!oldUrl) continue;
    const srcAbs = absFromPublicUrl(oldUrl);
    if (!srcAbs || !fs.existsSync(srcAbs) || !fs.statSync(srcAbs).isFile()) {
      console.warn(`  skip company logo missing: ${company.name} → ${oldUrl}`);
      continue;
    }
    const ext = normalizeExt(path.extname(srcAbs));
    const stem = uniqueStem(sanitizeBasename(company.name), taken);
    const destAbs = path.join(COMPANIES_DIR, `${stem}${ext}`);
    const newUrl = `/images/companies/${stem}${ext}`;
    plans.push({
      kind: "company",
      label: company.name,
      oldUrl,
      newUrl,
      srcAbs,
      destAbs,
    });
  }
  return plans;
}

function planCoverRenames(): RenamePlan[] {
  const plans: RenamePlan[] = [];
  const taken = new Set<string>();
  for (const f of fs.readdirSync(EVENTS_DIR).filter((x) => x.endsWith(".json"))) {
    const record = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, f), "utf8")) as {
      event: { id: string; name: string; coverImageUrl: string | null };
    };
    const oldUrl = record.event.coverImageUrl?.trim();
    if (!oldUrl) continue;

    // Prefer existing covers/ file; also allow already-named event-folder cover.*
    let srcAbs = absFromPublicUrl(oldUrl);
    if (!srcAbs || !fs.existsSync(srcAbs) || !fs.statSync(srcAbs).isFile()) {
      console.warn(`  skip cover missing: ${record.event.name} → ${oldUrl}`);
      continue;
    }

    const ext = normalizeExt(path.extname(srcAbs));
    const stem = uniqueStem(sanitizeBasename(record.event.name), taken);
    const destAbs = path.join(COVERS_DIR, `${stem}${ext}`);
    const newUrl = `/images/covers/${stem}${ext}`;
    plans.push({
      kind: "cover",
      label: record.event.name,
      oldUrl,
      newUrl,
      srcAbs,
      destAbs,
    });
  }
  return plans;
}

function applyPlans(plans: RenamePlan[]) {
  // Stage via temp copies first so shared sources are preserved until all reads done
  const staged: { plan: RenamePlan; tempAbs: string }[] = [];
  const token = Date.now().toString(36);

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    const tempAbs = path.join(
      path.dirname(plan.destAbs),
      `__rename_${token}_${i}${path.extname(plan.destAbs)}`
    );
    fs.mkdirSync(path.dirname(tempAbs), { recursive: true });
    fs.copyFileSync(plan.srcAbs, tempAbs);
    staged.push({ plan, tempAbs });
  }

  for (const { plan, tempAbs } of staged) {
    if (fs.existsSync(plan.destAbs)) fs.unlinkSync(plan.destAbs);
    fs.renameSync(tempAbs, plan.destAbs);
    console.log(`  ${plan.kind}: ${plan.label}`);
    console.log(`    ${plan.oldUrl} → ${plan.newUrl}`);
  }
}

function updateCompanyJson(plans: RenamePlan[]) {
  const file = path.join(DATA, "companies.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8")) as {
    companies: { name: string; logoUrl: string | null; updatedAt?: string }[];
  };
  const byOld = new Map(plans.filter((p) => p.kind === "company").map((p) => [p.oldUrl, p]));
  let n = 0;
  for (const company of data.companies) {
    const plan = company.logoUrl ? byOld.get(company.logoUrl) : undefined;
    if (!plan) continue;
    company.logoUrl = plan.newUrl;
    company.updatedAt = new Date().toISOString();
    n += 1;
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`Updated ${n} company logo URLs`);
}

function updateEventJson(plans: RenamePlan[]) {
  const byOld = new Map(plans.filter((p) => p.kind === "cover").map((p) => [p.oldUrl, p]));
  // Also map by event name for plans (in case same old URL used by multiple — we created unique dests per event)
  const byLabel = new Map(plans.filter((p) => p.kind === "cover").map((p) => [p.label, p]));
  let n = 0;
  for (const f of fs.readdirSync(EVENTS_DIR).filter((x) => x.endsWith(".json"))) {
    const file = path.join(EVENTS_DIR, f);
    const record = JSON.parse(fs.readFileSync(file, "utf8")) as {
      event: {
        name: string;
        coverImageUrl: string | null;
        updatedAt?: string;
      };
    };
    const plan =
      byLabel.get(record.event.name) ||
      (record.event.coverImageUrl ? byOld.get(record.event.coverImageUrl) : undefined);
    if (!plan) continue;
    record.event.coverImageUrl = plan.newUrl;
    record.event.updatedAt = new Date().toISOString();
    fs.writeFileSync(file, JSON.stringify(record, null, 2) + "\n");
    n += 1;
  }
  console.log(`Updated ${n} event cover URLs`);
}

function pruneOrphans(keepUrls: Set<string>, relativeDir: "companies" | "covers") {
  const dir = path.join(IMAGES, relativeDir);
  if (!fs.existsSync(dir)) return;
  let removed = 0;
  for (const file of fs.readdirSync(dir)) {
    if (!isImage(file)) continue;
    if (file.startsWith("__rename_")) {
      fs.unlinkSync(path.join(dir, file));
      removed += 1;
      continue;
    }
    const url = `/images/${relativeDir}/${file}`.replace(/\\/g, "/");
    if (!keepUrls.has(url)) {
      fs.unlinkSync(path.join(dir, file));
      removed += 1;
      console.log(`  deleted unused ${relativeDir}/${file}`);
    }
  }
  console.log(`Removed ${removed} unused files from ${relativeDir}/`);
}

function main() {
  console.log("Planning renames…");
  const companyPlans = planCompanyRenames();
  const coverPlans = planCoverRenames();
  const plans = [...companyPlans, ...coverPlans];
  console.log(`Companies to rename: ${companyPlans.length}`);
  console.log(`Covers to rename: ${coverPlans.length}`);

  applyPlans(plans);
  updateCompanyJson(companyPlans);
  updateEventJson(coverPlans);

  const keep = new Set(plans.map((p) => p.newUrl));
  pruneOrphans(keep, "companies");
  pruneOrphans(keep, "covers");

  console.log("Rebuilding public data + images…");
  buildDerivedData();
  console.log("Done.");
}

main();

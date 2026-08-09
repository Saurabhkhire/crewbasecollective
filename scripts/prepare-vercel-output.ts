import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const src = resolve("client/dist");
const dest = resolve("dist");

if (!existsSync(src)) {
  console.error("client/dist not found after build");
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log("Copied client/dist → dist for Vercel");

/**
 * SPA deep-link fallbacks for when Vercel ignores catch-all rewrites
 * (common with Framework Preset "Other"). With cleanUrls, `events.html`
 * is served at `/events`; `events/slug.html` at `/events/slug`.
 */
const indexHtml = readFileSync(join(dest, "index.html"), "utf8");

function writeSpaHtml(relativeHtmlPath: string) {
  const file = join(dest, relativeHtmlPath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, indexHtml);
}

const staticRoutes = ["events", "sponsors", "people", "get-involved", "join"];
for (const route of staticRoutes) {
  writeSpaHtml(`${route}.html`);
}

const eventsIndexPath = join(dest, "data", "events-index.json");
if (existsSync(eventsIndexPath)) {
  const raw = JSON.parse(readFileSync(eventsIndexPath, "utf8")) as {
    events?: { slug?: string }[];
  };
  const slugs = (raw.events ?? [])
    .map((e) => e.slug)
    .filter((s): s is string => Boolean(s));
  for (const slug of slugs) {
    writeSpaHtml(join("events", `${slug}.html`));
  }
  console.log(`Wrote SPA fallbacks for ${staticRoutes.length} pages + ${slugs.length} events`);
} else {
  console.log(`Wrote SPA fallbacks for ${staticRoutes.length} pages (no events-index.json)`);
}

/**
 * Write SPA HTML fallbacks into Vite dist so deep links work on static hosts.
 * Plain Node (no tsx) so it runs when Vercel Root Directory is `client/`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const dest = resolve(process.argv[2] || "dist");

if (!existsSync(join(dest, "index.html"))) {
  console.error(`No index.html in ${dest}`);
  process.exit(1);
}

const indexHtml = readFileSync(join(dest, "index.html"), "utf8");

function write(relativePath) {
  const file = join(dest, relativePath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, indexHtml);
}

const staticRoutes = ["events", "sponsors", "people", "get-involved", "join"];
for (const route of staticRoutes) {
  write(`${route}.html`);
  write(join(route, "index.html"));
}

let eventCount = 0;
const eventsIndexPath = join(dest, "data", "events-index.json");
if (existsSync(eventsIndexPath)) {
  const raw = JSON.parse(readFileSync(eventsIndexPath, "utf8"));
  for (const slug of (raw.events || []).map((e) => e.slug).filter(Boolean)) {
    write(join("events", `${slug}.html`));
    write(join("events", slug, "index.html"));
    eventCount += 1;
  }
}

console.log(
  `SPA fallbacks → ${dest}: ${staticRoutes.length} pages + ${eventCount} events`
);

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const clientDist = resolve("client/dist");
const vercelDist = resolve("dist");

if (!existsSync(clientDist)) {
  console.error("client/dist not found after build");
  process.exit(1);
}

/**
 * Write SPA deep-link HTML into a dist folder.
 * Vercel with Framework "vite" may serve client/dist; our outputDirectory is root dist.
 * Write to both so /events and /events/:slug resolve as real files.
 */
function writeSpaFallbacks(dest: string) {
  const indexHtml = readFileSync(join(dest, "index.html"), "utf8");

  function write(relativePath: string) {
    const file = join(dest, relativePath);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, indexHtml);
  }

  const staticRoutes = ["events", "sponsors", "people", "get-involved", "join"];
  for (const route of staticRoutes) {
    // /events.html and /events/index.html (covers cleanUrls on/off + trailing slash)
    write(`${route}.html`);
    write(join(route, "index.html"));
  }

  const eventsIndexPath = join(dest, "data", "events-index.json");
  let eventCount = 0;
  if (existsSync(eventsIndexPath)) {
    const raw = JSON.parse(readFileSync(eventsIndexPath, "utf8")) as {
      events?: { slug?: string }[];
    };
    const slugs = (raw.events ?? [])
      .map((e) => e.slug)
      .filter((s): s is string => Boolean(s));
    for (const slug of slugs) {
      write(join("events", `${slug}.html`));
      write(join("events", slug, "index.html"));
    }
    eventCount = slugs.length;
  }

  console.log(
    `SPA fallbacks in ${dest}: ${staticRoutes.length} pages + ${eventCount} events`
  );
}

writeSpaFallbacks(clientDist);

rmSync(vercelDist, { recursive: true, force: true });
cpSync(clientDist, vercelDist, { recursive: true });
console.log("Copied client/dist → dist for Vercel");

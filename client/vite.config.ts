import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";

/** Copy index.html to SPA routes so deep links work even if rewrites are ignored. */
function spaFallbacks(): Plugin {
  return {
    name: "spa-fallbacks",
    closeBundle() {
      const dest = path.resolve(__dirname, "dist");
      const indexPath = path.join(dest, "index.html");
      if (!existsSync(indexPath)) return;

      const indexHtml = readFileSync(indexPath, "utf8");
      const write = (relativePath: string) => {
        const file = path.join(dest, relativePath);
        mkdirSync(path.dirname(file), { recursive: true });
        writeFileSync(file, indexHtml);
      };

      const staticRoutes = [
        "events",
        "sponsors",
        "people",
        "get-involved",
        "join",
      ];
      for (const route of staticRoutes) {
        write(`${route}.html`);
        write(path.join(route, "index.html"));
      }

      let eventCount = 0;
      const eventsIndexPath = path.join(dest, "data", "events-index.json");
      if (existsSync(eventsIndexPath)) {
        const raw = JSON.parse(readFileSync(eventsIndexPath, "utf8")) as {
          events?: { slug?: string }[];
        };
        for (const slug of (raw.events ?? [])
          .map((e) => e.slug)
          .filter(Boolean) as string[]) {
          write(path.join("events", `${slug}.html`));
          write(path.join("events", slug, "index.html"));
          eventCount += 1;
        }
      }

      console.log(
        `SPA fallbacks: ${staticRoutes.length} pages + ${eventCount} events`
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), spaFallbacks()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      // /images is served from client/public/images (copied on CMS save / build:data)
    },
  },
});

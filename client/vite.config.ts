import { defineConfig, loadEnv, type Plugin } from "vite";
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

      // /aim-hack-visual (separate static site in public/aim-hack-visual): no rewrites needed
      const aimIndex = path.join(dest, "aim-hack-visual", "index.html");
      if (existsSync(aimIndex)) {
        writeFileSync(path.join(dest, "aim-hack-visual.html"), readFileSync(aimIndex));
        const redirect = `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/aim-hack-visual/"><link rel="canonical" href="/aim-hack-visual/"><script>location.replace("/aim-hack-visual/"+location.hash)</script><a href="/aim-hack-visual/">Moved to /aim-hack-visual</a>`;
        mkdirSync(path.join(dest, "aimultiplayerhackathon-visual"), { recursive: true });
        writeFileSync(path.join(dest, "aimultiplayerhackathon-visual.html"), redirect);
        writeFileSync(path.join(dest, "aimultiplayerhackathon-visual", "index.html"), redirect);
      }
    },
  };
}

/**
 * Dev only: serve /aim-hack-visual (static site in public/aim-hack-visual) and run its
 * chat function (api/aim-hack-chat.ts) like Vercel does. Env from client/.env.local.
 */
function aimHackVisualDev(): Plugin {
  const BASE = "/aim-hack-visual";
  return {
    name: "aim-hack-visual-dev",
    apply: "serve",
    configureServer(server) {
      const env = loadEnv(server.config.mode, __dirname, "");
      for (const k of ["OPENAI_API_KEY", "OPENAI_MODEL", "AIMP_ALLOWED_ORIGINS"]) {
        if (env[k] && !process.env[k]) process.env[k] = env[k];
      }
      server.middlewares.use(async (req: any, res: any, next) => {
        const pathname = (req.url || "").split("?")[0];
        if (pathname === BASE || pathname === BASE + "/") {
          req.url = BASE + "/index.html";
          return next();
        }
        if (pathname !== "/api/aim-hack-chat") return next();
        let raw = "";
        for await (const c of req) raw += c;
        try { req.body = raw ? JSON.parse(raw) : undefined; } catch { req.body = raw; }
        res.status = (code: number) => { res.statusCode = code; return res; };
        res.json = (obj: unknown) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(obj)); };
        const mod = await server.ssrLoadModule(path.resolve(__dirname, "api/aim-hack-chat.ts"));
        return mod.default(req, res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), spaFallbacks(), aimHackVisualDev()],
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

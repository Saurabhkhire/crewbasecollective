/**
 * Vite plugin for the SEPARATE "AI Multiplayer Hackathon" site at /aim-hack-visual.
 * It is not part of the Crewbase Collective React app; see docs/AIM_HACK_VISUAL.md.
 *
 * Everything the hackathon site needs from the main app lives in these places only:
 *   client/public/aim-hack-visual/   the site itself (static HTML/CSS/JS)
 *   client/api/aim-hack-chat.ts       its AI endpoint (Vercel function)
 *   client/aim-hack-visual.vite.ts    this file (dev server + build extras)
 *   client/.env.aim-hack.example      its key template (real keys go in client/.env.local)
 *   docs/AIM_HACK_VISUAL.md           its docs
 * To remove the site: delete those, and the two marked lines in client/vite.config.ts.
 *
 * What this plugin does:
 *   dev   → serves /aim-hack-visual(/) as its index.html and runs /api/aim-hack-chat locally,
 *           loading OPENAI_* / ADAL_* / AIMP_* keys from client/.env.local
 *   build → writes dist/aim-hack-visual.html, and redirect pages for the old URL
 *           /aimultiplayerhackathon-visual (Vercel serves them as static files; no rewrites)
 */
import path from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { loadEnv, type Plugin } from "vite";

const BASE = "/aim-hack-visual";
const API = "/api/aim-hack-chat";

export function aimHackVisual(clientDir: string): Plugin {
  let outDir = path.resolve(clientDir, "dist");
  return {
    name: "aim-hack-visual",
    configResolved(cfg) {
      outDir = path.resolve(cfg.root, cfg.build.outDir);
    },
    configureServer(server) {
      const env = loadEnv(server.config.mode, clientDir, "");
      for (const k of Object.keys(env)) {
        if (/^(OPENAI_|ADAL_|AIMP_)/.test(k) && env[k] && !process.env[k]) process.env[k] = env[k];
      }
      server.middlewares.use(async (req: any, res: any, next) => {
        const pathname = (req.url || "").split("?")[0];
        if (pathname === BASE || pathname === BASE + "/") {
          req.url = BASE + "/index.html";
          return next();
        }
        if (pathname !== API) return next();
        let raw = "";
        for await (const c of req) raw += c;
        try { req.body = raw ? JSON.parse(raw) : undefined; } catch { req.body = raw; }
        res.status = (code: number) => { res.statusCode = code; return res; };
        res.json = (obj: unknown) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(obj)); };
        const mod = await server.ssrLoadModule(path.resolve(clientDir, "api/aim-hack-chat.ts"));
        return mod.default(req, res);
      });
    },
    closeBundle() {
      const index = path.join(outDir, "aim-hack-visual", "index.html");
      if (!existsSync(index)) return;
      writeFileSync(path.join(outDir, "aim-hack-visual.html"), readFileSync(index));
      const redirect = `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${BASE}/"><link rel="canonical" href="${BASE}/"><script>location.replace("${BASE}/"+location.hash)</script><a href="${BASE}/">Moved to ${BASE}</a>`;
      mkdirSync(path.join(outDir, "aimultiplayerhackathon-visual"), { recursive: true });
      writeFileSync(path.join(outDir, "aimultiplayerhackathon-visual.html"), redirect);
      writeFileSync(path.join(outDir, "aimultiplayerhackathon-visual", "index.html"), redirect);
    },
  };
}

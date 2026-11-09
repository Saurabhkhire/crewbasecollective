import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const clientDist = resolve("client/dist");
const vercelDist = resolve("dist");

if (!existsSync(clientDist)) {
  console.error("client/dist not found after build");
  process.exit(1);
}

rmSync(vercelDist, { recursive: true, force: true });
cpSync(clientDist, vercelDist, { recursive: true });
console.log("Copied client/dist → dist for Vercel");

// Standalone static site served at /aimultiplayerhackathon-visual (no build step).
const aimpSrc = resolve("aimultiplayerhackathon-visual/public/aimultiplayerhackathon-visual");
if (existsSync(aimpSrc)) {
  cpSync(aimpSrc, resolve(vercelDist, "aimultiplayerhackathon-visual"), { recursive: true });
  console.log("Copied aimultiplayerhackathon-visual → dist/aimultiplayerhackathon-visual");
}

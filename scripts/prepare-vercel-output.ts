import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const clientDist = resolve("client/dist");
const vercelDist = resolve("dist");

if (!existsSync(clientDist)) {
  console.error("client/dist not found after build");
  process.exit(1);
}

const spa = spawnSync(
  process.execPath,
  [resolve("client/scripts/write-spa-fallbacks.mjs"), clientDist],
  { stdio: "inherit" }
);
if (spa.status !== 0) process.exit(spa.status || 1);

rmSync(vercelDist, { recursive: true, force: true });
cpSync(clientDist, vercelDist, { recursive: true });
console.log("Copied client/dist → dist for Vercel");

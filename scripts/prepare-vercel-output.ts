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

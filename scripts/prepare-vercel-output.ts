import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const src = resolve("client/dist");
const dest = resolve("dist");

if (!existsSync(src)) {
  console.error("client/dist not found after build");
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log("Copied client/dist → dist for Vercel");

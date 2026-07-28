import { execSync } from "node:child_process";

const message =
  process.argv.slice(2).join(" ").trim() || "Update site content";

function run(cmd: string) {
  execSync(cmd, { stdio: "inherit" });
}

console.log("Rebuilding client/public from data/ …");
run("npm run build:data");

console.log("Staging content …");
run("git add data client/public/data client/public/images");

const changes = execSync("git status --porcelain -- data client/public/data client/public/images", {
  encoding: "utf8",
}).trim();

if (!changes) {
  console.log("No content changes to publish.");
  process.exit(0);
}

console.log("Changes to publish:\n", changes, "\n");
run(`git commit -m "${message.replace(/"/g, '\\"')}"`);
run("git push origin main");
console.log("Published — Vercel will redeploy from the new commit.");

import { execFileSync } from "node:child_process";
import fs from "node:fs";

const [repoName = "pyrimid-earn-agent", payoutWallet] = process.argv.slice(2);

if (!payoutWallet) {
  console.error("Usage: npm run publish:github-pages -- <repo-name> <base-usdc-wallet>");
  process.exit(1);
}

if (!/^0x[a-fA-F0-9]{40}$/.test(payoutWallet)) {
  console.error("Payout wallet must look like an EVM address, for example 0x...");
  process.exit(1);
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
  })?.trim();
}

function capture(command, args) {
  return run(command, args, { capture: true });
}

try {
  capture("gh", ["auth", "status"]);
} catch {
  console.error("GitHub CLI is not logged in. Run `gh auth login` first.");
  process.exit(1);
}

const owner = capture("gh", ["api", "user", "-q", ".login"]);
const repoFullName = `${owner}/${repoName}`;
const publishUrl = `https://${owner}.github.io/${repoName}`;
const sourceRepo = `https://github.com/${repoFullName}`;

if (!fs.existsSync(".git")) {
  run("git", ["init"]);
}

run("node", [
  "scripts/finalize.mjs",
  publishUrl,
  payoutWallet,
  sourceRepo,
  capture("git", ["rev-parse", "--short", "HEAD"]),
]);

run("npm", ["run", "check"]);
run("git", ["add", "."]);
run("git", ["commit", "-m", "Finalize Pyrimid bounty submission"]);

try {
  capture("gh", ["repo", "view", repoFullName, "--json", "name"]);
} catch {
  run("gh", ["repo", "create", repoFullName, "--public", "--source", ".", "--remote", "origin"]);
}

const remotes = capture("git", ["remote"]);
if (!remotes.split(/\s+/).includes("origin")) {
  run("git", ["remote", "add", "origin", `https://github.com/${repoFullName}.git`]);
}

run("git", ["branch", "-M", "main"]);
run("git", ["push", "-u", "origin", "main"]);

try {
  run("gh", ["api", "--method", "POST", `/repos/${repoFullName}/pages`, "-f", "build_type=workflow"]);
} catch {
  run("gh", ["api", "--method", "PUT", `/repos/${repoFullName}/pages`, "-f", "build_type=workflow"]);
}

const commit = capture("git", ["rev-parse", "--short", "HEAD"]);
console.log(JSON.stringify({
  ok: true,
  repo: sourceRepo,
  publish_url: publishUrl,
  commit,
  next: "Wait for the GitHub Pages workflow to finish, then submit SUBMISSION.md to pyrimid-ai/pyrimid.",
}, null, 2));

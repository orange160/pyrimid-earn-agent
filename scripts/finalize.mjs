import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const values = args.filter((arg) => arg !== "--dry-run");
const [publishUrl, payoutWallet, sourceRepo = "SOURCE_REPO_TO_BE_FILLED", commit = "COMMIT_TO_BE_FILLED"] = values;

if (!publishUrl || !payoutWallet) {
  console.error("Usage: npm run finalize -- <publish-url> <base-usdc-wallet>");
  process.exit(1);
}

if (!/^https:\/\/[^/\s]+/.test(publishUrl)) {
  console.error("Publish URL must be an https URL.");
  process.exit(1);
}

if (!/^0x[a-fA-F0-9]{40}$/.test(payoutWallet)) {
  console.error("Payout wallet must look like an EVM address, for example 0x...");
  process.exit(1);
}

const root = path.resolve(new URL("..", import.meta.url).pathname);
const files = [
  ".well-known/agent.json",
  ".well-known/x402.json",
  "agents.txt",
  "llms.txt",
  "README.md",
  "SUBMISSION.md",
];

for (const file of files) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    continue;
  }
  const next = fs.readFileSync(fullPath, "utf8")
    .replaceAll("PUBLISH_URL_TO_BE_FILLED", publishUrl.replace(/\/$/, ""))
    .replaceAll("BASE_USDC_WALLET_TO_BE_FILLED", payoutWallet)
    .replaceAll("SOURCE_REPO_TO_BE_FILLED", sourceRepo)
    .replaceAll("COMMIT_TO_BE_FILLED", commit);
  if (!dryRun) {
    fs.writeFileSync(fullPath, next);
  }
}

console.log(JSON.stringify({
  ok: true,
  dry_run: dryRun,
  publish_url: publishUrl.replace(/\/$/, ""),
  payout_wallet: payoutWallet,
  updated_files: files.filter((file) => fs.existsSync(path.join(root, file))).length,
}, null, 2));

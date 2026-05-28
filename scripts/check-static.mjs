import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const requiredFiles = [
  "index.html",
  ".well-known/agent.json",
  ".well-known/x402.json",
  "agents.txt",
  "llms.txt",
  "README.md",
  "SUBMISSION.md",
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  throw new Error(`Missing required files: ${missing.join(", ")}`);
}

const contents = Object.fromEntries(
  requiredFiles.map((file) => [file, fs.readFileSync(path.join(root, file), "utf8")]),
);

const checks = [
  ["SDK import", contents["index.html"].includes("@pyrimid/sdk@0.2.6")],
  ["catalog URL", contents["index.html"].includes("https://pyrimid.ai/api/v1/catalog")],
  ["affiliate id", Object.values(contents).every((text) => text.includes("earn-codex-agent"))],
  ["agent json parses", JSON.parse(contents[".well-known/agent.json"])],
  ["x402 json parses", JSON.parse(contents[".well-known/x402.json"])],
];

const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length) {
  throw new Error(`Failed checks: ${failed.join(", ")}`);
}

const unresolved = Object.values(contents).some((text) =>
  text.includes("BASE_USDC_WALLET_TO_BE_FILLED") ||
  text.includes("PUBLISH_URL_TO_BE_FILLED") ||
  text.includes("SOURCE_REPO_TO_BE_FILLED") ||
  text.includes("COMMIT_TO_BE_FILLED"),
);

const response = await fetch("https://pyrimid.ai/api/v1/catalog", {
  headers: { accept: "application/json" },
});
if (!response.ok) {
  throw new Error(`Catalog HTTP ${response.status}`);
}
const catalog = await response.json();
const products = Array.isArray(catalog.products) ? catalog.products.length : 0;
if (!products) {
  throw new Error("Catalog returned no products");
}

console.log(JSON.stringify({
  ok: !unresolved,
  unresolved_placeholders: unresolved,
  sdk: "@pyrimid/sdk@0.2.6",
  affiliate_id: "earn-codex-agent",
  catalog_products: products,
  checked_files: requiredFiles.length,
}, null, 2));

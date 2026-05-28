# Earn Codex Pyrimid Recommender

Static buyer-agent integration proof for the Pyrimid job #20 bounty.

## Setup

1. Run `npm run finalize -- <publish-url> <base-usdc-wallet> <source-repo> <commit>`.
2. Deploy on Vercel for live `/api/catalog`, or any static host for the bundled catalog snapshot fallback.
3. Run `npm run check` and submit the live URLs to `pyrimid-ai/pyrimid`.

## What It Does

- Imports `PyrimidResolver` from `https://esm.sh/@pyrimid/sdk@0.2.6/resolver?bundle`.
- Queries the live catalog through `/api/catalog`, a Vercel function that proxies `https://pyrimid.ai/api/v1/catalog`.
- Falls back to `catalog-snapshot.json` on static hosts that cannot run the proxy.
- Ranks products for a buyer need and displays endpoint, network, price, split, and `X-Affiliate-ID: earn-codex-agent`.
- Exposes `.well-known/agent.json`, `.well-known/x402.json`, `agents.txt`, and `llms.txt`.

## Safety

This is recommendation/discovery only. It does not request private keys, seed
phrases, wallet credentials, payment credentials, OAuth tokens, or API keys.

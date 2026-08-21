# Token Aggregator API usage

How Core Mobile talks to `core-token-aggregator`, which endpoints are allowed,
and why the app is not (yet) 100% on the v2 API. Written during CP-14936
(2026-08); update the "Revisit" section when the backend ships new v2 routes.

## Policy

**Never fetch a whole token catalog.** The legacy full-list routes
(`/v1/tokens` via the proxy's `/tokens?evmChainId=` and `/solana-tokens`, and
the proxy `/tokenlist` route) return ~57k rows for C-Chain and were the root
cause of repeated memory/render regressions (CP-14934, CP-14918, CP-14936).
`module.getTokens()` from the vm-modules wraps exactly those routes — do not
add new callers. Resolve tokens with the targeted endpoints below instead.

## What mobile uses, and where

| Endpoint | Used for | Call sites |
| --- | --- | --- |
| `GET /v2/tokens` | Enumeration + server-side search (paginated, `caip2Id`/`page`/`limit`, `address`/`keyword` filters) | Swap target-asset search (`fetchMarkrTargetChainAssets`), Meld buy-flow token picker |
| `POST /v1/token/lookup` | Exact resolution: batch of `{caip2Id, address}` pairs or `internalId`s | `useTokenLookup` consumers: add-custom-token existence check, Meld USDC pin, recurring-swap schedule rows, DeFi-market token resolution, activity unknown-SPL symbols, Fusion initial tokens |
| `POST /v1/token/lookupWithPrice` | Resolution + price | `useTokensWithPrice` |
| `GET /v1/watchlist/markets` | Market/price data for watchlist | `WatchlistService` |

Client wiring: `app/utils/api/clients/aggregatedTokensApiClient.ts`
(`tokenAggregatorApi`, AppCheck-authenticated via `appCheckFetch`), generated
SDK under `app/utils/api/generated/tokenAggregator/`.

## Why not 100% v2

Verified against the live staging aggregator on 2026-08-12 (on-device probes
through the app's AppCheck auth). v2 today is a **catalog/discovery** API; the
targeted v1 routes are the **resolution/pricing** API and have no v2
equivalent:

1. **No batch lookup on v2.** `/v2/tokens`'s `address` filter takes one
   address per request; `/v1/token/lookup` accepts N tokens in one POST.
   `ActivityService` uses that batching today (one POST for a transaction
   batch's unknown mints), and `useTokenLookup` coalesces its per-token React
   Query entries into one batched POST per tick
   (`common/utils/tokenLookupQueue.ts`, CP-14963; chunked above 500 tokens).
   Moving those consumers to v2 would turn one request into N.
2. **No `internalId` resolution on v2.** Cross-chain canonical tokens (e.g.
   USDC, BTC.b) are addressed by `internalId`; only the lookup endpoint
   accepts those. v2 filters are address/symbol/name only.
3. **No price data on v2.** `/v2/tokens` items carry no price fields;
   `lookupWithPrice` and `watchlist/markets` are v1-only.

Migrating the remaining v1 usage therefore requires backend work (v2
batch-lookup with internalId support, v2 price/markets), not app work.

## Shape and casing contracts (probe-verified)

- **Lookup response keys** (`data.data`) are `"{caip2Id}-{address}"`, where the
  server lowercases EVM (`eip155:`) addresses but **preserves case for Solana**
  caip2Ids and base58 addresses. A lowercased Solana address returns no result
  at all. `normalizeLookupAddress` / `tokenLookupKey` in
  `app/new/common/utils/tokenLookup.ts` are the single source of truth for
  this — never hand-build these keys.
- **Lookup entries** carry decimals under `meta.decimals[caip2Id]` and logo
  under `meta.logoUri`; there is no `contractType`.
- **v2 token items** have no numeric `chainId` (join
  `networks[networkCaip2Id].chainId` from the same response), no `color`
  field, and a nullable `contractType` (null on native rows).

## Revisit when

- Backend ships v2 equivalents for batch lookup (with `internalId`) or
  price/markets — move the corresponding call sites and update this doc.
- Backend announces deprecation of the targeted v1 routes — that becomes a
  forcing function for the above.

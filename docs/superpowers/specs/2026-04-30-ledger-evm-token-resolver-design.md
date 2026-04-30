# Ledger EVM Token Resolver

**Date:** 2026-04-30
**Ticket:** CP-14113 — Ledger unable to swap on Aave Ethereum
**Status:** Design

## Problem

When Ledger users attempt to swap on Aave (Ethereum), the transaction fails because the Ledger device cannot clear-sign it. The root cause is a gap in ERC-20 token resolution:

1. The swap flow (via MARKR aggregator) generates transactions targeting Aave token contracts (e.g., aTokens like `aEthDAI`)
2. Before signing, `ledgerService.resolveTransaction()` attempts to fetch signed token metadata from:
   - **Dynamic CAL**: Ledger's CDN at `https://cdn.live.ledger.com/cryptoassets/evm/{chainId}/erc20-signatures.json`
   - **Static fallback**: Bundled `@ledgerhq/cryptoassets-evm-signatures` package
3. Neither source contains the aToken contract addresses, so `erc20Tokens` in the resolution is empty
4. Without token metadata, the Ledger device cannot display token info and falls back to blind signing — which may be disabled on newer firmware, causing the transaction to fail entirely

**Key finding**: Ledger's CAL API (`crypto-assets-service.api.ledger.com`) **does** have signed descriptors for Aave aTokens. The data exists — it's just not reachable through the CDN/static paths that `resolveTransaction` uses.

## Solution

Create a `LedgerEvmTokenResolver` service that queries Ledger's CAL API directly as a fallback when `resolveTransaction` returns empty `erc20Tokens` for ERC-20 transactions. If the CAL API also lacks the token, fall back gracefully to blind signing with an explicit user warning.

## Architecture

### Flow Overview

```
ApprovalScreen (tokenApprovals available)
  |
  +-- prefetchEvmTokenDescriptor(contractAddress, chainId)    <-- background, populates cache
        +-- LedgerEvmTokenResolver.resolve() --> cache

getEvmSignature / getCChainSignature (LedgerWallet.ts)
  |
  +-- 1. resolveTransaction()                                 <-- existing (CDN + static bundle)
  |      |
  |      +-- erc20Tokens empty AND tx has ERC-20 selector?
  |           |
  |           +-- YES: LedgerEvmTokenResolver.resolve()       <-- cache hit if prefetched
  |           |         +-- found? inject into resolution.erc20Tokens
  |           |         +-- not found? log warning, proceed with empty resolution
  |           |
  |           +-- NO: continue (resolution already has token data)
  |
  +-- 2. If resolution still empty --> blind signing (user sees warning on review screen)
  |
  +-- signTransaction(path, tx, resolution)
```

### Components

#### 1. LedgerEvmTokenResolver (NEW)

**File:** `app/services/ledger/LedgerEvmTokenResolver.ts`

Responsibilities:
- Query Ledger's CAL API for signed ERC-20 token descriptors by contract address + chain ID
- Build the device-compatible descriptor format from the API response
- Maintain an in-memory LRU cache of resolved descriptors
- Provide a prefetch method for background resolution

**Public API:**
```typescript
class LedgerEvmTokenResolver {
  /**
   * Resolve a signed ERC-20 token descriptor from Ledger's CAL API.
   * Returns the hex-encoded descriptor string compatible with
   * provideERC20TokenInformation(), or undefined if not found.
   */
  static async resolve(
    contractAddress: string,
    chainId: number
  ): Promise<string | undefined>

  /**
   * Prefetch and cache a token descriptor. Fire-and-forget.
   * Called from the approval screen when tokenApprovals are available.
   */
  static prefetch(contractAddress: string, chainId: number): void

  /**
   * Clear the in-memory cache. Useful for testing.
   */
  static clearCache(): void
}
```

#### 2. LedgerWallet Integration

**File:** `app/services/wallet/LedgerWallet.ts`

Changes to `getEvmSignature()` and `getCChainSignature()`:

**Base implementation (must-have):**
- After `resolveTransaction()`, check if `resolution.erc20Tokens` is empty
- If empty, parse the transaction to extract the target contract address and chain ID
- Call `LedgerEvmTokenResolver.resolve()` (likely a cache hit from prefetch)
- If a descriptor is returned, inject it into `resolution.erc20Tokens`
- If not, log a warning and proceed with blind signing

**Parallel optimization (nice-to-have):**
- Fire `LedgerEvmTokenResolver.resolve()` in parallel with `resolveTransaction()`
- Merge results: if `resolveTransaction` already found the token, discard the CAL result
- This eliminates any added latency on cache miss but adds implementation complexity

#### 3. Approval Screen Prefetch Hook

**File:** `app/new/features/approval/screens/ApprovalScreen/` (or a hook therein)

- When `displayData.tokenApprovals` is available, extract contract addresses and chain ID
- Call `LedgerEvmTokenResolver.prefetch()` for each token approval
- This runs in the background while the user reviews the approval

## Descriptor Format

### CAL API Response

```
GET https://crypto-assets-service.api.ledger.com/v1/tokens
  ?output=id,blockchain_name,contract_address,ticker,decimals,chain_id,descriptor
  &blockchain_name=ethereum
  &contract_address=0x018008bfb33d285247A21d44E50697654f754e63
```

Response:
```json
[{
  "descriptor": {
    "data": "61457468444149018008bfb33d285247a21d44e50697654f754e630000001200000001",
    "descriptorType": "token",
    "signatures": {
      "prod": "304402203d9cf533c627d498..."
    }
  }
}]
```

### API Data Format

The `descriptor.data` field is hex-encoded:
```
[ticker: N bytes][contractAddress: 20 bytes][decimals: 4 bytes BE][chainId: 4 bytes BE]
```

Ticker length is derived: `(data.length / 2) - 28` (28 = 20 addr + 4 decimals + 4 chainId)

### Device-Compatible Format

`provideERC20TokenInformation()` expects:
```
[tickerLength: 1 byte][ticker: N bytes][contractAddress: 20 bytes][decimals: 4 bytes BE][chainId: 4 bytes BE][signature: DER-encoded ECDSA]
```

**Build formula:** `tickerLengthHex + descriptor.data + descriptor.signatures.prod`

Where `tickerLengthHex` is a single byte encoding the ticker length (e.g., `07` for "aEthDAI").

### ERC-20 Selector Detection

To determine if a transaction involves ERC-20 operations, check the first 4 bytes of `tx.data` against known selectors (from `@ledgerhq/evm-tools/selectors`):

- `0x095ea7b3` — `approve(address,uint256)`
- `0xa9059cbb` — `transfer(address,uint256)`
- `0x23b872dd` — `transferFrom(address,address,uint256)`

## Caching Strategy

### In-Memory LRU Cache

- **Key:** `{chainId}:{contractAddress.toLowerCase()}`
- **Value:** hex-encoded descriptor string (or `null` for confirmed-missing tokens)
- **Max entries:** 100 (LRU eviction)
- **TTL:** 24 hours (token metadata changes very rarely)
- **Negative caching:** Cache `null` for tokens the API doesn't have, to avoid repeated requests for truly unknown tokens. TTL for negative entries: 1 hour (shorter, in case the token gets added to CAL).

### Why Cache

Aave users repeatedly interact with the same aTokens. Without caching, every swap would hit the CAL API while the Ledger is connected, adding latency to an already slow BLE signing flow.

## Security Analysis

### 1. Descriptor Signature Verification (Low Risk)

The Ledger device verifies every token descriptor's cryptographic signature against its embedded root CA. Even if the CAL API were compromised or MITM'd, a tampered descriptor would be **rejected by the device**. This is the same trust model as the existing CDN-based resolution.

### 2. Privacy (Medium Risk)

Each fallback query sends the contract address + chain ID to Ledger's API. This reveals what tokens the user interacts with. Mitigations:
- `resolveTransaction()` already downloads the full chain's token blob from Ledger's CDN — the direct query actually leaks **less** (one address vs. full list download)
- Prefetching happens at approval-screen time, not at signing time, so it doesn't correlate with the exact signing moment
- This is documented as a known trade-off

### 3. Network in Signing Path (Medium Risk)

Adding an HTTP call while the Ledger device is connected via BLE introduces timeout and failure risks. Mitigations:
- **Prefetch at approval screen** — by the time signing starts, the descriptor is cached
- **3-second timeout cap** — never block the signing flow waiting for the API
- **Parallel execution** — CAL query runs alongside `resolveTransaction`, not after it
- **Graceful degradation** — if the query fails, proceed with existing resolution (possibly empty)

### 4. API Response Validation (Low Risk)

Malformed API responses could build invalid descriptors. Mitigations:
- Validate response is a non-empty array with expected structure
- Validate `descriptor.data` hex string decodes to at least 29 bytes (minimum 1-char ticker + 20 addr + 4 decimals + 4 chainId)
- Validate `descriptor.signatures.prod` is present and non-empty
- Validate computed ticker length is reasonable (1-11 characters)
- On any validation failure, return `undefined` (treat as not found)

### 5. Blind Signing Fallback (Inherent Risk)

When both resolution sources fail, the user must blind-sign. This is inherently less secure — the user cannot verify what they're signing on the device screen. Mitigations:
- **Never silently fall back** — show an explicit warning in the app UI explaining what blind signing means
- The warning should be shown as a banner/alert on the existing Ledger approval review screen, explaining: "Your Ledger device doesn't recognize this token. You'll need to verify the transaction details in the app and enable blind signing on your device to proceed."
- Log the unresolved contract address via `Logger.warn` for monitoring/debugging

## Optimization Summary

| Optimization | Priority | Impact |
|---|---|---|
| In-memory LRU cache (24h TTL, 100 entries) | Must-have | Eliminates repeated API calls; sub-ms resolution for cached tokens |
| 3-second timeout cap on CAL query | Must-have | Prevents API latency from blocking signing flow |
| Prefetch at approval screen | Should-have | Warms cache before signing; eliminates latency in happy path |
| Parallel resolution (alongside resolveTransaction) | Nice-to-have | Eliminates added latency even on cache miss |
| Negative caching (1h TTL) | Should-have | Avoids repeated queries for truly unknown tokens |

## Scope

### In Scope

- ERC-20 token resolution for approve/transfer/transferFrom transactions
- Both EVM (Ethereum app) and C-Chain (Avalanche app) signing paths
- In-memory caching with LRU eviction
- Prefetch from approval screen
- Blind signing fallback with user warning
- Unit tests for descriptor building, caching, and integration

### Out of Scope

- **Swap router plugin resolution** — unknown router contracts (e.g., MARKR router) require Ledger external plugin registration, which is a separate mechanism and a separate ticket
- **Persistent cache** — in-memory is sufficient; the data is small and cheap to refetch
- **Custom trust service for truly unknown tokens** — if Ledger's CAL API doesn't have the token, we accept blind signing. An on-the-fly signing service (like Solana's trusted name flow) would be a future enhancement if Ledger provides an EVM endpoint for it

## Files Changed

| File | Type | Description |
|---|---|---|
| `app/services/ledger/LedgerEvmTokenResolver.ts` | New | CAL API client, descriptor builder, LRU cache |
| `app/services/wallet/LedgerWallet.ts` | Modified | Integrate resolver into `getEvmSignature` and `getCChainSignature` |
| `app/new/features/approval/` (hook or screen) | Modified | Add prefetch call when tokenApprovals are available |
| `app/services/ledger/LedgerEvmTokenResolver.test.ts` | New | Unit tests |

## Chain ID to Blockchain Name Mapping

The CAL API uses `blockchain_name` (e.g., "ethereum") rather than numeric chain IDs for the query parameter. A mapping is needed:

| Chain ID | blockchain_name |
|---|---|
| 1 | ethereum |
| 43114 | avalanche |
| 56 | bsc |
| 137 | polygon |
| 42161 | arbitrum |
| 10 | optimism |
| 8453 | base |

If a chain ID is not in the mapping, skip the CAL API query (the token is on an unsupported chain and won't be in the API anyway).

Note: this mapping should be verified against the CAL API's actual supported blockchain names before implementation.

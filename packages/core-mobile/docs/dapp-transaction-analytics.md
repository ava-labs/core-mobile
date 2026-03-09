# Dapp Transaction Analytics — Cross-Platform Comparison

## Overview

Core Mobile tracks PostHog events when users approve and complete transactions originating from third-party dapps (via WalletConnect). These events drive the **MTU (Monthly Transacting Users)** metric.

This document compares the current state of dapp transaction analytics across **Core Mobile**, **Core Extension**, and **Core Web**.

---

## Event Naming Convention

```
{rpc_method}_{stage}
```

- **`{rpc_method}`** — the exact RPC method string (e.g. `eth_sendTransaction`)
- **`{stage}`** — `success` (txHash returned / submitted to mempool), `confirmed` (finalized on-chain), or `failed` (submission error or on-chain revert)

| Stage | Meaning | Mobile | Extension |
|---|---|---|---|
| `_success` | txHash returned from chain (PENDING state) | ✅ | ✅ (avalanche only) |
| `_confirmed` | Transaction finalized on-chain | ✅ | ✅ (avalanche only) |
| `_failed` | Submission error or on-chain revert | ✅ | ✅ (avalanche only) |

---

## Mobile Events (Reference)

### `_success` — Transaction Submitted

Fires when the transaction has been submitted to the network and a txHash is returned. Equivalent to Extension's PENDING state. Properties are encrypted.

| Event | Trigger |
|---|---|
| `eth_sendTransaction_success` | EVM transaction submitted successfully |
| `avalanche_sendTransaction_success` | Avalanche transaction submitted successfully |
| `bitcoin_sendTransaction_success` | Bitcoin transaction submitted successfully |
| `solana_signAndSendTransaction_success` | Solana transaction submitted successfully |

**Properties (encrypted):**

```json
{
  "dAppUrl": "https://app.uniswap.org",
  "address": "0x...",
  "chainId": 43114,
  "txHash": "0x..."
}
```

### `_confirmed` — Transaction Finalized On-Chain

Fires when the VM module's receipt polling confirms the transaction was included in a block with `status === 1`. Fires via `ApprovalController.onTransactionConfirmed`. Properties are encrypted.

| Event | Trigger |
|---|---|
| `eth_sendTransaction_confirmed` | EVM transaction finalized on-chain |
| `avalanche_sendTransaction_confirmed` | Avalanche transaction finalized on-chain |
| `bitcoin_sendTransaction_confirmed` | Bitcoin transaction finalized on-chain |
| `solana_signAndSendTransaction_confirmed` | Solana transaction finalized on-chain |

**Properties (encrypted):**

```json
{
  "dAppUrl": "https://app.uniswap.org",
  "address": "0x...",
  "chainId": 43114,
  "txHash": "0x..."
}
```

### `_failed` — Transaction Failed

Fires in two cases:
1. **Submission error** — any non-user-rejection failure during send (no `txHash`). Fires via `WalletConnectProvider.onError`.
2. **On-chain revert** — transaction submitted but reverted (`receipt.status !== 1`). Fires via `ApprovalController.onTransactionReverted`.

| Event | Trigger |
|---|---|
| `eth_sendTransaction_failed` | EVM transaction failed |
| `avalanche_sendTransaction_failed` | Avalanche transaction failed |
| `bitcoin_sendTransaction_failed` | Bitcoin transaction failed |
| `solana_signAndSendTransaction_failed` | Solana transaction failed |

**Properties:**

```json
{
  "dAppUrl": "https://app.uniswap.org",
  "address": "0x...",
  "chainId": 43114
}
```

> Note: Extension's `_failed` fires only for on-chain reverts (REVERTED state) and includes `txHash`. Mobile's `_failed` covers both submission errors and on-chain reverts, so `txHash` is not included (not always available).

### What Is NOT Tracked (Mobile)

Signing-only RPC methods do **not** fire `_success` events:

- `personal_sign`
- `eth_sign`
- `eth_signTypedData`, `eth_signTypedData_v1`, `eth_signTypedData_v3`, `eth_signTypedData_v4`
- `avalanche_signTransaction`
- `bitcoin_signTransaction`
- `solana_signTransaction`
- `solana_signMessage`
- `avalanche_signMessage`

---

## Extension — Current State

### Event Coverage

| Event | Exists in Extension? |
|---|---|
| `eth_sendTransaction_success` | **No** |
| `avalanche_sendTransaction_success` | **Yes** |
| `bitcoin_sendTransaction_success` | **No** |
| `solana_signAndSendTransaction_success` | **No** |
| `avalanche_sendTransaction_confirmed` | **Yes** |
| `avalanche_sendTransaction_failed` | **Yes** |

### Key Differences

1. **No `_confirmed` events at all.** The extension never fires an analytics event at user-approval time. Events only fire on chain submission success/failure.

2. **Only `avalanche_sendTransaction` is instrumented.** The `eth_sendTransaction`, `bitcoin_sendTransaction`, and `solana_signAndSendTransaction` handlers have zero analytics.

3. **No `dAppUrl` property.** Transaction events do not include `dAppUrl`. The dApp domain only appears on the separate `TransactionTimeToConfirmation` event (as `site`).

4. **Different/additional properties.** The `avalanche_sendTransaction_success` event includes:

```json
{
  "address": "<user's address>",
  "txHash": "<transaction hash>",
  "chainId": "<chain identifier>"
}
```

5. **Extension-only events (not in Mobile):**
   - `avalanche_sendTransaction_failed` — with `address` and `chainId`
   - `TransactionTimeToConfirmation` — with `duration`, `txType`, `chainId`, `rpcUrl`, `site`

### Gaps for MTU Parity

- All `_confirmed` events (none exist)
- `eth_sendTransaction_success` (most common dApp tx type — not tracked)
- `bitcoin_sendTransaction_success` (not tracked)
- `solana_signAndSendTransaction_success` (not tracked)
- `dAppUrl` property on all events

---

## Web — Current State

### Event Coverage

| Event | Exists in Web? |
|---|---|
| `eth_sendTransaction_success` | **No** |
| `avalanche_sendTransaction_success` | **No** |
| `bitcoin_sendTransaction_success` | **No** |
| `solana_signAndSendTransaction_success` | **No** |

### Key Differences

1. **No dapp transaction analytics exist.** Core Web does not fire any of the `_confirmed` or `_success` events for dapp-initiated transactions.

2. **No `dAppUrl` property** on any events.

3. **No RPC method tracking** for any of the four send methods.

### Gaps for MTU Parity

- All `_confirmed` events
- All `_success` events
- `dAppUrl` property
- Full instrumentation of all four send RPC methods

---

## Summary Matrix

| Event | Mobile | Extension | Web |
|---|---|---|---|
| `eth_sendTransaction_success` | ✅ | ❌ | ❌ |
| `avalanche_sendTransaction_success` | ✅ | ✅ | ❌ |
| `bitcoin_sendTransaction_success` | ✅ | ❌ | ❌ |
| `solana_signAndSendTransaction_success` | ✅ | ❌ | ❌ |
| `eth_sendTransaction_confirmed` | ✅ | ❌ | ❌ |
| `avalanche_sendTransaction_confirmed` | ✅ | ✅ | ❌ |
| `bitcoin_sendTransaction_confirmed` | ✅ | ❌ | ❌ |
| `solana_signAndSendTransaction_confirmed` | ✅ | ❌ | ❌ |
| `eth_sendTransaction_failed` | ✅ | ❌ | ❌ |
| `avalanche_sendTransaction_failed` | ✅ | ✅ | ❌ |
| `bitcoin_sendTransaction_failed` | ✅ | ❌ | ❌ |
| `solana_signAndSendTransaction_failed` | ✅ | ❌ | ❌ |

### Property Comparison (`_success` events)

| Property | Mobile | Extension |
|---|---|---|
| `dAppUrl` | ✅ | ❌ |
| `address` | ✅ | ✅ |
| `txHash` | ✅ (encrypted) | ✅ (encrypted) |
| `chainId` | ✅ | ✅ |
| `duration` | ❌ | ✅ (`_confirmed` only) |

---

## Recommendation

To achieve cross-platform parity:

**Extension and Web:**
1. Add `_success` events for `eth_`, `bitcoin_`, `solana_signAndSend_` (avalanche already done)
2. Include `dAppUrl` property on all events

**Mobile (follow-up ticket):**
1. Add `_confirmed` (on-chain finalized) — requires building transaction lifecycle monitoring

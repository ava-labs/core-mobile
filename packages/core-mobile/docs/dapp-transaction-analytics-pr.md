# Dapp Transaction Analytics — PR Summary

## Overview

This PR adds PostHog analytics events when users approve and complete transactions from third-party dapps via WalletConnect. These events drive the **MTU (Monthly Transacting Users)** metric and bring Mobile into parity with Extension for dapp transaction tracking.

---

## Events Added

Three lifecycle stages are now tracked for each send method:

| Event | When it fires |
|---|---|
| `{method}_success` | txHash returned from the chain (transaction submitted to mempool) |
| `{method}_confirmed` | Transaction finalized on-chain (receipt `status === 1`) |
| `{method}_failed` | On-chain revert (receipt `status !== 1`) |

All four send methods are covered:

- `eth_sendTransaction`
- `avalanche_sendTransaction`
- `bitcoin_sendTransaction`
- `solana_signAndSendTransaction`

Signing-only methods (`personal_sign`, `eth_signTypedData*`, etc.) are intentionally excluded.

---

## Event Properties

### `_success` and `_confirmed`

Properties are **encrypted** via `captureWithEncryption` (contains `txHash` and `address`):

```json
{
  "dAppUrl": "https://app.uniswap.org",
  "address": "<chain-appropriate address>",
  "chainId": 43114,
  "txHash": "0x..."
}
```

### `_failed`

Also **encrypted** via `captureWithEncryption` (`txHash` is always available since this only fires for on-chain reverts):

```json
{
  "dAppUrl": "https://app.uniswap.org",
  "address": "<chain-appropriate address>",
  "chainId": 43114,
  "txHash": "0x..."
}
```

---

## Architecture

### `_success` — `walletConnect.ts` → `onSuccess()`

Fires when the VM module returns a txHash to the WalletConnect provider. At this point the transaction has been submitted to the network. Uses `captureWithEncryption`.

### `_confirmed` — `ApprovalController.ts` → `onTransactionConfirmed()`

The VM module internally polls `getTransactionReceipt` with a linear-then-exponential backoff (same logic as Extension's `@avalabs/evm-module`). When `receipt.status === 1`, it calls `onTransactionConfirmed` on the `ApprovalController`. We added analytics capture there for dapp (non-in-app) requests.

### `_failed` — `ApprovalController.ts` → `onTransactionReverted()`

Fires when the VM module's receipt polling receives a receipt with `status !== 1`. Because `txHash` is always available at this point, it is included in the encrypted payload — matching Extension's behavior exactly.

---

## Address Handling

`addressC` alone would be wrong for Bitcoin and Solana transactions. We introduced `getAddressForChain(account, caip2ChainId)` which picks the correct field based on the CAIP2 namespace:

| Namespace | Address field |
|---|---|
| `eip155` (EVM, Avalanche C-Chain) | `addressC` |
| `avax` P-Chain | `addressPVM` |
| `avax` X-Chain | `addressAVM` |
| `bip122` (Bitcoin) | `addressBTC` |
| `solana` | `addressSVM` |

For `_confirmed` and `_failed` in `ApprovalController`, the address is extracted from the live WalletConnect session via `WalletConnectService.getSession(request.sessionId)`. Session namespace accounts are CAIP2-formatted strings (`namespace:chainId:address`), so we split on `:` to extract the address part.

---

## Files Changed

### `app/types/analytics.ts`

Added 12 new typed event definitions — 4 `_success`, 4 `_confirmed`, 4 `_failed`.

### `app/store/rpc/utils/txSendMethods.ts` *(new file)*

Shared utility that defines the 4 tx send methods and the `isTxSendMethod` type guard. Also exports template-literal derived types:

```typescript
type TxSendSuccessEvent    = `${TxSendMethod}_success`
type TxSendConfirmedEvent  = `${TxSendMethod}_confirmed`
type TxSendFailedEvent     = `${TxSendMethod}_failed`
```

### `app/store/rpc/providers/walletConnect/walletConnect.ts`

- Added `_success` capture in `onSuccess()` for tx send methods using `captureWithEncryption`
- Added `getAddressForChain()` helper for chain-aware address selection
- Extracted Solana result wrapping into `transformResult()` to keep `onSuccess` within complexity limits

### `app/vmModule/ApprovalController/ApprovalController.ts`

- Added `_confirmed` capture in `onTransactionConfirmed()` for dapp requests
- Added `_failed` capture in `onTransactionReverted()` for dapp requests
- Added `getDappRequestAddress()` helper — looks up the WalletConnect session by `request.sessionId` (which is the WC topic) to get the chain-appropriate address

---

## Key Differences vs Extension

| | Mobile | Extension |
|---|---|---|
| `_success` fires when | txHash returned | txHash returned (avalanche only) |
| `_confirmed` fires when | `receipt.status === 1` | `receipt.status === 1` (avalanche only) |
| `_failed` covers | on-chain reverts only | on-chain reverts only (avalanche only) |
| `_failed` includes `txHash` | Yes | Yes |
| All events encrypted | Yes (`captureWithEncryption`) | — |
| Chains covered | all 4 send methods | avalanche only |
| `dAppUrl` included | Yes | No |

Both Mobile and Extension fire `_failed` only for on-chain reverts where `txHash` is guaranteed to be present. Mobile extends coverage to all four send methods vs Extension's avalanche-only scope.

---

## What's Not Tracked (intentional)

- `_confirmed` for in-app (non-WalletConnect) transactions — those use a separate confetti/toast flow
- Signing-only methods — no transaction is broadcast so there's nothing to confirm

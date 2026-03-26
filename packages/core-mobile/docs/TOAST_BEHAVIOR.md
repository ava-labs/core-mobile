# Transaction Toast & Confetti Behavior

This document describes what the user sees (toasts and confetti) at each stage of a transaction, broken down by transaction type.

---

## Fusion Swaps

### Same-chain Avalanche swap
- **Transaction submitted** → "Transaction sent" toast + confetti
- **Transaction confirmed** → nothing

### Same-chain non-Avalanche swap (e.g. Solana)
- **Transaction submitted** → "Transaction sent" toast
- **Transaction confirmed** → nothing

### Cross-chain or intermediate step
- **Transaction submitted** → nothing
- **Transaction confirmed** → nothing

> For all Fusion swap types, the notification center is the authoritative source of final status — no success toast is shown on confirmation.

---

## Non-Fusion Transactions

### Dapp-initiated (e.g. WalletConnect)
- **Transaction submitted** → pending toast
- **Transaction confirmed** → success toast

### In-app Avalanche (e.g. send, earn)
- **Transaction submitted** → "Transaction sent" toast + confetti (unless `CONFETTI_DISABLED` is set for that flow)
- **Transaction confirmed** → nothing

### In-app non-Avalanche (e.g. send on Ethereum)
- **Transaction submitted** → pending toast
- **Transaction confirmed** → success toast + confetti (unless `CONFETTI_DISABLED` is set for that flow)

---

## How It Works

Behavior is controlled by `RequestContext` flags set on each RPC request before it is sent to the VM module. The flags are read in `ApprovalController` inside `onTransactionPending` and `onTransactionConfirmed`.

Flag | Effect
--- | ---
`SUPPRESS_TX_FEEDBACK` | Suppresses all toasts, confetti, and the in-app review prompt on confirmation
`IMMEDIATE_SENT_TOAST` | Shows "Transaction sent" in `onTransactionPending` instead of a pending toast
`SUCCESS_TOAST_DISABLED` | Suppresses the success toast in `onTransactionConfirmed`
`CONFETTI_DISABLED` | Suppresses confetti wherever it would otherwise appear

For Fusion swaps, flags are set in `buildRequestContext` (`new/features/swap/utils/buildRequestContext.ts`).

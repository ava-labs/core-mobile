# CP-14874: Change perps deposit options to percentages — Design

**Ticket:** https://ava-labs.atlassian.net/browse/CP-14874
**Date:** 2026-07-22

## Goal

Switch the perps deposit quick-amount buttons from fixed `$100 / $250 / $500` to
percentages `25% / 50% / Max` of the user's wallet USDC balance.

## Current state

`PerpetualsDepositScreen.tsx` (`app/new/features/trade/perpetuals/screens/`)
passes `presets={DEPOSIT_PRESETS}` (fixed 100/250/500) to
`TokenUnitInputWidget`. The k2-alpine widget's **built-in default** — used when
no `presets` prop is provided — is already `25% / 50% / Max`, computed from the
passed `balance` with bigint math (`balance.mul(percent)`), with `Max` at
`maxPercentage` (default `1`, i.e. 100% of balance).

## Change

In `PerpetualsDepositScreen.tsx`:

1. Delete the `DEPOSIT_PRESETS` constant.
2. Remove the `presets={DEPOSIT_PRESETS}` prop from `TokenUnitInputWidget`.

No k2-alpine changes. No other screens affected (`PerpetualsCloseScreen` and
predictions screens keep their own presets intentionally).

## Behavior notes

- Balance is still the stub `WALLET_USDC_BALANCE = 28.1142`; 25% ≈ 7.03 USDC is
  below the 10 USDC minimum, so tapping it shows the existing
  "Minimum deposit is 10 USDC" inline error and the Deposit button stays
  disabled. This is accepted — real balance wiring is a separate task, and the
  existing validation handles it. No preset-disabling logic.
- `Max` = 100% of wallet balance (widget default `maxPercentage = 1`).

## Testing

- Type-check (`yarn tsc`) and lint pass.
- Manual: deposit screen shows 25% / 50% / Max; tapping each fills
  balance-proportional amounts; existing min-deposit validation still applies.

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

- The screen now uses the real C-Chain USDC balance (`useCChainUsdc`), so the
  percentage presets are balance-proportional for real. If 25%/50% of a small
  balance falls below the 5 USDC minimum (`MIN_DEPOSIT_USDC`), the existing
  "Minimum deposit is 5 USDC" inline error shows and the Deposit button stays
  disabled. No preset-disabling logic.
- `Max` = 100% of wallet balance (widget default `maxPercentage = 1`).

## Addendum: Max display-rounding bug (deposit + withdraw)

Device testing surfaced that tapping **Max** on the withdraw screen filled
44.1488 USDC but errored "Maximum withdrawal is 44.15 USDC". Root cause: both
perps screens stored `value.toDisplay({ asNumber: true })` — 4-decimal
**round-half-up** — as the amount, so Max on a balance like 44.148877 became
44.1489, which the hooks reject as exceeding the balance. The same pattern
would have broken deposit Max with the new percentage presets.

Fix (perps screens only — shared k2 widget deliberately untouched):

- New `utils/usdcAmount.ts`: `usdcAmountFromTokenUnit` collapses widget
  amounts to exact USDC precision via `toSubUnit()` (floors — also drops the
  fractional subunits that percentage presets produce, which
  `parseUnits(…, 6)` would reject), and `floorToUsdcUnit` converts the
  withdrawable float to a balance without rounding up.
- Both screens' `handleAmountChange` use `usdcAmountFromTokenUnit`; the
  withdraw screen builds `availableBalance` with `floorToUsdcUnit`.

Known cosmetic leftover (pre-existing, all `TokenUnitInputWidget` consumers):
the widget fills the input *text* with the display-rounded value while
emitting full precision, so the visible amount can differ from the submitted
amount by <0.0001 USDC. Follow-up candidate: align the widget with
`SendTokenUnitInputWidget` (`setValue(amt.toString())` + `toSubUnit()`).

## Testing

- Type-check (`yarn tsc`) and lint pass.
- Manual: deposit screen shows 25% / 50% / Max; tapping each fills
  balance-proportional amounts; existing min-deposit validation still applies.

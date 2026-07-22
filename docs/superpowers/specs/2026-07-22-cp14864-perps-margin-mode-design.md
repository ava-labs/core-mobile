# CP-14864 — Add Margin (Mode Selector) to Perps Place Order

- **Ticket:** https://ava-labs.atlassian.net/browse/CP-14864
- **Figma:** entry point [20477-53337](https://www.figma.com/design/aj9mmgDMaaxZXkuIRKLhIn/Core-Mobile-2026?node-id=20477-53337), margin-mode sheet [23278-24067](https://www.figma.com/design/aj9mmgDMaaxZXkuIRKLhIn/Core-Mobile-2026?node-id=23278-24067)
- **Date:** 2026-07-22
- **Status:** Approved

## Summary

Add a **Margin mode** (Cross / Isolated) selector to the perps Place Order flow.
Hyperliquid has no standalone "set margin mode" action — the mode is the
`isCross` flag on the per-coin `updateLeverage` exchange action. The app
currently hard-codes cross margin (`PerpetualsLeverageScreen` calls
`updateLeverage(coin, draftLeverage, true)`).

**Scope:** mode selector only. Adding/removing USD margin on isolated
positions (`updateIsolatedMargin`, already exposed by
`usePerpsPositionActions` but unused) stays out of scope — on core-web that is
a separate "Adjust margin" feature in the Manage Position flow.

## UI & navigation

- **Place Order screen** (`screens/PerpetualsPlaceOrderScreen.tsx`): new
  single-item `GroupList` card **"Margin mode"** with the current mode
  (`Cross`/`Isolated`) as accessory value + chevron, placed above the
  "Add leverage" card, matching the Figma. Press →
  `router.navigate('/perpetualsPlaceOrder/margin')`.
- **Route:** new `routes/(signedIn)/(modals)/perpetualsPlaceOrder/margin.tsx`
  re-exporting the screen, plus `<Stack.Screen name="margin"
  options={stackScreensOptions} />` in the stack `_layout.tsx` — identical to
  the existing `leverage.tsx` wiring, so the screen shares
  `PlaceOrderProvider`.
- **New screen** `screens/PerpetualsMarginModeScreen.tsx`: `ScrollScreen`
  titled **"Margin mode"**, subtitle *"Select which mode to use for your
  margin"*, one card with two option rows and a **Done** footer button (same
  footer pattern as `PerpetualsLeverageScreen`):
  - **Cross** — "All cross positions share the same cross margin as
    collateral. In the event of liquidation, your cross margin balance and any
    remaining open positions under assets in this mode may be forfeited."
  - **Isolated** — "Manage your risk on individual positions by restricting
    the amount of margin allocated to each. If the margin ratio of an isolated
    position reaches 100%, the position will be liquidated. Margin can be
    added or removed to individual positions in this mode."
  - Selected row shows a checkmark accessory.

## State & data flow

- Source of truth is Hyperliquid: `usePerpsActiveAssetData(coin).leverageType`
  (`'cross' | 'isolated'`), already fetched on the Place Order screen.
- Add `marginMode: 'cross' | 'isolated'` + `setMarginMode` to
  `contexts/PlaceOrderContext.tsx`, seeded from `leverageType` the same way
  `leverage` is seeded (seed only until the user commits a change, so we never
  fight an in-flight edit). The Place Order row reads context so it updates
  instantly after a commit.
- The margin sheet keeps a **local draft**; tapping an option only changes the
  draft.

## Commit & error handling

- **Done** → `updateLeverage(coin, leverage, draftMode === 'cross')` via the
  existing `usePerpsPositionActions` (handles busy state, snackbar,
  `refreshAfterTrade()`). On success: `setMarginMode(draftMode)` and
  `router.back()`. On failure: stay on the sheet (the action already surfaces
  the error snackbar).
- If the draft equals the current mode, Done navigates back without an
  exchange call (same "unchanged" guard as the Leverage screen).
- Extend `updateLeverage` with an optional success-message parameter so this
  flow shows **"Margin mode updated"** (default stays "Leverage updated").

## Existing-bug fix (in scope)

`PerpetualsLeverageScreen` hard-codes `isCross: true`; once Isolated is
selectable, confirming leverage would silently flip the user back to Cross.
Fix: pass `marginMode === 'cross'` from `PlaceOrderContext`.

## Edge cases (parity with core-web / HL rules)

- **Open position in the market** (coin present in
  `usePerpsPositions().positions`): HL rejects margin-mode changes. The sheet
  still opens, both options are disabled, the subtitle becomes *"Close your
  open position to change margin mode for this market"*, and Done just closes.
- **Isolated-only markets**
  (`useHyperliquidMarketContext(coin).universe?.onlyIsolated`): the Cross
  option is disabled and the displayed mode is Isolated. We skip core-web's
  silent auto-push of isolated leverage; with `isCross` now derived from
  context on both sheets, orders won't push cross mode for these markets.

## Testing

- `PerpetualsMarginModeScreen` component tests: renders both options with
  correct selection; draft select + Done calls `updateLeverage` with the right
  `isCross`; unchanged Done skips the exchange call; open-position lock
  disables both options and swaps the subtitle; `onlyIsolated` disables Cross.
- `PerpetualsLeverageScreen` tests updated for `isCross`-from-context.
- Place Order screen test: margin row shows the current mode and navigates to
  the margin route.

## Key files

| File | Change |
| --- | --- |
| `features/trade/perpetuals/screens/PerpetualsPlaceOrderScreen.tsx` | Add "Margin mode" row |
| `features/trade/perpetuals/screens/PerpetualsMarginModeScreen.tsx` | New screen |
| `features/trade/perpetuals/screens/PerpetualsLeverageScreen.tsx` | `isCross` from context |
| `features/trade/perpetuals/contexts/PlaceOrderContext.tsx` | `marginMode` state |
| `features/trade/perpetuals/hooks/usePerpsPositionActions.ts` | Optional success message on `updateLeverage` |
| `routes/(signedIn)/(modals)/perpetualsPlaceOrder/margin.tsx` | New route |
| `routes/(signedIn)/(modals)/perpetualsPlaceOrder/_layout.tsx` | Register `margin` screen |

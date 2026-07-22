# My Wallets — Flatten the Accordion into a Virtualized List

**Date:** 2026-07-02
**Tickets:** CP-14631, CP-14632 (perf + overlapping accordion)
**Status:** Design approved, pending spec review

## Problem

The "My wallets" screen (`WalletsScreen`) renders one `WalletCard` per wallet in a
FlashList. When a wallet is expanded, **all of its accounts render inside that single
FlashList cell**. This one architectural decision causes both reported symptoms:

- **Slow performance** (felt even at ~13 accounts, severe at 48): account rows can't be
  virtualized — every account in an expanded wallet mounts at once, each running
  `useWalletBalances` + `computeAccountBalance`. Switching the active wallet re-renders the
  whole giant cell.
- **Overlapping cards** (device-only + Release-only): a single, large, dynamically-sized
  cell whose height is driven by animation is exactly what FlashList mis-measures on a slow
  real device in a Release build. The following wallet cards get positioned over the
  expanded card's account rows. Confirmed reproducible locally on the simulator as of
  2026-07-02.

Prior attempts (keyExtractor, recycle reseed, `getItemType`, restoring the pre-upgrade
minHeight structure) either only reduced the blast radius or fixed the overlap without
addressing the underlying performance ceiling. The root cause is the nested-cell
architecture itself.

## Goal

Eliminate both symptoms **by construction** by making each account its own top-level,
virtualized FlashList row, while keeping the current visuals pixel-identical and preserving
an animated expand/collapse.

Non-goals: changing wallet ordering/grouping behavior, changing balance data sources,
touching any screen other than the wallets feature.

## Approach: flat, mixed-item virtualized list

`WalletsScreen` stops rendering `WalletCard` and instead builds a **flat `ListRow[]`** from
`walletsDisplayData` + `expandedWallets`.

### Data model

```ts
type CardPos = 'single' | 'top' | 'middle' | 'bottom'

type ListRow =
  | { kind: 'walletHeader'; wallet: WalletDisplayData; isActive: boolean; isExpanded: boolean; cardPos: CardPos }
  | { kind: 'account'; walletId: string; account: AccountDisplayData; isActive: boolean; hideSeparator: boolean; cardPos: CardPos }
  | { kind: 'addAccount'; wallet: WalletDisplayData; cardPos: CardPos }
```

### Builder

Iterate `walletsDisplayData` in its existing order (active wallet hoisted to top, imported
private-key accounts as the virtual wallet — unchanged). For each wallet:

1. Push a `walletHeader` row.
2. If the wallet is expanded:
   - Push an `account` row per account.
   - Push an `addAccount` row, unless `wallet.type === PRIVATE_KEY`.

`cardPos` is assigned so the run of rows belonging to one wallet reproduces a single card:

- Collapsed wallet → its header is `single` (all corners rounded, full border, margins top+bottom).
- Expanded wallet → header is `top`; the middle rows are `middle`; the final row of the run
  (the `addAccount` row, or the last `account` row for PRIVATE_KEY wallets) is `bottom`.

### FlashList wiring (via `ListScreenV2`)

- `renderItem` switches on `row.kind`.
- `keyExtractor`: `walletHeader:<walletId>` / `acct:<accountId>` / `add:<walletId>`.
- `getItemType`: returns `row.kind` so headers, accounts, and add-buttons each get their own
  recycle pool and size estimate (uniform heights per pool → reliable measurement).

**Why this fixes both bugs:** account rows are virtualized (only on-screen rows mount → perf),
and every cell is small and roughly uniform per type (no giant dynamically-sized cell → no
mis-measurement → no overlap).

## Pixel-matching the card look

A small presentational `CardRow` wrapper recreates the current grouped card from `cardPos`:

- `backgroundColor` (surface), `marginHorizontal: 16`, left + right border on every row.
- `top` / `single`: add top border, top-left/top-right radius, `marginTop`.
- `bottom` / `single`: add bottom border, bottom-left/bottom-right radius, `marginBottom`.

Account separators keep the existing `hideSeparator` logic already computed in
`primaryWalletsDisplayData` / `importedWalletsDisplayData`. The border width/radius/inset
values are copied from the current `cardStyle` + `WalletCard` root so the result is visually
indistinguishable from today.

## Expand/collapse animation

Account and `addAccount` rows animate in/out with Reanimated `entering`/`exiting`
(fade + slide), and rows use `LinearTransition` so the surrounding list reflows smoothly on
toggle.

**Validation checkpoint (explicit risk):** Fabric enter/exit + layout animations are the same
class that produced the original Release-only failure. On the local simulator repro we verify
that (a) the animation is smooth and (b) it does not reintroduce overlap. If either fails, we
fall back to an instant reveal (no `entering`/`exiting`/`LinearTransition`) — kept as a single
switch so the fallback is one line, not a rewrite.

## Balance computation

- **Wallet header total**: computed per wallet at the screen level from `useAllBalances`
  (there are few wallets, so this is cheap) and passed to the `walletHeader` row. Removes the
  per-card `useWalletBalances` usage.
- **Per-account `computeAccountBalance`**: moves into the account row component so it runs
  **only for mounted (visible) rows**. Today every account computes even while off-screen;
  this is the largest single perf win alongside virtualization.

The underlying balance data source (`useAllBalances`, network/token-visibility selectors)
is unchanged.

## Components & scope

- New: `WalletHeaderRow` (header JSX extracted from `WalletCard`), `AccountRow` (thin wrapper
  over the existing `AccountListItem` adding `CardRow` + animation), `AddAccountRow` (from the
  current `AddAccountButton`), and `CardRow` (position-based card styling).
- Retire `WalletCard`.
- `WalletsScreen` owns the flat-array builder.
- `WalletCard` is used only by `WalletsScreen`, and `AccountListItem` only inside `WalletCard`,
  so the change is fully contained to the wallets feature. No other screen is affected.

## Testing / success criteria

Verified against the local simulator repro:

1. No overlap during scroll, expand/collapse, and wallet switch.
2. Only visible account rows mount (virtualization confirmed — e.g. via render logging or
   confirming off-screen rows are not mounted).
3. Expand/collapse animates smoothly, or cleanly falls back to instant.
4. Visuals pixel-match the current design (corners, borders, spacing, separators).

Unit tests:

- Flat-array builder: `cardPos` assignment for collapsed vs expanded wallets, single-account
  wallets, PRIVATE_KEY wallets (no addAccount row → last account is `bottom`), the imported
  virtual wallet, and active-wallet hoisting order.

## Rollout note

This is the proper perf fix and is larger than the pre-upgrade restore already on the branch.
Because the bug now reproduces locally, the fix can be verified on the simulator before
shipping. Decide during implementation whether it rides the current RC or a follow-up release.

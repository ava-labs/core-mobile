# Quick Swaps ("degen mode") — CP-13244

A new advanced setting that opts the user into one-click swap behavior with a preset gas tier and a per-swap fiat amount cap, mirroring the existing core-web feature for parity.

- Jira: <https://ava-labs.atlassian.net/browse/CP-13244>
- Designs: <https://www.figma.com/design/aj9mmgDMaaxZXkuIRKLhIn/Core-Mobile-Redesign-2025?node-id=16584-12269>
- Reference implementation: `core-web` repo at `/apps/core/app/components/Settings/QuickSwaps.tsx`

## Story

As an advanced swap user I want one-click swaps so that I can swap with minimal friction.

### Acceptance criteria

- **AC1:** User can enable Quick Swaps in Advanced Settings and configure default gas (Slow/Normal/Fast) and a max swap amount.
- **AC2:** When enabled, swaps execute without an additional review/approval step.
- **AC3:** If a failure criterion is met, the user falls back to the regular swap behavior (no auto-progression).

## Scope and constraints

**In scope (v1):**

- A new **Advanced Settings screen** (does not yet exist on mobile) hosting the Quick Swaps row, mirroring Figma node `16584:12269`. Title "Advanced settings", subtitle "Tools and settings for power users".
- Quick Swaps toggle row on that screen + animated reveal of fee picker and amount-limit drill-in row.
- Persistence in the existing `state.settings.advanced` redux slice.
- Wiring the saved fee tier into `FusionService.transferAsset()` via `gasSettings`.
- Form-level enforcement of `maxBuy` on `SwapScreen` (Swap button disabled with inline copy when over limit).
- Filtering Markr-gasless quotes from the quote stream when the toggle is on.
- One PostHog feature gate for rollout (`FUSION_QUICK_SWAPS`).

The "Filter out small UTXOs" row visible in the same Figma frame is a separate ticket; do **not** implement it here. The new Advanced Settings screen we build should be structured so that row can be added later without rework.

**Explicitly out of scope (v1) — file follow-ups, do not block this work:**

- Blockaid transaction-batch validation as an additional fallback gate. `BlockaidService` currently only supports `scanSite`; transaction scanning needs new SDK surface area and proxy work.
- Hardware wallets (Ledger, Keystone). On-device confirmation already provides the equivalent friction; the toggle is hidden for these wallet types.
- Solana, Bitcoin, and cross-chain swaps. EVM-only for v1.

**Hard constraint:** existing swap behavior must be byte-identical when Quick Swaps is disabled or unavailable. Every code path is gated by `useQuickSwaps().isAvailable && isEnabled`.

## Settings model

Persisted in `state.settings.advanced`, alongside the existing `developerMode` and `isLeftHanded` fields.

```ts
// app/store/settings/advanced/types.ts
export const QUICK_SWAP_FEE_LEVELS = ['low', 'medium', 'high'] as const
export type QuickSwapFeeLevel = (typeof QUICK_SWAP_FEE_LEVELS)[number]

export const QUICK_SWAP_MAX_BUY_VALUES = [
  'unlimited', '1000', '5000', '10000', '50000'
] as const
export type QuickSwapMaxBuy = (typeof QUICK_SWAP_MAX_BUY_VALUES)[number]

export type QuickSwapsSettings = {
  isEnabled: boolean
  feeSetting: QuickSwapFeeLevel
  maxBuy: QuickSwapMaxBuy
}

// Initial state:
//   quickSwaps: { isEnabled: false, feeSetting: 'medium', maxBuy: 'unlimited' }
```

`maxBuy` values are bare strings in the user's display currency (matching core-web). UI labels render as `5,000` next to the user's `currencyCode`. **No on-the-fly USD conversion** — a EUR user's "5,000" is 5,000 EUR.

### Reducers

- `setQuickSwapsEnabled(boolean)`
- `setQuickSwapsFeeSetting(QuickSwapFeeLevel)`
- `setQuickSwapsMaxBuy(QuickSwapMaxBuy)`

### Selectors

- `selectQuickSwaps(state) => QuickSwapsSettings`
- `selectIsQuickSwapsEnabled(state) => boolean`
- `selectQuickSwapsFeeSetting(state) => QuickSwapFeeLevel`
- `selectQuickSwapsMaxBuy(state) => QuickSwapMaxBuy`

### Migration

Bump store version `v28 → v29`. Migrations in this repo live in a **single file** `app/store/migrations.ts` keyed by numeric version. Append key `29`:

```ts
// app/store/migrations.ts
29: (state: any) => ({
  ...state,
  settings: {
    ...state.settings,
    advanced: {
      ...state.settings.advanced,
      quickSwaps: state.settings.advanced?.quickSwaps ?? {
        isEnabled: false,
        feeSetting: 'medium',
        maxBuy: 'unlimited'
      }
    }
  }
})
```

Idempotent — running twice is safe (the `??=` fall-through preserves an existing object). Does not remove or rename existing fields. Update `VERSION` constant in `app/store/index.ts` from `28` to `29`.

## Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          accountSettings UI                            │
│  AdvancedSettingsScreen (NEW) → QuickSwapsToggleRow (NEW)              │
│                                  ├─ Toggle + title + subtitle          │
│                                  ├─ animated reveal:                   │
│                                  │   ├─ Network fee picker             │
│                                  │   │   (Slow / Normal / Fast)        │
│                                  │   └─ Swap amount limit drill-in row │
│                                  └─ navigates to                       │
│                                     SwapAmountLimitScreen (NEW)        │
│  Toggle-row pattern follows NotificationToggle.tsx (existing).         │
└─────────────────────────────┬──────────────────────────────────────────┘
                              │  dispatch(setQuickSwaps…)
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  state.settings.advanced  (existing slice — extend)                    │
│    quickSwaps: { isEnabled, feeSetting, maxBuy }                       │
└─────────────────────────────┬──────────────────────────────────────────┘
                              │  selectors
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│             features/swap/hooks/useQuickSwaps.ts (NEW)                 │
│  useQuickSwaps()  → { isAvailable, isEnabled, feeSetting, maxBuy,      │
│                       isAmountOverLimit(amountUsd) }                   │
│    isAvailable = posthogFlag                                           │
│                  && wallet.type ∉ {LEDGER, LEDGER_LIVE, KEYSTONE}      │
│                  && chain.namespace === 'eip155'                       │
│    (active wallet read via useActiveWallet() from common/hooks)        │
└──────────┬─────────────────────────────────────┬───────────────────────┘
           │ consumed by                         │ consumed by
           ▼                                     ▼
  SwapScreen.tsx                    SwapContext.tsx
  ─ inline form-validation:         ─ in swap(): if isEnabled, look up
    if isAmountOverLimit →            gas settings for feeSetting and
    disable Swap button +             pass into FusionService.transferAsset
    inline error copy                 via gasSettings.maxFeePerGas /
  ─ filters Markr-gasless             maxPriorityFeePerGas
    quotes when isEnabled
```

The hook is the single source of truth for "is Quick Swaps active right now". `SwapScreen` and `SwapContext` consume it without inspecting the underlying redux shape.

## File map

### New files

| Path | Purpose |
|---|---|
| `app/new/features/swap/hooks/useQuickSwaps.ts` | Consumer-facing hook. Returns `{ isAvailable, isEnabled, feeSetting, maxBuy, isAmountOverLimit(amountUsd) }`. Reads active wallet via `useActiveWallet()`. |
| `app/new/features/swap/utils/quickSwapsFee.ts` | Pure function `mapFeeSettingToGasSettings(feeSetting, suggestedFees)` returning `{ maxFeePerGas, maxPriorityFeePerGas } \| undefined`. |
| `app/new/features/swap/utils/quickSwapsLimits.ts` | Pure function `isAmountOverLimit(amountUsd: Big \| undefined, maxBuy: QuickSwapMaxBuy): boolean`. |
| `app/new/features/accountSettings/screens/AdvancedSettingsScreen.tsx` | **NEW SCREEN** — title "Advanced settings", subtitle "Tools and settings for power users". Hosts the Quick Swaps toggle row. Structured to accept future rows (e.g. "Filter out small UTXOs" from a parallel ticket). |
| `app/new/features/accountSettings/components/QuickSwapsToggleRow.tsx` | The Quick Swaps row: title + subtitle + Toggle on the right (pattern: `NotificationToggle.tsx`); when on, animated reveal of the segmented fee picker (Slow/Normal/Fast) and a drill-in row showing the current `maxBuy` label that navigates to the amount-limit screen. |
| `app/new/features/accountSettings/screens/SwapAmountLimitScreen.tsx` | Detail screen with five selectable rows (Unlimited / 1,000 / 5,000 / 10,000 / 50,000 — labels prefixed with the user's `currencyCode`). Tap dispatches `setQuickSwapsMaxBuy` and pops back. |
| `app/new/routes/(signedIn)/(modals)/accountSettings/advancedSettings.tsx` | Expo Router route for `AdvancedSettingsScreen`. |
| `app/new/routes/(signedIn)/(modals)/accountSettings/swapAmountLimit.tsx` | Expo Router route for `SwapAmountLimitScreen`. |
| Test files | One per pure util and hook; component tests for the new screen and two new components; two E2E smoke tests (see Testing strategy). |

### Modified files

| Path | Change |
|---|---|
| `app/store/settings/advanced/types.ts` | Add `QuickSwapsSettings` to `AdvancedState`. Export the literal-union types. |
| `app/store/settings/advanced/slice.ts` | Add three reducers and four selectors (per Settings model section). |
| `app/store/migrations.ts` | Add key `29: …` with default-fill for `quickSwaps`. |
| `app/store/index.ts` | Bump `VERSION` constant from `28` to `29`. |
| `app/services/posthog/types.ts` | Add `FUSION_QUICK_SWAPS = 'fusion-quick-swaps'` to `FeatureGates` enum (gates live here). Default `false`. |
| `app/store/posthog/slice.ts` | Add `selectIsQuickSwapsAvailable` derived selector (selectors live here, not in `services/posthog/`). |
| `app/new/features/swap/services/FusionService.ts` | Widen `transferAsset()` second arg to accept the full `GasSettings` object (currently only takes `estimateGasMarginBps`). Backwards compatible — existing callers pass through unchanged. |
| `app/new/features/swap/contexts/SwapContext.tsx` | In `swap()`, when Quick Swaps is enabled compute `{ maxFeePerGas, maxPriorityFeePerGas }` for the chosen tier and pass into `transferAsset`. The `fromAmountUsd` derivation already exists locally for analytics — lift it to be available pre-submit so the limit check can read it. |
| `app/new/features/swap/screens/SwapScreen.tsx` | Read `useQuickSwaps()`; derive `fromAmountUsd` (or import a shared util introduced via the SwapContext lift); disable Swap button + show inline copy when `isEnabled && isAmountOverLimit(fromAmountUsd)`. |
| `app/new/features/swap/hooks/useQuoteStreaming.ts` *(or the next-closest filter site)* | Filter out Markr-gasless quotes when Quick Swaps enabled. Discriminator confirmed at implementation time. |
| `app/types/analytics.ts` | Add `QuickSwapsToggled`, `SwapBlockedByQuickSwapLimit`. Extend `SwapConfirmed` payload (see Telemetry section). |
| `app/new/features/swap/store/listeners.ts` | Emit the two new events at the right moments. Populate quick-swap fields on existing `SwapConfirmed` capture. |

## SDK integration

`@avalabs/fusion-sdk` already exposes:

- `FeeRateTier = 'slow' | 'normal' | 'fast'` (see `dist/types/fee.d.ts`).
- `GasSettings = { estimateGasMarginBps?, maxFeePerGas?, maxPriorityFeePerGas? }` (see `dist/types/service.d.ts`).
- `EstimateNativeFeeOptions.feeRateTier?: FeeRateTier` for fee estimation.

To apply a tier on `transferAsset`, the SDK does **not** accept a tier shorthand directly — only concrete `maxFeePerGas` / `maxPriorityFeePerGas`. Wiring is therefore:

1. Map `feeSetting → FeeRateTier`: `'low' → 'slow'`, `'medium' → 'normal'`, `'high' → 'fast'`. (Identical to core-web's `mapFeeSettingToGasOption`.)
2. Acquire chain-specific suggested gas options for that tier. Mobile does **not** currently call `eth_suggestPriceOptions` directly — the exact seam (existing fee-estimation hook, new direct RPC call, or a helper to be added on `FusionService`) is an open implementation question, with a 2-second timeout regardless of source.
3. Pass the resulting `{ maxFeePerGas, maxPriorityFeePerGas }` into `FusionService.transferAsset(quote, { estimateGasMarginBps, maxFeePerGas, maxPriorityFeePerGas })`.
4. **Fallback path:** if step 2 throws or times out, omit the tier override and proceed with the SDK's default. Log via `Logger.warn`.

The mapping helper lives in `quickSwapsFee.ts` so the implementation can be swapped later if the SDK adds a tier shorthand to `transferAsset`.

### Markr-gasless filtering

When Quick Swaps is enabled, the quote stream filters out gasless quotes. The discriminator is on the `Quote` type — needs to be confirmed during implementation; likely `quote.serviceType === 'MARKR_GASLESS'` or a similar flag. This makes the subtitle copy *"Core is unable to provide free gas if this feature is enabled"* accurate.

## Data flow

### Swap-time decision tree

When the user taps the Swap button on `SwapScreen`:

```
useQuickSwaps()
  │
  ├─ isAvailable?
  │    no  → behave exactly as today
  │    yes
  │     │
  ├─ isEnabled?
  │    no  → behave exactly as today
  │    yes
  │     │
  ├─ isAmountOverLimit(fromAmountUsd, maxBuy)?
  │    yes → Swap button is DISABLED before user can tap; inline copy
  │          shown (see Edge cases #1, #12 below). User cannot proceed.
  │    no
  │     │
  └─ Active quote is Markr-gasless?
       (Should never reach here — gasless quotes are filtered at the
       quote-stream layer when isEnabled. Listed for completeness.)
       │
       ▼
  swap(activeQuote):
    gasSettings = mapFeeSettingToGasSettings(feeSetting, suggestedFees(quote.chain))
    FusionService.transferAsset(quote, {
      estimateGasMarginBps: transferGasMarginBps,
      maxFeePerGas: gasSettings?.maxFeePerGas,
      maxPriorityFeePerGas: gasSettings?.maxPriorityFeePerGas
    })
```

`isAvailable` and `isEnabled` are re-read at swap-time (not just at mount) so that toggle-flips during quote streaming take effect on the next submission.

### State transitions

```
Default at install / migration v28→v29:
  { isEnabled: false, feeSetting: 'medium', maxBuy: 'unlimited' }

User actions:
  Toggle row tapped               → setQuickSwapsEnabled(boolean)
  Slow/Normal/Fast tapped         → setQuickSwapsFeeSetting('low'|'medium'|'high')
  Swap amount limit option tapped → setQuickSwapsMaxBuy('unlimited'|'1000'|...)
```

State persists across launches and is preserved across logout (only wallet-state slices reset, per existing app convention).

## Error handling and edge cases

| # | Scenario | Handling |
|---|---|---|
| 1 | `fromAmountUsd` is `undefined` (no price feed, brand-new token) | Treat as **over limit** → block. Inline copy: *"Can't determine swap value. Disable Quick Swaps to proceed."* Fail-safe: never let a user blindly swap an unpriced token under a $-denominated cap. |
| 2 | User changes display currency while `maxBuy` is set | Match core-web: limit values are bare numbers in user's display currency. No conversion. Documented as known behavior. |
| 3 | User on Ledger/Keystone reaches the row via deeplink | `isAvailable` returns false → row hidden on `AdvancedSettingsScreen`. Even if state has `isEnabled: true` from prior wallet, swap-flow gate uses `isAvailable && isEnabled`. |
| 4 | PostHog flag flips off mid-session | `isAvailable → false`. UI hides on next render. Settings persist; if flag flips back, prior settings reappear. |
| 5 | SDK fee suggestion fails (timeout, RPC error) | Catch, omit `gasSettings` tier override (let SDK default), `Logger.warn`. Swap proceeds. |
| 6 | `transferAsset` throws | No new behavior. Existing retry/auto-advance logic runs; gas settings recomputed per attempt. |
| 7 | User changes `feeSetting` mid-swap (after tap, before broadcast) | Settings change is racey-but-bounded: `swap()` captured `feeSetting` at the start of the call. Subsequent retries pick up the new value. Acceptable — sub-second window. |
| 8 | User toggles `isEnabled` off mid-swap | Same as #7. Current submission completes; subsequent retries treat Quick Swaps as off. |
| 9 | Auto-advance to next quote when current quote fails | Each retry re-reads `isEnabled` and recomputes gas settings against the new quote's chain. |
| 10 | Migration v28 → v29 fails | Migration is non-destructive default-fill. If `state.settings.advanced` is otherwise corrupt, that is an existing failure mode unaffected by this change. |
| 11 | User mid-flight on Solana/Bitcoin swap with Quick Swaps enabled | `isAvailable` returns false for non-EVM chains. UI behaves as if Quick Swaps doesn't exist for that swap. |
| 12 | `fromAmountUsd = 0` | Existing UI already disables Swap on amount=0; over-limit util returns false at 0. No special handling needed. |
| 13 | Slippage interaction | Quick Swaps does **not** override slippage. Slippage remains user-controlled per swap. |

### Newly introduced failure surface

`mapFeeSettingToGasSettings` requires a chain-specific fee suggestion. The swap path acquires a network dependency it didn't previously have. Mitigations:

- 2-second timeout on the suggestion call.
- On timeout/error, fall back to omitting the override.
- Surface diagnostics via `Logger.warn` so we can monitor.

The exact source of the suggestion (existing fee-estimation hook vs. new RPC call) is an open implementation question — see below.

## Telemetry

Match existing analytics conventions in `app/types/analytics.ts`: PascalCase event names, `encrypted: { ... }` for sensitive payload, top-level fields for non-sensitive context.

### New events

```ts
// app/types/analytics.ts (additions)
QuickSwapsToggled: { isEnabled: boolean }

SwapBlockedByQuickSwapLimit: {
  maxBuy: QuickSwapMaxBuy
  hasUsdValue: boolean   // distinguishes "over $-cap" vs "no price feed → blocked"
}
```

### Extended event

```ts
SwapConfirmed: {
  encrypted: { /* unchanged */ }
  caip2SourceChainId: string
  caip2TargetChainId: string
  // Additions — top-level, non-sensitive:
  quickSwapsEnabled?: boolean
  quickSwapsFeeSetting?: QuickSwapFeeLevel
  quickSwapsMaxBuy?: QuickSwapMaxBuy
}
```

Per-setting-change events (`feeSettingChanged`, `maxBuyChanged`) intentionally omitted — distribution-per-swap is more useful and existing toggle settings (`developerMode`, `isLeftHanded`) follow the same no-telemetry convention.

Operational diagnostics (e.g. fee-suggestion failure) use `Logger.warn`, not analytics.

## Feature gating

Add to `app/services/posthog/types.ts`:

```ts
FUSION_QUICK_SWAPS = 'fusion-quick-swaps'
```

Mobile does not differentiate at the wallet-provider level the way the core-web extension does, so we ship one flag for v1. If product later wants to gate seedless separately, add `FUSION_QUICK_SWAPS_SEEDLESS` and broaden `useQuickSwaps().isAvailable` accordingly.

`useQuickSwaps().isAvailable` evaluates to:

```
postHogFlags[FUSION_QUICK_SWAPS] === true
  && wallet.type !== WalletType.LEDGER
  && wallet.type !== WalletType.LEDGER_LIVE
  && wallet.type !== WalletType.KEYSTONE
  && currentChain.namespace === 'eip155'
```

`WalletType` enum values: `UNSET, SEEDLESS, MNEMONIC, PRIVATE_KEY, LEDGER, LEDGER_LIVE, KEYSTONE` (from `services/wallet/types.ts`). We exclude hardware wallets and allow the rest by default — including `PRIVATE_KEY` and `MNEMONIC`. Active wallet read via `useActiveWallet()` from `common/hooks/useActiveWallet`.

The capability-framework abstraction from core-web (`useIsFeatureEnabled('WALLET_CAPABILITY_QUICK_SWAPS')`) is intentionally not ported. We are the first user; YAGNI.

## Testing strategy

### Unit tests (Jest, colocated)

- `utils/quickSwapsLimits.test.ts` — `'unlimited'` always false; boundary at limit (false at `==`, true at `>`); below-limit false; **`undefined` amountUsd returns true**; Big.js precision smoke test.
- `utils/quickSwapsFee.test.ts` — `'low' → slow`, `'medium' → normal`, `'high' → fast`; returns `undefined` when `suggestedFees` empty/missing.
- `hooks/useQuickSwaps.test.ts` — `isAvailable` matrix: PostHog off, Ledger, Keystone, non-EVM chain all false; seedless/mnemonic + EVM + flag on true. `isEnabled` reflects redux. `isAmountOverLimit` delegates to util.
- `store/settings/advanced/slice.test.ts` *(extend)* — three new reducers, defaults check.
- `store/migrations.test.ts` *(extend with key `29` cases)* — fresh state default-filled; existing state preserved (idempotent); other-corrupt-fields tolerated.

### Component tests (RTL)

- `AdvancedSettingsScreen.test.tsx` — renders the screen with title and subtitle. Quick Swaps row visible when `isAvailable=true`; absent (or rendered with a disabled state — match Figma when designs land for the disabled case) when `isAvailable=false`.
- `QuickSwapsToggleRow.test.tsx` — toggle state from redux; toggle dispatches; reveal hidden when disabled, visible when enabled; fee-picker tap dispatches; amount-limit row tap navigates.
- `SwapAmountLimitScreen.test.tsx` — five options render with current selection marked; tap dispatches and pops.

### Integration tests

- `swap/contexts/SwapContext.test.tsx` *(extend)* — quick-swaps disabled → `transferAsset` called with only `{ estimateGasMarginBps }`. Enabled with `feeSetting='medium'` → called with `{ estimateGasMarginBps, maxFeePerGas, maxPriorityFeePerGas }` from normal tier. Fee suggestion throws → `transferAsset` still called without override; `Logger.warn` triggered.
- `swap/screens/SwapScreen.test.tsx` *(extend)* — Swap button disabled + inline copy when over-limit. "Can't determine swap value" copy when `fromAmountUsd` undefined. Quick Swaps disabled → control case unchanged.
- `swap/hooks/useQuoteStreaming.test.ts` *(extend)* — Markr-gasless filtered when enabled; pass through when disabled.
- `swap/store/listeners.test.ts` *(extend)* — `QuickSwapsToggled` and `SwapBlockedByQuickSwapLimit` fire at expected moments. Quick-swap fields populated on `SwapConfirmed`.

### E2E smoke tests (Appium)

Two flows under existing settings/swap suites, smoke-tagged:

1. **Settings persistence:** Advanced settings → toggle Quick Swaps on → set fee tier Fast → set Swap amount limit $5,000 → kill and relaunch → all three persisted.
2. **Limit blocks swap:** set limit $1,000 → enter swap amount > $1,000 → Swap button disabled, inline limit message visible.

E2E intentionally skipped for: telemetry, fee-tier-applied-to-tx (network-flaky, unit-tested at SwapContext), feature-flag toggling, hardware-wallet flow.

## Open implementation questions

These do not block writing the plan; they are resolved during implementation:

1. **Markr-gasless quote discriminator:** confirm the field on `Quote` to filter on (`serviceType === 'MARKR_GASLESS'` is the working assumption).
2. **Fee suggestion source for the active EVM chain — RESOLVED: Option B, direct `useNetworkFee`.** `useNetworkFee(fromNetwork)` (at `app/hooks/useNetworkFee.tsx`) already returns `NetworkFees` with `low/medium/high` tiers, each carrying `{ maxFeePerGas: bigint; maxPriorityFeePerGas?: bigint }`. `SwapContext` already derives `fromNetwork`; the hook is already in use inside `useFeeEstimation`. In `SwapContext.swap()`, call `useNetworkFee(fromNetwork)` (or read its cached query value) and adapt the result into `SuggestedGasFees` via `{ slow: networkFee.low, normal: networkFee.medium, fast: networkFee.high }` before passing it to `mapFeeSettingToGasSettings`. No new RPC call or `FusionService` helper needed. `useFeeEstimation` was ruled out because it returns a `totalFee` aggregate, not the per-tier gas-price pair. The 2-second timeout applies to the `useNetworkFee` query via React Query's `staleTime`/`refetchInterval` — on a cache miss, add a `Promise.race` with a 2 s timeout before the `swap()` proceeds; on timeout or error, omit the override and `Logger.warn`.
3. **`SwapAmountLimitScreen` copy and final visual:** Figma frame for the detail screen does not exist. v1 follows the existing Spend Limit pattern (drill-in screen with selectable rows). Flag for design review post-merge.
4. **Coordination with the "Filter out small UTXOs" ticket:** the same Figma frame shows that row above ours. Whichever ticket lands first builds `AdvancedSettingsScreen.tsx`; the second amends it. Confirm sequencing with the other ticket's owner.
5. **`fromAmountUsd` lifting in SwapContext:** the value is currently derived inline at analytics-capture time. The form-level limit check needs it pre-submit. Confirm whether to expose it via context, derive it again on `SwapScreen` from the same inputs, or move the computation to a shared hook.
6. **`isAmountOverLimit` currency semantics if user changes display currency between sessions:** spec says no conversion (matches web). Confirm at design review.
7. **Capability framework parity:** confirm with product that one PostHog flag is sufficient; only add `FUSION_QUICK_SWAPS_SEEDLESS` if a separate rollout cohort is wanted.

## Follow-ups (not files yet — suggest at PR time)

- **Blockaid transaction-batch validation as additional Quick Swaps fallback gate.** Web uses Blockaid to verify a swap+approve batch is "Benign" before auto-approving; if not, it falls back to manual approval. Mobile's `BlockaidService` only supports `scanSite` today. Adding transaction scanning would mirror the strongest part of web's safety story. Worth filing once this lands.

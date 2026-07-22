# CP-14874 Deposit Percentage Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch the perps deposit quick-amount buttons from fixed $100/$250/$500 to the widget's default 25%/50%/Max of wallet balance.

**Architecture:** `TokenUnitInputWidget` (k2-alpine) already renders `25% / 50% / Max` percentage buttons by default when no `presets` prop is passed — it computes amounts with `balance.mul(percent)` and `Max` uses `maxPercentage` (default `1` = 100%). The whole change is deleting the fixed-preset override in `PerpetualsDepositScreen`. A screen test pins the regression by asserting the widget receives no `presets` override.

**Tech Stack:** React Native, Jest + react-test-renderer (existing perps screen-test pattern: mock `@avalabs/k2-alpine`, `ScrollScreen`, `expo-router`).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-22-cp14874-deposit-percentage-presets-design.md`
- No k2-alpine changes. Do not touch `PerpetualsCloseScreen` (`MARKET_PRESETS`) or predictions screens — their presets are intentional.
- No preset-disabling logic for the 10 USDC minimum; existing inline validation handles amounts below minimum.
- Run commands from `packages/core-mobile/`.

---

### Task 1: Remove fixed deposit presets so the widget default (25%/50%/Max) applies

**Files:**
- Modify: `packages/core-mobile/app/new/features/trade/perpetuals/screens/PerpetualsDepositScreen.tsx` (delete `DEPOSIT_PRESETS` const at lines 22-26 and the `presets={DEPOSIT_PRESETS}` prop at line 88)
- Test (create): `packages/core-mobile/app/new/features/trade/perpetuals/screens/PerpetualsDepositScreen.test.tsx`

**Interfaces:**
- Consumes: `TokenUnitInputWidget` from `@avalabs/k2-alpine` — when its `presets` prop is `undefined`, the widget renders default `25% / 50% / Max` buttons computed from its `balance` prop.
- Produces: nothing consumed by later tasks (single-task plan).

- [ ] **Step 1: Write the failing test**

Create `packages/core-mobile/app/new/features/trade/perpetuals/screens/PerpetualsDepositScreen.test.tsx`:

```tsx
import React from 'react'
import renderer, { act } from 'react-test-renderer'

// Captures the props the screen passes to the widget so we can assert the
// fixed-dollar presets override is gone (CP-14874: default 25%/50%/Max).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const widgetProps: { current: any } = { current: undefined }

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() })
}))

jest.mock('common/components/ScrollScreen', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ScrollScreen: ({ children, renderFooter }: any) =>
      r.createElement(
        rn.View,
        null,
        children,
        renderFooter ? renderFooter() : null
      )
  }
})

jest.mock('@avalabs/k2-alpine', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  const pass =
    (C: React.ElementType) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ children, sx: _sx, variant: _v, ...rest }: any) =>
      r.createElement(C, rest, children)
  return {
    View: pass(rn.View),
    Text: pass(rn.Text),
    Button: () => null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TokenUnitInputWidget: (props: any) => {
      widgetProps.current = props
      return null
    }
  }
})

import { PerpetualsDepositScreen } from './PerpetualsDepositScreen'

describe('PerpetualsDepositScreen quick-amount presets', () => {
  it('does not override the widget default 25%/50%/Max percentage presets', async () => {
    await act(async () => {
      renderer.create(<PerpetualsDepositScreen />)
    })
    // No `presets` prop → TokenUnitInputWidget falls back to its built-in
    // 25% / 50% / Max buttons computed from `balance`.
    expect(widgetProps.current.presets).toBeUndefined()
    expect(widgetProps.current.balance).toBeDefined()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `packages/core-mobile/`):
```bash
yarn test app/new/features/trade/perpetuals/screens/PerpetualsDepositScreen.test.tsx
```
Expected: FAIL — `expect(widgetProps.current.presets).toBeUndefined()` receives the `DEPOSIT_PRESETS` array (`[{label: '$100', value: 100}, ...]`).

- [ ] **Step 3: Remove the fixed presets from the screen**

In `packages/core-mobile/app/new/features/trade/perpetuals/screens/PerpetualsDepositScreen.tsx`:

Delete this block (lines 22-26):
```ts
const DEPOSIT_PRESETS = [
  { label: '$100', value: 100 },
  { label: '$250', value: 250 },
  { label: '$500', value: 500 }
] as const
```

And delete this prop from the `TokenUnitInputWidget` element (line 88):
```tsx
        presets={DEPOSIT_PRESETS}
```

No other changes — `balance={walletBalance}` already feeds the default percentage buttons.

- [ ] **Step 4: Run the test to verify it passes**

Run (from `packages/core-mobile/`):
```bash
yarn test app/new/features/trade/perpetuals/screens/PerpetualsDepositScreen.test.tsx
```
Expected: PASS (1 test).

- [ ] **Step 5: Type-check and lint the touched files**

Run (from `packages/core-mobile/`):
```bash
yarn tsc
yarn lint
```
Expected: both exit 0 (no new errors; `DEPOSIT_PRESETS` unused-variable errors would appear here if Step 3 missed the const).

- [ ] **Step 6: Commit**

```bash
git add packages/core-mobile/app/new/features/trade/perpetuals/screens/PerpetualsDepositScreen.tsx packages/core-mobile/app/new/features/trade/perpetuals/screens/PerpetualsDepositScreen.test.tsx docs/superpowers/plans/2026-07-22-cp14874-deposit-percentage-presets.md
git commit -m "CP-14874: change deposit quick amounts to 25%/50%/Max percentages

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

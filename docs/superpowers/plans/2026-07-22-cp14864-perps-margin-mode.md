# CP-14864 Perps Margin Mode Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Cross/Isolated margin-mode selector to the perps Place Order flow (row on the Place Order screen + a "Margin mode" selection sheet), committed to Hyperliquid via the `isCross` flag on `updateLeverage`.

**Architecture:** A new `margin` route inside the existing `perpetualsPlaceOrder` Expo Router modal stack (mirrors the `leverage` route exactly). `marginMode` lives in `PlaceOrderContext`, seeded from Hyperliquid's per-coin `leverageType`. The sheet keeps a local draft and commits on Done via the existing `usePerpsPositionActions.updateLeverage`. Also fixes the Leverage screen's hard-coded `isCross: true`.

**Tech Stack:** React Native 0.85 / Expo Router, `@avalabs/k2-alpine` (GroupList, Button, Icons), `@avalabs/perps-sdk` (PerpsManager), Jest + react-test-renderer.

**Spec:** `docs/superpowers/specs/2026-07-22-cp14864-perps-margin-mode-design.md`

## Global Constraints

- All commands run from `packages/core-mobile/` (e.g. `yarn test <path>`, `yarn tsc`).
- NEVER use `fontWeight` to thicken Inter text — use `fontFamily: 'Inter-Medium'` etc. (see `docs/styles.md`).
- Copy user-facing strings **verbatim** from this plan (they come from Figma/core-web).
- Do NOT run `git commit` from the agent shell — commits on this repo are SSH-signed and the passphrase prompt hangs the shell. Each "Commit" step means `git add <files>` only; Bogdan commits at checkpoints.
- Feature paths below are relative to `packages/core-mobile/app/new/features/trade/perpetuals/`; route paths relative to `packages/core-mobile/app/new/routes/`.

---

### Task 1: Context + action plumbing (`marginMode`, `updateLeverage` success message)

**Files:**
- Modify: `packages/core-mobile/app/new/features/trade/perpetuals/contexts/PlaceOrderContext.tsx`
- Modify: `packages/core-mobile/app/new/features/trade/perpetuals/hooks/usePerpsPositionActions.ts:181-205`

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `export type MarginMode = 'cross' | 'isolated'` from `PlaceOrderContext.tsx`.
  - `PlaceOrderState.marginMode: MarginMode` and `PlaceOrderState.setMarginMode: (value: MarginMode) => void` (initial value `'cross'` — Hyperliquid's default; consumers seed it from HL's `leverageType`).
  - `updateLeverage(coin: string, leverage: number, isCross: boolean, successMessage?: string): Promise<boolean>` — 4th param defaults to `'Leverage updated'`.

This is plumbing with no behavior of its own; it is exercised by the component tests in Tasks 2–4. Verification here is the type-checker plus existing tests.

- [ ] **Step 1: Add `MarginMode` to PlaceOrderContext**

In `contexts/PlaceOrderContext.tsx`:

Add below the `OrderSide` type (line 10):

```ts
export type MarginMode = 'cross' | 'isolated'
```

In `interface PlaceOrderState`, after the `leverage` / `setLeverage` pair (line 23), add:

```ts
  /**
   * Cross vs isolated margin for the coin. On Hyperliquid this is the
   * `isCross` flag of the per-coin leverage setting, not an order parameter.
   * Seeded from HL's `leverageType` by the consuming screens.
   */
  marginMode: MarginMode
  setMarginMode: (value: MarginMode) => void
```

In `PlaceOrderProvider`, after the `leverage` state (line 84), add:

```ts
  // HL's default for a fresh asset is cross; screens re-seed from the actual
  // per-coin `leverageType` once activeAssetData loads.
  const [marginMode, setMarginMode] = useState<MarginMode>('cross')
```

In the `useMemo` value object, after `setLeverage,` add `marginMode,` and `setMarginMode,`; add `marginMode,` to the dependency array (after `leverage,`).

- [ ] **Step 2: Add optional success message to `updateLeverage`**

In `hooks/usePerpsPositionActions.ts`, change the `updateLeverage` callback signature and snackbar line:

```ts
  const updateLeverage = useCallback(
    async (
      coin: string,
      leverage: number,
      isCross: boolean,
      successMessage = 'Leverage updated'
    ): Promise<boolean> => {
      if (!isManagerTradable(manager)) {
        showSnackbar('Connect a wallet to trade')
        return false
      }
      setBusy(true)
      try {
        await manager.updateLeverage({ coin, leverage, isCross })
        showSnackbar(successMessage)
        refreshAfterTrade()
        return true
      } catch (e) {
        reportOrderError(e, 'Failed to update leverage')
        return false
      } finally {
        setBusy(false)
      }
    },
    [manager, refreshAfterTrade]
  )
```

(Only the `successMessage` param and the `showSnackbar(successMessage)` line change; everything else stays as-is.)

- [ ] **Step 3: Verify types and existing tests**

Run: `yarn tsc`
Expected: no errors.

Run: `yarn test app/new/features/trade/perpetuals`
Expected: all existing perps tests PASS (nothing consumes the new fields yet).

- [ ] **Step 4: Stage**

```bash
git add app/new/features/trade/perpetuals/contexts/PlaceOrderContext.tsx app/new/features/trade/perpetuals/hooks/usePerpsPositionActions.ts
```

---

### Task 2: `PerpetualsMarginModeScreen` (TDD)

**Files:**
- Create: `packages/core-mobile/app/new/features/trade/perpetuals/screens/PerpetualsMarginModeScreen.tsx`
- Test: `packages/core-mobile/app/new/features/trade/perpetuals/screens/PerpetualsMarginModeScreen.test.tsx`

**Interfaces:**
- Consumes:
  - `usePlaceOrder()` → `{ coin, leverage, marginMode, setMarginMode }` and `type MarginMode` (Task 1).
  - `usePerpsPositionActions()` → `{ updateLeverage(coin, leverage, isCross, successMessage?), busy }` (Task 1).
  - `usePerpsActiveAssetData(coin)` → `{ leverageType: 'cross' | 'isolated' | undefined }`.
  - `useHyperliquidMarketContext(coin)` → `{ universe?: { onlyIsolated?: boolean } }`.
  - `usePerpsPositions()` → `{ positions: readonly AssetPosition[] }` (`p.position.coin`).
- Produces: `export const PerpetualsMarginModeScreen: () => JSX.Element` (default-exported by the route in Task 3). TestIDs `perpetuals_margin_mode_done`, rows via GroupList.

- [ ] **Step 1: Write the failing test**

Create `screens/PerpetualsMarginModeScreen.test.tsx` (mocking conventions copied from `PerpetualsPlaceOrderScreen.test.tsx`):

```tsx
import React from 'react'
import renderer, { act } from 'react-test-renderer'

const mockBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack })
}))

const mockSetMarginMode = jest.fn()
const mockCtx = { marginMode: 'cross' as 'cross' | 'isolated' }
jest.mock('../contexts/PlaceOrderContext', () => ({
  usePlaceOrder: () => ({
    coin: 'BTC',
    leverage: 2,
    marginMode: mockCtx.marginMode,
    setMarginMode: mockSetMarginMode
  })
}))

const mockUpdateLeverage = jest.fn()
jest.mock('../hooks/usePerpsPositionActions', () => ({
  usePerpsPositionActions: () => ({
    updateLeverage: mockUpdateLeverage,
    busy: false
  })
}))

const mockAsset = {
  leverageType: 'cross' as 'cross' | 'isolated' | undefined
}
jest.mock('../hooks/usePerpsActiveAssetData', () => ({
  usePerpsActiveAssetData: () => ({
    leverage: 2,
    leverageType: mockAsset.leverageType,
    maxBuySizeCoin: undefined,
    maxSellSizeCoin: undefined,
    isLoading: false,
    refetch: jest.fn()
  })
}))

const mockMarket = {
  universe: { onlyIsolated: false } as
    | { onlyIsolated?: boolean }
    | undefined
}
jest.mock('../hooks/useHyperliquidMarketContext', () => ({
  useHyperliquidMarketContext: () => ({
    universe: mockMarket.universe,
    assetCtx: undefined
  })
}))

// Only `position.coin` is read; keep the fixture minimal.
const mockPositions = { positions: [] as { position: { coin: string } }[] }
jest.mock('../hooks/usePerpsPositions', () => ({
  usePerpsPositions: () => ({ positions: mockPositions.positions })
}))

// ScrollScreen renders subtitle + children + footer, mirroring production.
jest.mock('common/components/ScrollScreen', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ScrollScreen: ({ children, renderFooter, subtitle }: any) =>
      r.createElement(
        rn.View,
        null,
        r.createElement(rn.Text, { testID: 'screen_subtitle' }, subtitle),
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
    // Render each row as a TouchableOpacity so tests can press/select rows,
    // with the accessory element rendered inside (checkmark detection).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    GroupList: ({ data }: any) =>
      r.createElement(
        rn.View,
        null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.map((item: any, i: number) =>
          r.createElement(
            rn.TouchableOpacity,
            {
              key: i,
              testID: `row_${item.title}`,
              onPress: item.onPress,
              disabled: item.onPress === undefined
            },
            r.createElement(rn.Text, null, item.title),
            item.accessory ?? null
          )
        )
      ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Button: ({ children, ...rest }: any) =>
      r.createElement(rn.View, rest, children),
    Icons: {
      Navigation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Check: (props: any) =>
          r.createElement(rn.View, { testID: 'checkmark', ...props })
      }
    },
    useTheme: () => ({ theme: { colors: { $textPrimary: '#fff' } } })
  }
})

import { PerpetualsMarginModeScreen } from './PerpetualsMarginModeScreen'

const DONE = 'perpetuals_margin_mode_done'

const render = async (): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(<PerpetualsMarginModeScreen />)
  })
  return instance
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const row = (instance: renderer.ReactTestRenderer, title: string): any =>
  instance.root.findByProps({ testID: `row_${title}` })

const hasCheckmark = (
  instance: renderer.ReactTestRenderer,
  title: string
): boolean =>
  row(instance, title).findAllByProps({ testID: 'checkmark' }).length > 0

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const doneButton = (instance: renderer.ReactTestRenderer): any =>
  instance.root.findByProps({ testID: DONE })

const pressDone = async (
  instance: renderer.ReactTestRenderer
): Promise<void> => {
  await act(async () => {
    await doneButton(instance).props.onPress()
  })
}

describe('PerpetualsMarginModeScreen', () => {
  beforeEach(() => {
    mockBack.mockReset()
    mockSetMarginMode.mockReset()
    mockUpdateLeverage.mockReset()
    mockCtx.marginMode = 'cross'
    mockAsset.leverageType = 'cross'
    mockMarket.universe = { onlyIsolated: false }
    mockPositions.positions = []
  })

  it('renders both options with the current mode checked', async () => {
    const instance = await render()
    expect(hasCheckmark(instance, 'Cross')).toBe(true)
    expect(hasCheckmark(instance, 'Isolated')).toBe(false)
  })

  it('selecting Isolated moves the checkmark without touching the exchange', async () => {
    const instance = await render()
    await act(async () => {
      row(instance, 'Isolated').props.onPress()
    })
    expect(hasCheckmark(instance, 'Isolated')).toBe(true)
    expect(hasCheckmark(instance, 'Cross')).toBe(false)
    expect(mockUpdateLeverage).not.toHaveBeenCalled()
  })

  it('Done commits the new mode via updateLeverage and navigates back', async () => {
    mockUpdateLeverage.mockResolvedValueOnce(true)
    const instance = await render()
    await act(async () => {
      row(instance, 'Isolated').props.onPress()
    })
    await pressDone(instance)
    expect(mockUpdateLeverage).toHaveBeenCalledWith(
      'BTC',
      2,
      false,
      'Margin mode updated'
    )
    expect(mockSetMarginMode).toHaveBeenCalledWith('isolated')
    expect(mockBack).toHaveBeenCalled()
  })

  it('Done with no change skips the exchange call and just closes', async () => {
    const instance = await render()
    await pressDone(instance)
    expect(mockUpdateLeverage).not.toHaveBeenCalled()
    expect(mockBack).toHaveBeenCalled()
  })

  it('stays open when the exchange update fails', async () => {
    mockUpdateLeverage.mockResolvedValueOnce(false)
    const instance = await render()
    await act(async () => {
      row(instance, 'Isolated').props.onPress()
    })
    await pressDone(instance)
    expect(mockBack).not.toHaveBeenCalled()
    expect(mockSetMarginMode).not.toHaveBeenCalledWith('isolated')
  })

  it('locks both options with an explanatory subtitle when a position is open', async () => {
    mockPositions.positions = [{ position: { coin: 'BTC' } }]
    const instance = await render()
    expect(row(instance, 'Cross').props.disabled).toBe(true)
    expect(row(instance, 'Isolated').props.disabled).toBe(true)
    const subtitle = instance.root.findByProps({ testID: 'screen_subtitle' })
    expect(subtitle.props.children).toBe(
      'Close your open position to change margin mode for this market'
    )
    await pressDone(instance)
    expect(mockUpdateLeverage).not.toHaveBeenCalled()
    expect(mockBack).toHaveBeenCalled()
  })

  it('does not lock for positions in other markets', async () => {
    mockPositions.positions = [{ position: { coin: 'ETH' } }]
    const instance = await render()
    expect(row(instance, 'Isolated').props.disabled).toBe(false)
  })

  it('disables Cross and seeds Isolated on isolated-only markets', async () => {
    mockMarket.universe = { onlyIsolated: true }
    const instance = await render()
    expect(row(instance, 'Cross').props.disabled).toBe(true)
    expect(row(instance, 'Isolated').props.disabled).toBe(false)
    expect(hasCheckmark(instance, 'Isolated')).toBe(true)
  })

  it('seeds the draft from HL leverageType', async () => {
    mockAsset.leverageType = 'isolated'
    const instance = await render()
    expect(hasCheckmark(instance, 'Isolated')).toBe(true)
    expect(mockSetMarginMode).toHaveBeenCalledWith('isolated')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test app/new/features/trade/perpetuals/screens/PerpetualsMarginModeScreen.test.tsx`
Expected: FAIL — `Cannot find module './PerpetualsMarginModeScreen'`.

- [ ] **Step 3: Implement the screen**

Create `screens/PerpetualsMarginModeScreen.tsx`:

```tsx
import { Button, GroupList, Icons, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { usePlaceOrder, type MarginMode } from '../contexts/PlaceOrderContext'
import { useHyperliquidMarketContext } from '../hooks/useHyperliquidMarketContext'
import { usePerpsActiveAssetData } from '../hooks/usePerpsActiveAssetData'
import { usePerpsPositionActions } from '../hooks/usePerpsPositionActions'
import { usePerpsPositions } from '../hooks/usePerpsPositions'

const CROSS_DESCRIPTION =
  'All cross positions share the same cross margin as collateral. In the event of liquidation, your cross margin balance and any remaining open positions under assets in this mode may be forfeited.'

const ISOLATED_DESCRIPTION =
  'Manage your risk on individual positions by restricting the amount of margin allocated to each. If the margin ratio of an isolated position reaches 100%, the position will be liquidated. Margin can be added or removed to individual positions in this mode.'

export const PerpetualsMarginModeScreen = (): JSX.Element => {
  const router = useRouter()
  const { theme } = useTheme()
  const { coin, leverage, marginMode, setMarginMode } = usePlaceOrder()
  const { updateLeverage, busy } = usePerpsPositionActions()
  const { leverageType } = usePerpsActiveAssetData(coin)
  const { universe } = useHyperliquidMarketContext(coin)
  const { positions } = usePerpsPositions()

  // Some (HIP-3) markets are isolated-only: cross margin is disabled on-exchange.
  const onlyIsolated = universe?.onlyIsolated === true

  // Hyperliquid rejects margin-mode changes while a position is open in the
  // market. The sheet still opens so the reason is visible (subtitle below).
  const locked = positions.some(
    p => p.position.coin.toUpperCase() === coin.toUpperCase()
  )

  // Local draft so a selection doesn't hit the exchange until Done.
  const [draftMode, setDraftMode] = useState<MarginMode>(marginMode)

  // Seed from HL's authoritative per-coin mode once it loads, but only before
  // the user picks an option (so we never fight an edit) — mirrors the
  // leverage seeding on PerpetualsLeverageScreen.
  const userTouchedRef = useRef(false)
  useEffect(() => {
    if (userTouchedRef.current || leverageType === undefined) {
      return
    }
    const mode = onlyIsolated ? 'isolated' : leverageType
    setDraftMode(mode)
    setMarginMode(mode)
  }, [leverageType, onlyIsolated, setMarginMode])

  const selectMode = useCallback((mode: MarginMode) => {
    userTouchedRef.current = true
    setDraftMode(mode)
  }, [])

  // Margin mode is the `isCross` flag of HL's per-coin leverage setting (there
  // is no standalone action), so committing re-pushes the current leverage
  // with the new flag.
  const handleConfirm = useCallback(async () => {
    if (locked || draftMode === marginMode) {
      router.back()
      return
    }
    const ok = await updateLeverage(
      coin,
      leverage,
      draftMode === 'cross',
      'Margin mode updated'
    )
    if (!ok) {
      return
    }
    setMarginMode(draftMode)
    router.back()
  }, [
    locked,
    draftMode,
    marginMode,
    updateLeverage,
    coin,
    leverage,
    setMarginMode,
    router
  ])

  const renderFooter = useCallback(
    () => (
      <Button
        type="primary"
        size="large"
        testID="perpetuals_margin_mode_done"
        disabled={busy}
        onPress={handleConfirm}>
        Done
      </Button>
    ),
    [busy, handleConfirm]
  )

  const checkmark = (
    <Icons.Navigation.Check color={theme.colors.$textPrimary} />
  )
  // Keeps row text width stable between selected/unselected states.
  const accessoryPlaceholder = <View sx={{ width: 24, height: 24 }} />

  const crossDisabled = locked || onlyIsolated
  const isolatedDisabled = locked

  return (
    <ScrollScreen
      isModal
      title="Margin mode"
      subtitle={
        locked
          ? 'Close your open position to change margin mode for this market'
          : 'Select which mode to use for your margin'
      }
      navigationTitle="Margin mode"
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ paddingTop: 8 }}>
        <GroupList
          subtitleVariant="caption"
          data={[
            {
              title: 'Cross',
              subtitle: CROSS_DESCRIPTION,
              accessory:
                draftMode === 'cross' ? checkmark : accessoryPlaceholder,
              onPress: crossDisabled ? undefined : () => selectMode('cross'),
              containerSx: crossDisabled ? { opacity: 0.4 } : undefined
            },
            {
              title: 'Isolated',
              subtitle: ISOLATED_DESCRIPTION,
              accessory:
                draftMode === 'isolated' ? checkmark : accessoryPlaceholder,
              onPress: isolatedDisabled
                ? undefined
                : () => selectMode('isolated'),
              containerSx: isolatedDisabled ? { opacity: 0.4 } : undefined
            }
          ]}
        />
      </View>
    </ScrollScreen>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test app/new/features/trade/perpetuals/screens/PerpetualsMarginModeScreen.test.tsx`
Expected: PASS (9 tests).

- [ ] **Step 5: Stage**

```bash
git add app/new/features/trade/perpetuals/screens/PerpetualsMarginModeScreen.tsx app/new/features/trade/perpetuals/screens/PerpetualsMarginModeScreen.test.tsx
```

---

### Task 3: Route wiring + "Margin mode" row on Place Order (TDD)

**Files:**
- Create: `packages/core-mobile/app/new/routes/(signedIn)/(modals)/perpetualsPlaceOrder/margin.tsx`
- Modify: `packages/core-mobile/app/new/routes/(signedIn)/(modals)/perpetualsPlaceOrder/_layout.tsx:18-19`
- Modify: `packages/core-mobile/app/new/features/trade/perpetuals/screens/PerpetualsPlaceOrderScreen.tsx`
- Test: `packages/core-mobile/app/new/features/trade/perpetuals/screens/PerpetualsPlaceOrderScreen.test.tsx`

**Interfaces:**
- Consumes: `PerpetualsMarginModeScreen` (Task 2), `marginMode`/`setMarginMode` from `usePlaceOrder()` and `leverageType` from `usePerpsActiveAssetData` (Task 1).
- Produces: route `/perpetualsPlaceOrder/margin`; a "Margin mode" GroupList row above "Add leverage".

- [ ] **Step 1: Extend the existing screen test (failing first)**

In `screens/PerpetualsPlaceOrderScreen.test.tsx`:

1. Capture `navigate` — replace the expo-router mock (top of file):

```ts
const mockBack = jest.fn()
const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, navigate: mockNavigate })
}))
```

2. Extend the `usePlaceOrder` mock with the Task 1 fields:

```ts
const mockSetMarginMode = jest.fn()
jest.mock('../contexts/PlaceOrderContext', () => ({
  usePlaceOrder: () => ({
    coin: 'BTC',
    side: 'long',
    entryPrice: 1,
    amount: 10,
    setAmount: jest.fn(),
    leverage: 2,
    liquidationPrice: 1,
    marginMode: 'cross',
    setMarginMode: mockSetMarginMode
  })
}))
```

3. Add `leverageType` to the mutable active-asset mock so the seeding effect can be driven:

```ts
const mockActiveAsset = {
  maxBuySizeCoin: 1.5 as number | undefined,
  maxSellSizeCoin: 1 as number | undefined,
  isLoading: false,
  leverageType: undefined as 'cross' | 'isolated' | undefined
}
```

and in the `usePerpsActiveAssetData` mock factory return `leverageType: mockActiveAsset.leverageType` instead of the hard-coded `undefined`.

4. Make the `GroupList` mock inspectable — in the `@avalabs/k2-alpine` mock factory replace `GroupList: () => null` with:

```ts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    GroupList: (props: any) =>
      r.createElement(rn.View, { testID: 'group_list', ...props }),
```

5. Add to `beforeEach`: `mockNavigate.mockReset()`, `mockSetMarginMode.mockReset()`, `mockActiveAsset.leverageType = undefined`.

6. Append a new describe block at the end of the file:

```tsx
describe('PerpetualsPlaceOrderScreen margin mode', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const marginRow = (instance: renderer.ReactTestRenderer): any =>
    instance.root
      .findAllByProps({ testID: 'group_list' })
      .map(list => list.props.data?.[0])
      .find(item => item?.title === 'Margin mode')

  it('shows the current margin mode and opens the margin sheet', async () => {
    const instance = await render()
    const item = marginRow(instance)
    expect(item).toBeDefined()
    expect(item.value.props.children).toBe('Cross')
    item.onPress()
    expect(mockNavigate).toHaveBeenCalledWith('/perpetualsPlaceOrder/margin')
  })

  it('seeds context marginMode from HL leverageType once loaded', async () => {
    mockActiveAsset.leverageType = 'isolated'
    await render()
    expect(mockSetMarginMode).toHaveBeenCalledWith('isolated')
  })
})
```

- [ ] **Step 2: Run the test to verify the new block fails**

Run: `yarn test app/new/features/trade/perpetuals/screens/PerpetualsPlaceOrderScreen.test.tsx`
Expected: the two new tests FAIL (`item` undefined / `mockSetMarginMode` not called); all pre-existing tests still PASS.

- [ ] **Step 3: Add the row + seeding to the Place Order screen**

In `screens/PerpetualsPlaceOrderScreen.tsx`:

1. Destructure the new context fields (in the `usePlaceOrder()` call, after `setLeverage,`):

```ts
    marginMode,
    setMarginMode,
```

2. Destructure `leverageType` from `usePerpsActiveAssetData(coin)` (after `leverage: hlLeverage,`):

```ts
    leverageType,
```

3. Below the existing leverage-seeding effect (after line 100), add:

```ts
  // Same seeding pattern for the margin mode: HL persists cross/isolated per
  // coin, so reflect the actual value instead of the local 'cross' default.
  const seededMarginModeRef = useRef(false)
  useEffect(() => {
    if (seededMarginModeRef.current || leverageType === undefined) {
      return
    }
    seededMarginModeRef.current = true
    setMarginMode(leverageType)
  }, [leverageType, setMarginMode])
```

4. Next to `handleAddLeverage` (line 148), add:

```ts
  const handleMarginMode = useCallback(() => {
    router.navigate('/perpetualsPlaceOrder/margin')
  }, [router])
```

5. In the JSX, inside the `<View sx={{ gap: 20 }}>` that holds the leverage GroupList (line 315), add a new GroupList **above** the "Add leverage" one:

```tsx
            <GroupList
              titleSx={{ fontFamily: 'Inter-Regular' }}
              data={[
                {
                  title: 'Margin mode',
                  onPress: handleMarginMode,
                  value: (
                    <Text variant="body1" sx={{ color: '$textSecondary' }}>
                      {marginMode === 'cross' ? 'Cross' : 'Isolated'}
                    </Text>
                  )
                }
              ]}
            />
```

- [ ] **Step 4: Run the screen tests to verify they pass**

Run: `yarn test app/new/features/trade/perpetuals/screens/PerpetualsPlaceOrderScreen.test.tsx`
Expected: PASS (all pre-existing + 2 new).

- [ ] **Step 5: Add the route**

Create `routes/(signedIn)/(modals)/perpetualsPlaceOrder/margin.tsx` (mirror of `leverage.tsx`):

```tsx
import { PerpetualsMarginModeScreen } from 'features/trade/perpetuals/screens/PerpetualsMarginModeScreen'

export { PerpetualsMarginModeScreen as default }
```

In `routes/(signedIn)/(modals)/perpetualsPlaceOrder/_layout.tsx`, add after the `leverage` screen (line 18):

```tsx
        <Stack.Screen name="margin" options={stackScreensOptions} />
```

- [ ] **Step 6: Type-check**

Run: `yarn tsc`
Expected: no errors.

- [ ] **Step 7: Stage**

```bash
git add "app/new/routes/(signedIn)/(modals)/perpetualsPlaceOrder/margin.tsx" "app/new/routes/(signedIn)/(modals)/perpetualsPlaceOrder/_layout.tsx" app/new/features/trade/perpetuals/screens/PerpetualsPlaceOrderScreen.tsx app/new/features/trade/perpetuals/screens/PerpetualsPlaceOrderScreen.test.tsx
```

---

### Task 4: Leverage screen `isCross` fix (TDD)

**Files:**
- Modify: `packages/core-mobile/app/new/features/trade/perpetuals/screens/PerpetualsLeverageScreen.tsx:15-16,51`
- Test (create): `packages/core-mobile/app/new/features/trade/perpetuals/screens/PerpetualsLeverageScreen.test.tsx`

**Interfaces:**
- Consumes: `marginMode` from `usePlaceOrder()` (Task 1), `updateLeverage(coin, leverage, isCross, successMessage?)` (Task 1).
- Produces: leverage commits preserve the user's margin mode instead of forcing cross.

**Why:** `PerpetualsLeverageScreen.tsx:51` calls `updateLeverage(coin, draftLeverage, true)` — with Isolated selectable, confirming leverage would silently flip the user back to cross margin.

- [ ] **Step 1: Write the failing test**

Create `screens/PerpetualsLeverageScreen.test.tsx`:

```tsx
import React from 'react'
import renderer, { act } from 'react-test-renderer'

const mockBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack })
}))

const mockSetLeverage = jest.fn()
const mockCtx = { marginMode: 'isolated' as 'cross' | 'isolated' }
jest.mock('../contexts/PlaceOrderContext', () => ({
  usePlaceOrder: () => ({
    coin: 'BTC',
    side: 'long',
    entryPrice: 100,
    maxLeverage: 40,
    leverage: 2,
    setLeverage: mockSetLeverage,
    marginMode: mockCtx.marginMode
  })
}))

const mockUpdateLeverage = jest.fn()
jest.mock('../hooks/usePerpsPositionActions', () => ({
  usePerpsPositionActions: () => ({
    updateLeverage: mockUpdateLeverage,
    busy: false
  })
}))

jest.mock('../hooks/usePerpsActiveAssetData', () => ({
  usePerpsActiveAssetData: () => ({
    leverage: 2,
    leverageType: mockCtx.marginMode,
    maxBuySizeCoin: undefined,
    maxSellSizeCoin: undefined,
    isLoading: false,
    refetch: jest.fn().mockResolvedValue(3)
  })
}))

jest.mock('common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: () => ({ formatCurrency: () => '$0' })
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Button: ({ children, ...rest }: any) =>
      r.createElement(rn.View, rest, children),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    LeverageGauge: (props: any) => r.createElement(rn.View, props)
  }
})

import { PerpetualsLeverageScreen } from './PerpetualsLeverageScreen'

const render = async (): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(<PerpetualsLeverageScreen />)
  })
  return instance
}

describe('PerpetualsLeverageScreen margin mode', () => {
  beforeEach(() => {
    mockBack.mockReset()
    mockUpdateLeverage.mockReset()
    mockSetLeverage.mockReset()
  })

  it('commits leverage with the isCross flag from the current margin mode', async () => {
    mockCtx.marginMode = 'isolated'
    mockUpdateLeverage.mockResolvedValueOnce(true)
    const instance = await render()

    const gauge = instance.root.findByProps({ min: 1 })
    await act(async () => {
      gauge.props.onChange(5)
    })
    const done = instance.root.findByProps({
      testID: 'perpetuals_leverage_done'
    })
    await act(async () => {
      await done.props.onPress()
    })

    expect(mockUpdateLeverage).toHaveBeenCalledWith('BTC', 5, false)
    expect(mockBack).toHaveBeenCalled()
  })

  it('keeps isCross=true for cross-margin users', async () => {
    mockCtx.marginMode = 'cross'
    mockUpdateLeverage.mockResolvedValueOnce(true)
    const instance = await render()

    const gauge = instance.root.findByProps({ min: 1 })
    await act(async () => {
      gauge.props.onChange(5)
    })
    const done = instance.root.findByProps({
      testID: 'perpetuals_leverage_done'
    })
    await act(async () => {
      await done.props.onPress()
    })

    expect(mockUpdateLeverage).toHaveBeenCalledWith('BTC', 5, true)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test app/new/features/trade/perpetuals/screens/PerpetualsLeverageScreen.test.tsx`
Expected: first test FAILS — `updateLeverage` called with `('BTC', 5, true)` instead of `('BTC', 5, false)`.

- [ ] **Step 3: Fix the screen**

In `screens/PerpetualsLeverageScreen.tsx`:

1. Add `marginMode` to the context destructuring (line 15):

```ts
  const { coin, side, entryPrice, maxLeverage, leverage, setLeverage, marginMode } =
    usePlaceOrder()
```

2. In `handleConfirm` (line 51), replace the hard-coded `true`:

```ts
    // Preserve the user's margin mode — HL's updateLeverage sets cross vs
    // isolated via this flag, so `true` here would silently flip an isolated
    // user back to cross.
    const ok = await updateLeverage(coin, draftLeverage, marginMode === 'cross')
```

3. Add `marginMode` to the `handleConfirm` dependency array.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test app/new/features/trade/perpetuals/screens/PerpetualsLeverageScreen.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Stage**

```bash
git add app/new/features/trade/perpetuals/screens/PerpetualsLeverageScreen.tsx app/new/features/trade/perpetuals/screens/PerpetualsLeverageScreen.test.tsx
```

---

### Task 5: Full verification

**Files:** none new.

- [ ] **Step 1: Type-check the package**

Run: `yarn tsc`
Expected: no errors.

- [ ] **Step 2: Run the whole perps test suite**

Run: `yarn test app/new/features/trade/perpetuals`
Expected: all suites PASS.

- [ ] **Step 3: Lint the touched files**

Run:

```bash
npx eslint app/new/features/trade/perpetuals/screens/PerpetualsMarginModeScreen.tsx \
  app/new/features/trade/perpetuals/screens/PerpetualsMarginModeScreen.test.tsx \
  app/new/features/trade/perpetuals/screens/PerpetualsPlaceOrderScreen.tsx \
  app/new/features/trade/perpetuals/screens/PerpetualsPlaceOrderScreen.test.tsx \
  app/new/features/trade/perpetuals/screens/PerpetualsLeverageScreen.tsx \
  app/new/features/trade/perpetuals/screens/PerpetualsLeverageScreen.test.tsx \
  app/new/features/trade/perpetuals/contexts/PlaceOrderContext.tsx \
  app/new/features/trade/perpetuals/hooks/usePerpsPositionActions.ts \
  "app/new/routes/(signedIn)/(modals)/perpetualsPlaceOrder/margin.tsx" \
  "app/new/routes/(signedIn)/(modals)/perpetualsPlaceOrder/_layout.tsx"
```

Expected: no errors.

- [ ] **Step 4: Report for manual verification**

Everything staged; Bogdan commits (SSH-signed) and device-verifies:
- Place Order shows "Margin mode — Cross ›" row above "Add leverage".
- Sheet matches Figma node 23278-24067; selecting Isolated + Done shows "Margin mode updated" and the row now reads Isolated.
- With an open position in the market, both options are locked with the explanatory subtitle.
- Changing leverage afterwards keeps the mode Isolated (Task 4 fix).

import React from 'react'
import renderer, { act } from 'react-test-renderer'

const mockBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack })
}))

const mockSetMarginMode = jest.fn()
const mockCtx = {
  marginMode: 'cross' as 'cross' | 'isolated',
  leverage: 2,
  // Shared from the layout's market subscription via PlaceOrderContext.
  universe: { onlyIsolated: false } as { onlyIsolated?: boolean } | undefined
}
jest.mock('../contexts/PlaceOrderContext', () => ({
  usePlaceOrder: () => ({
    coin: 'BTC',
    leverage: mockCtx.leverage,
    marginMode: mockCtx.marginMode,
    setMarginMode: mockSetMarginMode,
    universe: mockCtx.universe
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
    mockCtx.leverage = 2
    mockAsset.leverageType = 'cross'
    mockCtx.universe = { onlyIsolated: false }
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

  it('keeps Done enabled while locked even before HL data loads', async () => {
    // When locked, Done only dismisses the sheet — a slow or failed data load
    // must not trap the user behind a disabled button.
    mockPositions.positions = [{ position: { coin: 'BTC' } }]
    mockAsset.leverageType = undefined
    mockCtx.universe = undefined
    mockCtx.leverage = 0
    const instance = await render()
    expect(doneButton(instance).props.disabled).toBe(false)
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
    mockCtx.universe = { onlyIsolated: true }
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

  it('disables Done until the per-coin HL data has loaded', async () => {
    mockAsset.leverageType = undefined
    const instance = await render()
    expect(doneButton(instance).props.disabled).toBe(true)
  })

  it('disables Done until the universe has loaded', async () => {
    // Before the universe resolves, `onlyIsolated` reads false and Cross is
    // selectable — committing then could push an invalid cross update.
    mockCtx.universe = undefined
    const instance = await render()
    expect(doneButton(instance).props.disabled).toBe(true)
  })

  it('disables Done while the context leverage is not yet seeded', async () => {
    mockCtx.leverage = 0
    const instance = await render()
    expect(doneButton(instance).props.disabled).toBe(true)
  })

  it('still seeds the context when the user taps before HL data loads, preserving the draft', async () => {
    mockAsset.leverageType = undefined
    const instance = await render()
    await act(async () => {
      row(instance, 'Isolated').props.onPress()
    })
    expect(mockSetMarginMode).not.toHaveBeenCalled()

    mockAsset.leverageType = 'cross'
    await act(async () => {
      instance.update(<PerpetualsMarginModeScreen />)
    })
    // Context mirrors HL even after the tap; the user's draft is untouched.
    expect(mockSetMarginMode).toHaveBeenCalledWith('cross')
    expect(hasCheckmark(instance, 'Isolated')).toBe(true)
  })

  it('forces a Cross draft back to Isolated when onlyIsolated resolves late', async () => {
    // The universe and leverage queries are independent: the user can tap
    // Cross before the market is known to be isolated-only.
    mockCtx.universe = undefined
    const instance = await render()
    await act(async () => {
      row(instance, 'Cross').props.onPress()
    })
    expect(hasCheckmark(instance, 'Cross')).toBe(true)

    mockCtx.universe = { onlyIsolated: true }
    await act(async () => {
      instance.update(<PerpetualsMarginModeScreen />)
    })
    // The touched guard must not preserve a draft that is invalid on-exchange.
    expect(hasCheckmark(instance, 'Isolated')).toBe(true)
    expect(hasCheckmark(instance, 'Cross')).toBe(false)
    expect(mockSetMarginMode).toHaveBeenCalledWith('isolated')
  })
})

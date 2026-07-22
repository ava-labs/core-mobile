import React from 'react'
import renderer, { act } from 'react-test-renderer'

const mockBack = jest.fn()
const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, navigate: mockNavigate })
}))

const mockState = { isGeoBlocked: false }
const mockRecheck = jest.fn()
jest.mock('../hooks/usePerpsAvailability', () => ({
  usePerpsAvailability: () => ({
    isGeoBlocked: mockState.isGeoBlocked,
    isLoading: false,
    recheckGeoBlock: mockRecheck
  })
}))

const mockShowSnackbar = jest.fn()
jest.mock('common/utils/toast', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showSnackbar: (...args: any[]) => mockShowSnackbar(...args)
}))

jest.mock('../contexts/PlaceOrderContext', () => ({
  usePlaceOrder: () => ({
    coin: 'BTC',
    side: 'long',
    entryPrice: 1,
    amount: 10,
    setAmount: jest.fn(),
    leverage: 2,
    liquidationPrice: 1,
    marginMode: 'cross'
  })
}))

jest.mock('common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: () => ({ formatCurrency: () => '$0' })
}))

const mockOpenUrl = jest.fn()
jest.mock('common/hooks/useInAppBrowser', () => ({
  __esModule: true,
  default: () => ({ openUrl: mockOpenUrl })
}))

jest.mock('../hooks/useTriggerToggles', () => ({
  useTriggerToggles: () => ({
    takeProfit: { enabled: false, onToggle: jest.fn(), drillValue: '' },
    stopLoss: { enabled: false, onToggle: jest.fn(), drillValue: '' }
  })
}))

// Live market data + per-coin leverage. Mocked so the screen doesn't pull in
// PerpsProvider -> the wallet stack, and so size / leverage seeding have data.
const mockActiveAsset = {
  maxBuySizeCoin: 1.5 as number | undefined,
  maxSellSizeCoin: 1 as number | undefined,
  isLoading: false
}
const mockMarket = {
  universe: { szDecimals: 3, maxLeverage: 40 } as
    | { szDecimals?: number; maxLeverage?: number; onlyIsolated?: boolean }
    | undefined
}
jest.mock('../hooks/useHyperliquidMarketContext', () => ({
  useHyperliquidMarketContext: () => ({
    universe: mockMarket.universe,
    assetCtx: { markPx: '100' }
  })
}))

jest.mock('../hooks/usePerpsActiveAssetData', () => ({
  usePerpsActiveAssetData: () => ({
    leverage: undefined,
    maxBuySizeCoin: mockActiveAsset.maxBuySizeCoin,
    maxSellSizeCoin: mockActiveAsset.maxSellSizeCoin,
    isLoading: mockActiveAsset.isLoading,
    refetch: jest.fn()
  })
}))

// Real order submission + trading gate. Mocked so the screen doesn't pull in
// PerpsProvider -> store/account -> the wallet stack (which can't load under
// Jest), and so we can assert the submit/gate behaviour directly.
const mockSubmitOrder = jest.fn()
jest.mock('../hooks/usePerpsOrderSubmit', () => ({
  usePerpsOrderSubmit: () => ({
    submitting: false,
    submitOrder: mockSubmitOrder
  })
}))

const mockTrading = { isTradingEnabled: true }
jest.mock('../hooks/usePerpsEnableTradingGate', () => ({
  usePerpsEnableTradingGate: () => ({
    isTradingEnabled: mockTrading.isTradingEnabled,
    requireTradingEnabled: () => mockTrading.isTradingEnabled,
    enableTradingModal: null
  })
}))

jest.mock('../components/PerpsEnableTradingModal', () => ({
  PerpsEnableTradingModal: () => null
}))

jest.mock('../components/PositionPill', () => ({ PositionPill: () => null }))
jest.mock('../components/TriggerToggleCard', () => ({
  TriggerToggleCard: () => null
}))
jest.mock('../../../../assets/icons/hyperliquid-logo.svg', () => () => null)

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    alpha: (c: any) => c,
    View: pass(rn.View),
    Text: pass(rn.Text),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    GroupList: (props: any) =>
      r.createElement(rn.View, { testID: 'group_list', ...props }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CircularDial: (props: any) => r.createElement(rn.View, props),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SlidingButton: (props: any) => r.createElement(rn.View, props),
    useTheme: () => ({ theme: { colors: { $textPrimary: '#fff' } } })
  }
})

import { TERMS_OF_USE_URL } from 'common/consts/urls'
import { PerpetualsPlaceOrderScreen } from './PerpetualsPlaceOrderScreen'

const CONFIRM = 'perpetuals_place_order_confirm'

const render = async (): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(<PerpetualsPlaceOrderScreen />)
  })
  return instance
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const confirmButton = (instance: renderer.ReactTestRenderer): any =>
  instance.root.findAllByProps({ testID: CONFIRM })[0]

describe('PerpetualsPlaceOrderScreen geo-restriction', () => {
  beforeEach(() => {
    mockBack.mockReset()
    mockNavigate.mockReset()
    mockRecheck.mockReset()
    mockShowSnackbar.mockReset()
    mockSubmitOrder.mockReset()
    mockState.isGeoBlocked = false
    mockTrading.isTradingEnabled = true
    mockActiveAsset.maxBuySizeCoin = 1.5
    mockActiveAsset.maxSellSizeCoin = 1
    mockActiveAsset.isLoading = false
  })

  it('disables the confirm button when geo-blocked', async () => {
    mockState.isGeoBlocked = true
    const instance = await render()
    expect(confirmButton(instance).props.disabled).toBe(true)
  })

  it('aborts the order and warns when the fresh geo re-check is blocked', async () => {
    mockRecheck.mockResolvedValueOnce(true)
    const instance = await render()
    await act(async () => {
      await confirmButton(instance).props.onConfirm()
    })
    expect(mockShowSnackbar).toHaveBeenCalled()
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('fails closed — aborts the order and warns when the geo re-check itself fails', async () => {
    mockRecheck.mockRejectedValueOnce(new Error('re-check failed'))
    const instance = await render()
    await act(async () => {
      await confirmButton(instance).props.onConfirm()
    })
    expect(mockShowSnackbar).toHaveBeenCalled()
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('submits the order and dismisses when the fresh geo re-check passes', async () => {
    mockRecheck.mockResolvedValueOnce(false)
    mockSubmitOrder.mockResolvedValueOnce(true)
    const instance = await render()
    await act(async () => {
      await confirmButton(instance).props.onConfirm()
    })
    expect(mockRecheck).toHaveBeenCalled()
    expect(mockSubmitOrder).toHaveBeenCalled()
    expect(mockShowSnackbar).not.toHaveBeenCalled()
    expect(mockBack).toHaveBeenCalled()
  })

  it('uses Hyperliquid maxTradeSzs for the position dial maximum', async () => {
    const instance = await render()
    const dial = instance.root.findByProps({
      testID: 'perpetuals_place_order_amount'
    })

    // HL max buy size 1.5 BTC × $100 mark = $150 position notional.
    expect(dial.props.max).toBe(150)
    expect(dial.props.step).toBe(0.15)
  })

  it('makes fractional HL maximums an exact full-dial selection', async () => {
    mockActiveAsset.maxBuySizeCoin = 1.5037
    const instance = await render()
    const dial = instance.root.findByProps({
      testID: 'perpetuals_place_order_amount'
    })

    expect(dial.props.max).toBeCloseTo(150.37)
    expect(dial.props.max / dial.props.step).toBeCloseTo(1000)
  })

  it('disables confirmation while Hyperliquid maximum size is unavailable', async () => {
    mockActiveAsset.maxBuySizeCoin = undefined
    const instance = await render()
    expect(confirmButton(instance).props.disabled).toBe(true)
    expect(
      instance.root.findAllByProps({
        testID: 'perpetuals_place_order_amount'
      })
    ).toHaveLength(0)
    expect(
      instance.root.findAllByProps({
        testID: 'perpetuals_place_order_capacity_unavailable'
      }).length
    ).toBeGreaterThan(0)
  })

  it('shows loading instead of no-capacity copy while the limit loads', async () => {
    mockActiveAsset.maxBuySizeCoin = undefined
    mockActiveAsset.isLoading = true
    const instance = await render()
    const text = instance.root
      .findAll(node => node.children.includes('Loading position limit…'))
      .map(node => node.children.join(''))

    expect(text).not.toHaveLength(0)
    expect(
      instance.root.findAll(node =>
        node.children.includes('No available position capacity')
      )
    ).toHaveLength(0)
  })

  it('keeps the dial range valid when HL position capacity is below $1', async () => {
    mockActiveAsset.maxBuySizeCoin = 0.005
    const instance = await render()
    const dial = instance.root.findByProps({
      testID: 'perpetuals_place_order_amount'
    })

    expect(dial.props.max).toBe(0.5)
    expect(dial.props.step).toBe(0.0005)
  })

  it('stays on screen (order not submitted) when the order fails', async () => {
    mockRecheck.mockResolvedValueOnce(false)
    mockSubmitOrder.mockResolvedValueOnce(false)
    const instance = await render()
    await act(async () => {
      await confirmButton(instance).props.onConfirm()
    })
    expect(mockSubmitOrder).toHaveBeenCalled()
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('gates on trading setup — surfaces enable-trading and does not submit', async () => {
    mockTrading.isTradingEnabled = false
    mockRecheck.mockResolvedValueOnce(false)
    const instance = await render()
    await act(async () => {
      await confirmButton(instance).props.onConfirm()
    })
    expect(mockSubmitOrder).not.toHaveBeenCalled()
    expect(mockBack).not.toHaveBeenCalled()
  })
})

describe('PerpetualsPlaceOrderScreen terms of use', () => {
  beforeEach(() => {
    mockOpenUrl.mockReset()
  })

  it('opens the Terms of Use in the in-app browser when the link is pressed', async () => {
    const instance = await render()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const link: any = instance.root.findAllByProps({
      testID: 'perpetuals_place_order_terms_link'
    })[0]
    await act(async () => {
      link.props.onPress()
    })
    expect(mockOpenUrl).toHaveBeenCalledWith(TERMS_OF_USE_URL)
  })
})

describe('PerpetualsPlaceOrderScreen margin mode', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockMarket.universe = { szDecimals: 3, maxLeverage: 40 }
  })

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

  // Context `marginMode` seeding from HL lives in PlaceOrderProvider (see
  // PlaceOrderContext.test.tsx), not in this screen.
})

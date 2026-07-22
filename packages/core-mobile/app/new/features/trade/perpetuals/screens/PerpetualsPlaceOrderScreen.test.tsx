import React from 'react'
import renderer, { act } from 'react-test-renderer'

const mockBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, navigate: jest.fn() })
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

const mockSwitchSide = jest.fn()
const mockOrder = { side: 'long' as 'long' | 'short' }
jest.mock('../contexts/PlaceOrderContext', () => ({
  usePlaceOrder: () => ({
    coin: 'BTC',
    side: mockOrder.side,
    switchSide: mockSwitchSide,
    entryPrice: 1,
    amount: 10,
    setAmount: jest.fn(),
    leverage: 2,
    liquidationPrice: 1
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
jest.mock('../hooks/useHyperliquidMarketContext', () => ({
  useHyperliquidMarketContext: () => ({
    universe: { szDecimals: 3, maxLeverage: 40 },
    assetCtx: { markPx: '100' }
  })
}))

jest.mock('../hooks/usePerpsActiveAssetData', () => ({
  usePerpsActiveAssetData: () => ({
    leverage: undefined,
    leverageType: undefined,
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

const mockPillProps = jest.fn()
jest.mock('../components/PositionPill', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PositionPill: (props: any) => {
    mockPillProps(props)
    return null
  }
}))
jest.mock('../components/TriggerToggleCard', () => ({
  TriggerToggleCard: () => null
}))
jest.mock('../../../../assets/icons/hyperliquid-logo.svg', () => () => null)

const mockScrollScreenProps = jest.fn()
jest.mock('common/components/ScrollScreen', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ScrollScreen: ({ children, renderFooter, ...rest }: any) => {
      mockScrollScreenProps(rest)
      return r.createElement(
        rn.View,
        null,
        children,
        renderFooter ? renderFooter() : null
      )
    }
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
    GroupList: () => null,
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
    mockRecheck.mockReset()
    mockShowSnackbar.mockReset()
    mockSubmitOrder.mockReset()
    mockOrder.side = 'long'
    mockSwitchSide.mockReset()
    mockPillProps.mockReset()
    mockScrollScreenProps.mockReset()
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

describe('PerpetualsPlaceOrderScreen side select', () => {
  beforeEach(() => {
    mockOrder.side = 'long'
    mockSwitchSide.mockReset()
    mockPillProps.mockReset()
    mockScrollScreenProps.mockReset()
  })

  it('hands the context switchSide to the position pill', async () => {
    await render()
    expect(mockPillProps).toHaveBeenCalledWith(
      expect.objectContaining({ side: 'long', onChangeSide: mockSwitchSide })
    )
  })

  it('derives labels and capacity from the short side', async () => {
    mockOrder.side = 'short'
    const instance = await render()

    expect(confirmButton(instance).props.label).toBe('Slide to buy Short')
    expect(mockScrollScreenProps).toHaveBeenCalledWith(
      expect.objectContaining({
        subtitle: expect.stringContaining('go down')
      })
    )

    // Short capacity comes from maxSellSizeCoin (1 BTC × $100), not buy (1.5).
    const dial = instance.root.findByProps({
      testID: 'perpetuals_place_order_amount'
    })
    expect(dial.props.max).toBe(100)
  })
})

import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { usePerpsAvailability } from '../hooks/usePerpsAvailability'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ coin: 'BTC' }),
  useRouter: () => ({ push: mockPush })
}))

jest.mock('react-native-reanimated', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSharedValue: (value: any) => ({ value })
}))

jest.mock('../hooks/useHyperliquidMarketContext', () => ({
  useHyperliquidMarketContext: () => ({
    assetCtx: undefined,
    universe: undefined,
    pxDecimals: undefined
  })
}))

jest.mock('../hooks/usePerpsAvailability')
const mockUsePerpsAvailability = usePerpsAvailability as jest.Mock

// Mock the clearinghouse hook: it otherwise pulls in PerpsProvider -> the
// wallet/store stack (native modules that can't load under Jest), and it drives
// the footer's funded / unfunded / balance-unknown states.
const mockClearinghouse: {
  accountValueUsd: number | undefined
  isError: boolean
} = { accountValueUsd: 100, isError: false }
const mockRefetch = jest.fn()
jest.mock('../hooks/usePerpsClearinghouse', () => ({
  usePerpsClearinghouse: () => ({
    accountValueUsd: mockClearinghouse.accountValueUsd,
    isError: mockClearinghouse.isError,
    refetch: mockRefetch
  })
}))

// Mock the enable-trading gate: it otherwise pulls in PerpsProvider and the
// setup queries. It drives the footer's "Slide to enable trading" state.
const mockTradingGate = {
  isTradingEnabled: true,
  isTradingStatusLoading: false
}
jest.mock('../hooks/usePerpsEnableTradingGate', () => ({
  usePerpsEnableTradingGate: () => ({
    isTradingEnabled: mockTradingGate.isTradingEnabled,
    isTradingStatusLoading: mockTradingGate.isTradingStatusLoading,
    requireTradingEnabled: () => mockTradingGate.isTradingEnabled
  })
}))

jest.mock('../components/MarketChart', () => ({ MarketChart: () => null }))
jest.mock('../components/MarketDetailsHeader', () => ({
  MarketDetailsHeader: () => null
}))
jest.mock('../components/MarketStatistics', () => ({
  MarketStatistics: () => null
}))

jest.mock('../components/PerpsGeoRestrictionWarning', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    PerpsGeoRestrictionWarning: () =>
      r.createElement(rn.View, { testID: 'geo-warning' })
  }
})

// ScrollScreen renders its footer below the children, mirroring production.
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
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    View: (props: any) => r.createElement(rn.View, props, props.children),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Text: ({ children, ...rest }: any) =>
      r.createElement(rn.Text, rest, children),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Button: ({ children, ...rest }: any) =>
      r.createElement(rn.View, rest, children),
    SegmentedControl: () => null,
    // Pass props through so tests can invoke the slide handlers.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SlidingButton: (props: any) =>
      r.createElement(rn.View, { ...props, testID: 'sliding-button' }),
    Icons: {
      Custom: { TrendingArrowDown: () => null, TrendingArrowUp: () => null }
    },
    useTheme: () => ({ theme: { isDark: true, colors: {} } })
  }
})

import { PerpetualsDetailsScreen } from './PerpetualsDetailsScreen'

const render = async (): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(<PerpetualsDetailsScreen />)
  })
  return instance
}

describe('PerpetualsDetailsScreen footer', () => {
  beforeEach(() => {
    mockClearinghouse.accountValueUsd = 100
    mockClearinghouse.isError = false
    mockTradingGate.isTradingEnabled = true
    mockTradingGate.isTradingStatusLoading = false
    mockRefetch.mockClear()
    mockPush.mockClear()
  })

  it('shows the geo-restriction warning instead of the trade button when geo-blocked', async () => {
    mockUsePerpsAvailability.mockReturnValue({
      isGeoBlocked: true,
      isLoading: false
    })
    const instance = await render()
    expect(
      instance.root.findAllByProps({ testID: 'geo-warning' }).length
    ).toBeGreaterThan(0)
    expect(
      instance.root.findAllByProps({ testID: 'sliding-button' })
    ).toHaveLength(0)
  })

  it('shows the trade button when not geo-blocked', async () => {
    mockUsePerpsAvailability.mockReturnValue({
      isGeoBlocked: false,
      isLoading: false
    })
    const instance = await render()
    expect(
      instance.root.findAllByProps({ testID: 'sliding-button' }).length
    ).toBeGreaterThan(0)
    expect(
      instance.root.findAllByProps({ testID: 'geo-warning' })
    ).toHaveLength(0)
  })

  const slideLong = (instance: renderer.ReactTestRenderer): void => {
    const [slider] = instance.root.findAllByProps({
      testID: 'sliding-button'
    })
    slider?.props.onConfirmRight()
  }

  it('routes a Short / Long slide to the enable-trading sheet when setup is incomplete', async () => {
    mockUsePerpsAvailability.mockReturnValue({
      isGeoBlocked: false,
      isLoading: false
    })
    mockTradingGate.isTradingEnabled = false
    const instance = await render()
    slideLong(instance)
    expect(mockPush).toHaveBeenCalledWith(
      '/perpetualsEnableTrading?coin=BTC&side=long'
    )
  })

  it('routes a Short / Long slide to place-order when setup is complete', async () => {
    mockUsePerpsAvailability.mockReturnValue({
      isGeoBlocked: false,
      isLoading: false
    })
    const instance = await render()
    slideLong(instance)
    expect(mockPush).toHaveBeenCalledWith(
      '/perpetualsPlaceOrder?coin=BTC&side=long'
    )
  })

  it('routes to place-order (not enable-trading) while setup status is still loading', async () => {
    mockUsePerpsAvailability.mockReturnValue({
      isGeoBlocked: false,
      isLoading: false
    })
    // Cold load: `isTradingEnabled` is false only because the queries haven't
    // resolved — must not detour a set-up user; place-order's submit gate is
    // the backstop.
    mockTradingGate.isTradingEnabled = false
    mockTradingGate.isTradingStatusLoading = true
    const instance = await render()
    slideLong(instance)
    expect(mockPush).toHaveBeenCalledWith(
      '/perpetualsPlaceOrder?coin=BTC&side=long'
    )
  })

  it('shows a retry (not "Slide to deposit") when the balance can not be loaded', async () => {
    mockUsePerpsAvailability.mockReturnValue({
      isGeoBlocked: false,
      isLoading: false
    })
    // Outage: no balance data + error → must not mis-steer a funded user to
    // deposit; offer a retry instead.
    mockClearinghouse.accountValueUsd = undefined
    mockClearinghouse.isError = true
    const instance = await render()
    expect(
      instance.root.findAllByProps({
        testID: 'perpetuals_details_balance_retry'
      }).length
    ).toBeGreaterThan(0)
    expect(
      instance.root.findAllByProps({ testID: 'sliding-button' })
    ).toHaveLength(0)
  })
})

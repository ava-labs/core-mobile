import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { usePerpsAvailability } from '../hooks/usePerpsAvailability'

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ coin: 'BTC' }),
  useRouter: () => ({ push: jest.fn() })
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

jest.mock('../components/MarketChart', () => ({ MarketChart: () => null }))
jest.mock('../components/MarketDetailsHeader', () => ({
  MarketDetailsHeader: () => null
}))
jest.mock('../components/MarketStatistics', () => ({
  MarketStatistics: () => null
}))

jest.mock('../components/MarketHistory', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    MarketHistory: ({ coin }: { coin: string }) =>
      r.createElement(rn.View, {
        testID: 'market-history',
        accessibilityLabel: coin
      })
  }
})

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SlidingButton: (_props: any) =>
      r.createElement(rn.View, { testID: 'sliding-button' }),
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
    mockRefetch.mockClear()
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

  it('renders the market history section for the current coin', async () => {
    mockUsePerpsAvailability.mockReturnValue({
      isGeoBlocked: false,
      isLoading: false
    })
    const instance = await render()
    const history = instance.root.findAllByProps({ testID: 'market-history' })
    expect(history.length).toBeGreaterThan(0)
    expect(history[0]?.props.accessibilityLabel).toBe('BTC')
  })
})

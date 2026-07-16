import React from 'react'
import renderer, { act } from 'react-test-renderer'

const mockState = { isGeoBlocked: false }
jest.mock('../hooks/usePerpsAvailability', () => ({
  usePerpsAvailability: () => ({
    isGeoBlocked: mockState.isGeoBlocked,
    isLoading: false,
    recheckGeoBlock: jest.fn()
  })
}))

// Mutable so individual tests can drive the balance / error state.
const mockPositions: {
  accountValueUsd: number | undefined
  withdrawableUsd: number | undefined
  isError: boolean
  isLoading: boolean
  isWithdrawableLoading: boolean
  isWithdrawableUnavailable: boolean
} = {
  accountValueUsd: 0,
  withdrawableUsd: 0,
  isError: false,
  isLoading: false,
  isWithdrawableLoading: false,
  isWithdrawableUnavailable: false
}

jest.mock('../components/PerpsGeoRestrictionWarning', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    PerpsGeoRestrictionWarning: () =>
      r.createElement(rn.View, { testID: 'geo-warning' })
  }
})

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: jest.fn() })
}))

jest.mock('../hooks/usePerpsPositions', () => ({
  usePerpsPositions: () => ({
    positions: [],
    clearinghouse: undefined,
    accountValueUsd: mockPositions.accountValueUsd,
    withdrawableUsd: mockPositions.withdrawableUsd,
    mode: undefined,
    isLoading: mockPositions.isLoading,
    isWithdrawableLoading: mockPositions.isWithdrawableLoading,
    isWithdrawableUnavailable: mockPositions.isWithdrawableUnavailable,
    isError: mockPositions.isError,
    refetch: jest.fn()
  })
}))

jest.mock('common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: () => ({ formatCurrency: () => '$0' })
}))

jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    alpha: (c: any) => c,
    ActivityIndicator: pass(rn.ActivityIndicator),
    View: pass(rn.View),
    Text: pass(rn.Text),
    Button: () => null,
    GroupList: () => null,
    Icons: { Navigation: { ChevronRight: () => null } },
    useTheme: () => ({ theme: { colors: {} } })
  }
})

import { PerpetualsBalanceScreen } from './PerpetualsBalanceScreen'

const render = async (): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(<PerpetualsBalanceScreen />)
  })
  return instance
}

describe('PerpetualsBalanceScreen geo-restriction', () => {
  beforeEach(() => {
    mockState.isGeoBlocked = false
    mockPositions.accountValueUsd = 0
    mockPositions.withdrawableUsd = 0
    mockPositions.isError = false
    mockPositions.isLoading = false
    mockPositions.isWithdrawableLoading = false
    mockPositions.isWithdrawableUnavailable = false
  })

  it('shows the geo-restriction warning when geo-blocked', async () => {
    mockState.isGeoBlocked = true
    const instance = await render()
    expect(
      instance.root.findAllByProps({ testID: 'geo-warning' }).length
    ).toBeGreaterThan(0)
  })

  it('does not show the warning when not geo-blocked', async () => {
    const instance = await render()
    expect(
      instance.root.findAllByProps({ testID: 'geo-warning' })
    ).toHaveLength(0)
  })

  it('shows the API-down state (not a $0 balance) when the balance fetch errors', async () => {
    mockPositions.accountValueUsd = undefined
    mockPositions.isError = true
    const instance = await render()
    expect(
      instance.root.findAllByProps({ testID: 'perps-api-down' }).length
    ).toBeGreaterThan(0)
  })

  it('shows a loader instead of a temporary $0 while the balance loads', async () => {
    mockPositions.accountValueUsd = undefined
    mockPositions.isLoading = true
    const instance = await render()
    expect(
      instance.root.findAllByProps({ testID: 'perps-balance-loading' })
    ).not.toHaveLength(0)
  })

  it('shows a loader while the authoritative withdrawable fallback runs', async () => {
    mockPositions.withdrawableUsd = undefined
    mockPositions.isWithdrawableLoading = true
    const instance = await render()
    expect(
      instance.root.findAllByProps({ testID: 'perps-balance-loading' })
    ).not.toHaveLength(0)
  })

  it('shows unavailable instead of $0 when withdrawable cannot be resolved', async () => {
    mockPositions.withdrawableUsd = undefined
    mockPositions.isWithdrawableUnavailable = true
    const instance = await render()
    expect(
      instance.root.findAllByProps({ testID: 'perps-api-down' }).length
    ).toBeGreaterThan(0)
  })

  it('renders the balance overview when the fetch succeeds', async () => {
    mockPositions.accountValueUsd = 0
    mockPositions.isError = false
    const instance = await render()
    expect(
      instance.root.findAllByProps({ testID: 'perps-api-down' })
    ).toHaveLength(0)
  })
})

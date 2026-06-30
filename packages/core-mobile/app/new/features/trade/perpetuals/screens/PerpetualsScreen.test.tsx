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

jest.mock('../components/PerpsGeoRestrictionWarning', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    PerpsGeoRestrictionWarning: () =>
      r.createElement(rn.View, { testID: 'geo-warning' })
  }
})

// Render only the list header — that's where the warning lives.
jest.mock('common/components/CollapsibleTabList', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CollapsibleTabList: ({ renderHeader }: any) =>
    renderHeader ? renderHeader() : null
}))

jest.mock('common/components/CollapsibleTabs', () => ({
  CollapsibleTabs: { ContentWrapper: () => null }
}))
jest.mock('common/components/ErrorState', () => ({ ErrorState: () => null }))
jest.mock('common/utils/animations', () => ({
  getListItemEnteringAnimation: () => undefined
}))
jest.mock('features/trade/components/TradeFilters', () => ({
  TradeFilters: () => null
}))
jest.mock('../components/PerpetualListItem', () => ({
  PerpetualListItem: () => null
}))
jest.mock('../components/Positions', () => ({ Positions: () => null }))
jest.mock('../mocks', () => ({ PERP_MARKETS_MOCK: [] }))

jest.mock('expo-router', () => ({ useRouter: () => ({ navigate: jest.fn() }) }))
jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
}))
jest.mock('react-native-reanimated', () => {
  const rn = require('react-native') as typeof import('react-native')
  return { __esModule: true, default: { View: rn.View } }
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
    ActivityIndicator: () => null,
    PriceChangeStatus: { Up: 'up', Down: 'down', Neutral: 'neutral' },
    useTheme: () => ({ theme: { colors: {} } })
  }
})

import { PerpetualsScreen } from './PerpetualsScreen'

const render = async (): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(<PerpetualsScreen containerStyle={{}} />)
  })
  return instance
}

describe('PerpetualsScreen geo-restriction', () => {
  beforeEach(() => {
    mockState.isGeoBlocked = false
  })

  it('shows the geo-restriction warning in the header when geo-blocked', async () => {
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
})

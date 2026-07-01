import React from 'react'
import renderer, { act } from 'react-test-renderer'

const mockState = { isGeoBlocked: false }
jest.mock('../perpetuals/hooks/usePerpsAvailability', () => ({
  usePerpsAvailability: () => ({
    isGeoBlocked: mockState.isGeoBlocked,
    isLoading: false,
    recheckGeoBlock: jest.fn()
  })
}))

jest.mock('../perpetuals/components/PerpsGeoRestrictionWarning', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    PerpsGeoRestrictionWarning: () =>
      r.createElement(rn.View, { testID: 'geo-warning' })
  }
})

jest.mock('common/components/TokenLogo', () => ({ TokenLogo: () => null }))
jest.mock('common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: () => ({ formatCurrency: () => '$0' })
}))

jest.mock('@avalabs/k2-alpine', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  const pass =
    (C: React.ElementType) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ children, sx: _sx, variant: _v, style: _s, ...rest }: any) =>
      r.createElement(C, rest, children)
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    alpha: (c: any) => c,
    View: pass(rn.View),
    Text: pass(rn.Text),
    AnimatedPressable: pass(rn.View),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Button: ({ children }: any) => r.createElement(rn.Text, null, children),
    Icons: { Navigation: { ChevronRight: () => null } },
    usePreventParentPress: () => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createParentPressHandler: (fn: any) => fn,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createChildPressHandler: (fn: any) => fn
    }),
    useTheme: () => ({ theme: { colors: {} } })
  }
})

import { TradeBalance } from './TradeBalance'

const render = async (
  balance?: number
): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(<TradeBalance balance={balance} />)
  })
  return instance
}

const hasGeoWarning = (instance: renderer.ReactTestRenderer): boolean =>
  instance.root.findAllByProps({ testID: 'geo-warning' }).length > 0

describe('<TradeBalance /> geo-restriction', () => {
  beforeEach(() => {
    mockState.isGeoBlocked = false
  })

  it('shows the geo-restriction warning when geo-blocked with no funds', async () => {
    mockState.isGeoBlocked = true
    expect(hasGeoWarning(await render(0))).toBe(true)
  })

  it('shows the geo-restriction warning when geo-blocked with funds', async () => {
    mockState.isGeoBlocked = true
    expect(hasGeoWarning(await render(1000))).toBe(true)
  })

  it('does not show the warning when not geo-blocked', async () => {
    expect(hasGeoWarning(await render(1000))).toBe(false)
  })
})

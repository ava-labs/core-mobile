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

const hasText = (instance: renderer.ReactTestRenderer, text: string): boolean =>
  instance.root.findAll(
    node => node.children.length === 1 && node.children[0] === text
  ).length > 0

describe('<TradeBalance /> geo-restriction', () => {
  beforeEach(() => {
    mockState.isGeoBlocked = false
  })

  it('renders nothing when geo-blocked with no funds', async () => {
    mockState.isGeoBlocked = true
    expect((await render(0)).toJSON()).toBeNull()
  })

  it('shows the balance row without funding actions when geo-blocked with funds', async () => {
    mockState.isGeoBlocked = true
    const instance = await render(1000)
    expect(hasText(instance, 'Available balance')).toBe(true)
    expect(hasText(instance, 'Withdraw')).toBe(false)
    expect(hasText(instance, 'Top up')).toBe(false)
    expect(hasText(instance, 'Deposit funds')).toBe(false)
  })

  it('shows Withdraw / Top up when not geo-blocked with funds', async () => {
    const instance = await render(1000)
    expect(hasText(instance, 'Withdraw')).toBe(true)
    expect(hasText(instance, 'Top up')).toBe(true)
  })

  it('shows Deposit funds when not geo-blocked with no funds', async () => {
    const instance = await render(0)
    expect(hasText(instance, 'Deposit funds')).toBe(true)
  })
})

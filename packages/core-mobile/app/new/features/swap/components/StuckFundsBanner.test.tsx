import React from 'react'
import renderer, { act } from 'react-test-renderer'
import type { StuckRoute } from '../utils/stuckFundsRoutes'
import { StuckFundsBanner } from './StuckFundsBanner'

const mockRecover = jest.fn()

// Mock @avalabs/k2-alpine so we don't need a dripsy theme provider.
jest.mock('@avalabs/k2-alpine', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  const passthrough =
    (Component: React.ComponentType<unknown>) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ children, sx: _sx, variant: _v, ...rest }: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r.createElement(Component as any, rest as any, children)
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Text: passthrough(rn.Text as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    View: passthrough(rn.View as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Button: passthrough(rn.TouchableOpacity as any),
    Separator: () => null,
    Icons: { Navigation: { ExpandMore: () => null } },
    useTheme: () => ({ theme: { colors: { $textSecondary: '#888' } } })
  }
})

jest.mock('@avalabs/core-utils-sdk', () => ({
  TokenUnit: class {
    value: number
    constructor(amount: bigint, decimals: number) {
      this.value = Number(amount) / 10 ** decimals
    }
    toDisplay(): string {
      return String(this.value)
    }
  }
}))

const mockUseStuckAtomicFunds = jest.fn()
jest.mock('../hooks/useStuckAtomicFunds', () => ({
  useStuckAtomicFunds: () => mockUseStuckAtomicFunds()
}))

jest.mock('../hooks/useStuckFundsRecovery', () => ({
  stuckRouteKey: (route: StuckRoute) => `${route.source}-${route.dest}`,
  useStuckFundsRecovery: () => ({ recover: mockRecover, recoveringKey: null })
}))

jest.mock('../hooks/useZustandStore', () => ({
  useIsFusionServiceReady: () => [true]
}))

const setRoutes = (routes: StuckRoute[]): void => {
  mockUseStuckAtomicFunds.mockReturnValue({
    routes,
    totalNAvax: routes.reduce((acc, r) => acc + r.amountNAvax, 0n),
    hasAnyAtomics: routes.length > 0,
    invalidate: jest.fn()
  })
}

const flatten = (node: renderer.ReactTestRendererJSON | null): string => {
  if (!node) return ''
  return (node.children ?? [])
    .map(c => (typeof c === 'string' ? c : flatten(c)))
    .join('')
}

describe('StuckFundsBanner', () => {
  beforeEach(() => {
    mockRecover.mockReset()
  })

  it('renders nothing when there are no stranded funds', () => {
    setRoutes([])
    let tree!: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(<StuckFundsBanner />)
    })
    expect(tree.toJSON()).toBeNull()
  })

  it('shows the detected-funds title with the total amount', () => {
    setRoutes([{ source: 'C', dest: 'P', amountNAvax: 100_000_000n }])
    let tree!: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(<StuckFundsBanner />)
    })
    const text = flatten(tree.toJSON() as renderer.ReactTestRendererJSON)
    expect(text).toContain('Core has detected stuck funds')
    expect(text).toContain('0.1 AVAX')
  })

  it('expands to show route rows and Recover triggers recovery for that route', () => {
    const route: StuckRoute = {
      source: 'C',
      dest: 'P',
      amountNAvax: 100_000_000n
    }
    setRoutes([route])
    let tree!: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(<StuckFundsBanner />)
    })

    // expand
    const toggle = tree.root.findByProps({ testID: 'stuckFundsBanner_toggle' })
    act(() => {
      toggle.props.onPress()
    })

    const text = flatten(tree.toJSON() as renderer.ReactTestRendererJSON)
    expect(text).toContain('C-Chain to P-Chain')

    // tap Recover
    const recover = tree.root.findByProps({
      testID: 'stuckFundsBanner_recover_C_P'
    })
    act(() => {
      recover.props.onPress()
    })

    expect(mockRecover).toHaveBeenCalledWith(route)
  })
})

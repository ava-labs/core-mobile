import React from 'react'
import renderer, { act } from 'react-test-renderer'
import type { UserFill } from '@avalabs/perps-sdk'

const mockFills: { fills: UserFill[] } = { fills: [] }
jest.mock('../hooks/usePerpsUserFills', () => ({
  usePerpsUserFills: () => ({
    fills: mockFills.fills,
    isLoading: false,
    refetch: jest.fn()
  })
}))

jest.mock('common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: () => ({
    formatCurrency: ({ amount }: { amount: number }) => `$${amount.toFixed(2)}`
  })
}))

// Mock @avalabs/k2-alpine so we don't need a dripsy theme provider. GroupList
// renders each item's title/subtitle/value inside string host Views (not
// rn.View: composite RN Views forward testID to an inner host component and
// double-count in findAllByProps).
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
    GroupList: ({ data }: any) =>
      r.createElement(
        'View',
        { testID: 'group-list' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.map((item: any, i: number) =>
          r.createElement(
            'View',
            { testID: 'history-row', key: i },
            item.title,
            item.subtitle,
            item.value
          )
        )
      ),
    StatusArrow: () => null,
    PriceChangeStatus: { Up: 'up', Down: 'down', Neutral: 'neutral' },
    alpha: (color: string) => color,
    useTheme: () => ({
      theme: { isDark: false, colors: { $textPrimary: '#28282E' } }
    })
  }
})

import { MarketHistory } from './MarketHistory'

const fill = (overrides: Partial<UserFill> = {}): UserFill => ({
  closedPnl: '0',
  coin: 'ETH',
  crossed: false,
  dir: 'Open Long',
  hash: '0xabc',
  oid: 1,
  px: '63.06',
  side: 'B',
  startPosition: '0',
  sz: '0.0714',
  time: 1752969420000,
  tid: 100,
  ...overrides
})

const render = async (coin: string): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(<MarketHistory coin={coin} />)
  })
  return instance
}

describe('<MarketHistory />', () => {
  beforeEach(() => {
    mockFills.fills = []
  })

  it('renders nothing when there are no fills for the coin', async () => {
    mockFills.fills = [fill({ coin: 'BTC' })]
    const instance = await render('ETH')
    expect(instance.toJSON()).toBeNull()
  })

  it('renders the History heading and one row per fill of the coin', async () => {
    mockFills.fills = [
      fill({ coin: 'ETH', dir: 'Close Long', tid: 1, hash: '0x1' }),
      fill({ coin: 'ETH', dir: 'Open Long', tid: 2, hash: '0x2' }),
      fill({ coin: 'BTC', tid: 3, hash: '0x3' })
    ]
    const instance = await render('ETH')
    const json = JSON.stringify(instance.toJSON())
    expect(json).toContain('History')
    expect(json).toContain('Close Long')
    expect(json).toContain('Open Long')
    // subtitle: size (0.0714 * 63.06 = $4.50) @ price ($63.06)
    expect(json).toContain('$4.50 @ $63.06')
    // trailing timestamp from toPositionEntry, computed the same way the
    // production code formats it so the assertion holds in any runner TZ.
    const expectedTime = new Date(1752969420000).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
    expect(json).toContain(expectedTime)
    expect(
      instance.root.findAllByProps({ testID: 'history-row' })
    ).toHaveLength(2)
  })

  it('caps at the 5 most recent fills', async () => {
    mockFills.fills = [1, 2, 3, 4, 5, 6].map(n =>
      fill({ tid: n, hash: `0x${n}` })
    )
    const instance = await render('ETH')
    expect(
      instance.root.findAllByProps({ testID: 'history-row' })
    ).toHaveLength(5)
  })
})

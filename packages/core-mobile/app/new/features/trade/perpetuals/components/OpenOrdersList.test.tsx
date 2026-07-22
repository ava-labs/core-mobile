import React from 'react'
import renderer, { act } from 'react-test-renderer'
import type { InfoOrderStatusWire, OpenOrder } from '@avalabs/perps-sdk'

const richOrder = (over: Partial<InfoOrderStatusWire>): InfoOrderStatusWire =>
  ({
    coin: 'BTC',
    side: 'B',
    limitPx: '100',
    sz: '0.5',
    oid: 1,
    timestamp: 0,
    origSz: '0.5',
    triggerCondition: 'N/A',
    isTrigger: false,
    triggerPx: '0',
    children: [],
    isPositionTpsl: false,
    reduceOnly: false,
    orderType: 'Limit',
    tif: 'Gtc',
    cloid: null,
    ...over
  } as InfoOrderStatusWire)

const mockOrders: {
  orders: readonly (InfoOrderStatusWire | OpenOrder)[]
  isLoading: boolean
} = { orders: [], isLoading: false }
jest.mock('../hooks/usePerpsAllOpenOrders', () => ({
  usePerpsAllOpenOrders: () => mockOrders
}))

const mockCancelOrder = jest.fn()
jest.mock('../hooks/usePerpsPositionActions', () => ({
  usePerpsPositionActions: () => ({ busy: false, cancelOrder: mockCancelOrder })
}))

// Mocked so the component doesn't pull in PerpsProvider -> the wallet stack
// (which can't load under Jest).
const mockOnRefresh = jest.fn()
jest.mock('../hooks/usePerpsPullToRefresh', () => ({
  usePerpsPullToRefresh: () => ({
    isRefreshing: false,
    onRefresh: mockOnRefresh
  })
}))

jest.mock('common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: () => ({ formatCurrency: () => '$0' })
}))
jest.mock('./PerpsCoinLogo', () => ({ PerpsCoinLogo: () => null }))
jest.mock('common/components/CollapsibleTabList', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CollapsibleTabList: ({ data, renderItem, renderEmpty }: any) =>
      r.createElement(
        rn.View,
        null,
        data.length === 0
          ? renderEmpty()
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.map((item: any, index: number) =>
              r.createElement(
                rn.View,
                { key: index },
                renderItem({ item, index })
              )
            )
      )
  }
})
jest.mock('common/components/CollapsibleTabs', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    CollapsibleTabs: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ContentWrapper: ({ children }: any) =>
        r.createElement(rn.View, null, children)
    }
  }
})
jest.mock('common/components/ErrorState', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ErrorState: ({ title }: any) =>
      r.createElement(rn.Text, { testID: 'open_orders_empty' }, title)
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
    Button: ({ children, ...rest }: any) =>
      r.createElement(rn.View, rest, children),
    PriceChangeStatus: { Up: 'up', Down: 'down', Neutral: 'neutral' },
    StatusArrow: () => null,
    useTheme: () => ({
      theme: {
        colors: {
          $textPrimary: '#fff',
          $textSecondary: '#999',
          $textSuccess: '#0f0',
          $textDanger: '#f00',
          $borderPrimary: '#333',
          $surfaceSecondary: '#222'
        }
      }
    })
  }
})

import { OpenOrdersList, toOpenOrderRows } from './OpenOrdersList'

describe('toOpenOrderRows', () => {
  it('maps resting orders and drops trigger (TP/SL) legs', () => {
    const rows = toOpenOrderRows([
      richOrder({ oid: 1 }),
      richOrder({ oid: 2, isTrigger: true, orderType: 'Take Profit Market' }),
      // HIP-3 minimal row (no trigger metadata) is kept.
      {
        coin: 'xyz:GOLD',
        side: 'A',
        limitPx: '2000',
        sz: '1',
        oid: 3,
        timestamp: 0
      }
    ])
    expect(rows.map(r => r.oid)).toEqual([1, 3])
    expect(rows[0]).toMatchObject({
      coin: 'BTC',
      isLong: true,
      limitPx: 100,
      sizeContracts: 0.5,
      notionalUsd: 50
    })
    expect(rows[1]).toMatchObject({ ticker: 'GOLD', isLong: false })
  })
})

describe('OpenOrdersList', () => {
  beforeEach(() => {
    mockCancelOrder.mockReset()
    mockOrders.orders = []
    mockOrders.isLoading = false
  })

  it('shows the empty state when there are no open orders', async () => {
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(<OpenOrdersList />)
    })
    expect(
      instance.root.findAllByProps({ testID: 'open_orders_empty' }).length
    ).toBeGreaterThan(0)
  })

  it('disables only the tapped row while its cancel is in flight', async () => {
    mockOrders.orders = [
      richOrder({ oid: 1, coin: 'BTC' }),
      richOrder({ oid: 2, coin: 'ETH' })
    ]
    let resolveCancel!: (ok: boolean) => void
    mockCancelOrder.mockReturnValueOnce(
      new Promise<boolean>(resolve => {
        resolveCancel = resolve
      })
    )
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(<OpenOrdersList />)
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cancelFor = (oid: number): any =>
      instance.root.findAllByProps({
        testID: `open_order_cancel__${oid}`
      })[0]?.props

    act(() => {
      cancelFor(1).onPress()
    })
    // Only the tapped row dims — the other row's Cancel stays active.
    expect(cancelFor(1).disabled).toBe(true)
    expect(cancelFor(2).disabled).toBe(false)

    await act(async () => {
      resolveCancel(true)
    })
    expect(cancelFor(1).disabled).toBe(false)
  })

  it('cancels an order via usePerpsPositionActions', async () => {
    mockOrders.orders = [richOrder({ oid: 7, coin: 'ETH' })]
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(<OpenOrdersList />)
    })
    const cancel = instance.root.findAllByProps({
      testID: 'open_order_cancel__7'
    })[0]
    await act(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(cancel as any).props.onPress()
    })
    expect(mockCancelOrder).toHaveBeenCalledWith('ETH', 7)
  })
})

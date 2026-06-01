import React from 'react'
import renderer, { act } from 'react-test-renderer'

// Mock @avalabs/k2-alpine to avoid needing a dripsy theme provider.
jest.mock('@avalabs/k2-alpine', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    View: ({ children, sx: _sx, ...rest }: { children?: any; sx?: unknown; [k: string]: unknown }) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r.createElement(rn.View as any, rest as any, children),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Text: ({ children, sx: _sx, variant: _v, ...rest }: { children?: any; sx?: unknown; variant?: string; [k: string]: unknown }) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r.createElement(rn.Text as any, rest as any, children),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Button: ({ children, onPress, type: _t, size: _s, ...rest }: { children?: any; onPress?: () => void; type?: string; size?: string; [k: string]: unknown }) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r.createElement(rn.TouchableOpacity as any, { onPress, ...rest }, r.createElement(rn.Text as any, null, children)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    GroupList: ({ data }: { data: Array<{ title?: any; value?: any }> }) =>
      r.createElement(
        rn.View as any,
        null,
        ...data.map((item, i) =>
          r.createElement(
            rn.View as any,
            { key: i },
            r.createElement(rn.Text as any, null, item.title),
            typeof item.value === 'string'
              ? r.createElement(rn.Text as any, null, item.value)
              : item.value
          )
        )
      ),
    showAlert: jest.fn()
  }
})

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: jest.fn(), back: jest.fn(), dismissAll: jest.fn() })
}))

// Mock react-redux selectors
jest.mock('react-redux', () => ({
  useSelector: (selector: (s: unknown) => unknown) => {
    // Return stub values based on selector identity
    const { selectActiveAccount } = require('store/account')
    const { selectActiveNetwork } = require('store/network/slice')
    if (selector === selectActiveAccount) {
      return { addressC: '0xabc123' }
    }
    if (selector === selectActiveNetwork) {
      return { chainId: 43114 }
    }
    return undefined
  }
}))

// Mock store selectors
jest.mock('store/account', () => ({
  selectActiveAccount: jest.fn()
}))
jest.mock('store/network/slice', () => ({
  selectActiveNetwork: jest.fn()
}))

// Mock ScrollScreen
jest.mock('common/components/ScrollScreen', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ScrollScreen: ({ children, navigationTitle }: { children?: any; navigationTitle?: string }) =>
      r.createElement(rn.View as any, null,
        r.createElement(rn.Text as any, null, navigationTitle),
        children
      )
  }
})

// Mock AnalyticsService
jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
}))

// Mock cancel mutation hook
const mockMutate = jest.fn()
jest.mock('../hooks/useCancelRecurringSchedule', () => ({
  useCancelRecurringSchedule: () => ({ mutate: mockMutate, isPending: false })
}))

// Control schedules data per test
let mockSchedulesData: import('../types').Schedule[] | undefined = undefined

jest.mock('../hooks/useRecurringSchedules', () => ({
  useRecurringSchedules: () => ({ data: mockSchedulesData, isLoading: false }),
  RECURRING_SCHEDULES_QK: ['recurring_schedules']
}))

// Import AFTER mocks
// eslint-disable-next-line import/first
import { RecurringSchedulesScreen } from './RecurringSchedulesScreen'
// eslint-disable-next-line import/first
import type { Schedule } from '../types'

/**
 * Walk the rendered tree and collect all string leaf values.
 */
function collectText(
  node:
    | renderer.ReactTestRendererJSON
    | renderer.ReactTestRendererJSON[]
    | null
): string[] {
  if (!node) return []
  const texts: string[] = []
  const walk = (n: renderer.ReactTestRendererJSON | string | null | undefined): void => {
    if (!n) return
    if (typeof n === 'string') { texts.push(n); return }
    if (n.children) n.children.forEach(walk)
  }
  if (Array.isArray(node)) node.forEach(walk)
  else walk(node)
  return texts
}

function containsText(
  json: renderer.ReactTestRendererJSON | renderer.ReactTestRendererJSON[] | null,
  pattern: string | RegExp
): boolean {
  const all = collectText(json).join('')
  return typeof pattern === 'string' ? all.includes(pattern) : pattern.test(all)
}

const ACTIVE_SCHEDULE: Schedule = {
  orderId: '0xdeadbeef',
  owner: '0xabc123',
  chainId: 43114,
  tokenIn: '0xTokenIn',
  tokenOut: '0xTokenOut',
  amount: '100',
  numberOfOrders: 10,
  executedOrders: 2,
  remainingOrders: 8,
  frequency: { unit: 'week', value: 1 },
  totalAmountIn: '1000',
  tryCount: 0,
  failures: [],
  status: 'active',
  createdAt: 1700000000,
  nextExecutionAt: 1700604800
}

beforeEach(() => {
  mockSchedulesData = undefined
  mockMutate.mockReset()
})

describe('<RecurringSchedulesScreen />', () => {
  it('title contains "recurring swap" and "scheduled"', async () => {
    mockSchedulesData = [ACTIVE_SCHEDULE]
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(<RecurringSchedulesScreen />)
    })
    const json = instance.toJSON() as renderer.ReactTestRendererJSON | null
    expect(containsText(json, 'recurring swap')).toBe(true)
    expect(containsText(json, 'scheduled')).toBe(true)
  })

  it('renders "Remove recurrence" button for active schedule', async () => {
    mockSchedulesData = [ACTIVE_SCHEDULE]
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(<RecurringSchedulesScreen />)
    })
    const json = instance.toJSON() as renderer.ReactTestRendererJSON | null
    expect(containsText(json, 'Remove recurrence')).toBe(true)
  })

  it('does not render "Remove recurrence" button for completed schedule', async () => {
    mockSchedulesData = [{ ...ACTIVE_SCHEDULE, status: 'completed', nextExecutionAt: null }]
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(<RecurringSchedulesScreen />)
    })
    const json = instance.toJSON() as renderer.ReactTestRendererJSON | null
    expect(containsText(json, 'Remove recurrence')).toBe(false)
  })
})

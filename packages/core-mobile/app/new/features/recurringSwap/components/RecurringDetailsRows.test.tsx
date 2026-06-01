import React from 'react'
import renderer, { act } from 'react-test-renderer'

// Mock @avalabs/k2-alpine to use plain RN primitives so tests don't need a
// dripsy theme provider. The factory must use require() — no out-of-scope refs.
jest.mock('@avalabs/k2-alpine', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    Text: ({
      children,
      sx: _sx,
      variant: _v,
      ...rest
    }: {
      children?: any
      sx?: unknown
      variant?: string
      [k: string]: unknown
    }) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r.createElement(rn.Text as any, rest as any, children),

    View: ({
      children,
      sx: _sx,
      ...rest
    }: {
      children?: any
      sx?: unknown
      [k: string]: unknown
    }) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r.createElement(rn.View as any, rest as any, children),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    GroupList: ({ data }: { data: Array<{ title?: any; value?: any }> }) => {
      const rn2 = require('react-native') as typeof import('react-native')

      const r2 = require('react') as typeof import('react')
      return r2.createElement(
        rn2.View as any,
        null,
        ...data.map((item, i) =>
          r2.createElement(
            rn2.View as any,
            { key: i },
            r2.createElement(rn2.Text as any, null, item.title),
            typeof item.value === 'string'
              ? r2.createElement(rn2.Text as any, null, item.value)
              : item.value
          )
        )
      )
    }
  }
})

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: jest.fn() })
}))

// Mock RecurringSwapContext — we control state per test via the variable below.
let mockContextValue = {
  isRecurring: true,
  setIsRecurring: jest.fn(),
  frequency: undefined as import('../types').Frequency | undefined,
  setFrequency: jest.fn(),
  numberOfOrders: undefined as import('../types').NumberOfOrders | undefined,
  setNumberOfOrders: jest.fn()
}

jest.mock('../contexts/RecurringSwapContext', () => ({
  useRecurringSwapContext: () => mockContextValue
}))

// Import after mocks are registered.

import { RecurringDetailsRows } from './RecurringDetailsRows'

/**
 * Walk the rendered tree and collect all string leaf values.
 */
function collectText(
  node: renderer.ReactTestRendererJSON | renderer.ReactTestRendererJSON[] | null
): string[] {
  if (!node) return []
  const texts: string[] = []
  const walk = (
    n: renderer.ReactTestRendererJSON | string | null | undefined
  ): void => {
    if (!n) return
    if (typeof n === 'string') {
      texts.push(n)
      return
    }
    if (n.children) {
      n.children.forEach(walk)
    }
  }
  if (Array.isArray(node)) {
    node.forEach(walk)
  } else {
    walk(node)
  }
  return texts
}

function containsText(
  json:
    | renderer.ReactTestRendererJSON
    | renderer.ReactTestRendererJSON[]
    | null,
  pattern: string | RegExp
): boolean {
  const all = collectText(json).join('')
  if (typeof pattern === 'string') return all.includes(pattern)
  return pattern.test(all)
}

const baseProps = {
  amountPerOrder: undefined as string | undefined,
  fromTokenSymbol: undefined as string | undefined,
  toTokenSymbol: undefined as string | undefined,
  fromTokenDecimals: undefined as number | undefined
}

beforeEach(() => {
  mockContextValue = {
    isRecurring: true,
    setIsRecurring: jest.fn(),
    frequency: undefined,
    setFrequency: jest.fn(),
    numberOfOrders: undefined,
    setNumberOfOrders: jest.fn()
  }
})

describe('<RecurringDetailsRows />', () => {
  it('shows "Set" placeholder for frequency and number-of-orders when unset', async () => {
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(<RecurringDetailsRows {...baseProps} />)
    })
    const json = instance.toJSON() as
      | renderer.ReactTestRendererJSON
      | renderer.ReactTestRendererJSON[]
      | null
    expect(containsText(json, 'Frequency')).toBe(true)
    expect(containsText(json, 'Number of orders')).toBe(true)
    // Both placeholders should be "Set"
    const texts = collectText(json)
    const setCount = texts.filter(t => t === 'Set').length
    expect(setCount).toBeGreaterThanOrEqual(2)
  })

  it('renders bounded summary with correct text when frequency and orders are set', async () => {
    mockContextValue.frequency = { unit: 'week', value: 4 }
    mockContextValue.numberOfOrders = 4

    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(
        <RecurringDetailsRows
          amountPerOrder="15"
          fromTokenSymbol="LINK"
          toTokenSymbol="AVAX"
          fromTokenDecimals={18}
        />
      )
    })
    const json = instance.toJSON() as
      | renderer.ReactTestRendererJSON
      | renderer.ReactTestRendererJSON[]
      | null

    expect(
      containsText(
        json,
        'You will swap 15 LINK for AVAX every 4 weeks, for 4 orders.'
      )
    ).toBe(true)
    expect(
      containsText(json, 'First swap executes immediately after approval.')
    ).toBe(true)
  })

  it('shows "for an unlimited amount of time" and hides Estimated total spend when Unlimited', async () => {
    mockContextValue.frequency = { unit: 'week', value: 4 }
    mockContextValue.numberOfOrders = Infinity

    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(
        <RecurringDetailsRows
          amountPerOrder="15"
          fromTokenSymbol="LINK"
          toTokenSymbol="AVAX"
          fromTokenDecimals={18}
        />
      )
    })
    const json = instance.toJSON() as
      | renderer.ReactTestRendererJSON
      | renderer.ReactTestRendererJSON[]
      | null

    expect(containsText(json, 'for an unlimited amount of time')).toBe(true)
    expect(containsText(json, 'Estimated total spend')).toBe(false)
  })
})

import React from 'react'
import renderer, { act } from 'react-test-renderer'

// Mock @avalabs/k2-alpine to use plain RN primitives so tests don't need a
// dripsy theme provider. The factory must use require() — no out-of-scope refs.
jest.mock('@avalabs/k2-alpine', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')

  const passthrough =
    (Cmp: any) =>
    ({
      children,
      sx: _sx,
      variant: _v,
      ...rest
    }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any) =>
      r.createElement(Cmp, rest, children)
  return {
    Text: passthrough(rn.Text),
    View: passthrough(rn.View),
    TouchableOpacity: passthrough(rn.TouchableOpacity),
    Separator: () => null,
    Icons: {
      Navigation: {
        ChevronRight: () => null
      }
    },
    useTheme: () => ({
      theme: { colors: { $textSecondary: '#888' }, isDark: false }
    }),
    useInversedTheme: () => ({
      theme: { colors: { $textSecondary: '#888' }, isDark: true }
    }),
    alpha: (c: string) => c,
    showAlert: jest.fn()
  }
})

// Mock reanimated to no-op the layout / fade animations.
jest.mock('react-native-reanimated', () => {
  const r = require('react') as typeof import('react')
  const rn = require('react-native') as typeof import('react-native')
  const View = ({
    children,
    ...rest
  }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any) => r.createElement(rn.View, rest, children)
  return {
    __esModule: true,
    default: { View },
    FadeIn: undefined,
    FadeOut: undefined,
    LinearTransition: { easing: () => undefined },
    Easing: { inOut: () => undefined, ease: undefined },
    useAnimatedStyle: () => ({}),
    useSharedValue: () => ({ value: 0 }),
    withTiming: (v: number) => v
  }
})

// Mock SDK constants & validator.
jest.mock('@avalabs/fusion-sdk', () => ({
  RECURRING_FREQUENCY_VALUE_MAX: 365,
  RECURRING_FREQUENCY_UNITS: ['minute', 'hour', 'day', 'week', 'month'],
  validateFrequency: () => ({ ok: true })
}))

// Mock store/account selector.
jest.mock('store/account', () => ({
  selectActiveAccount: jest.fn()
}))

// Mock react-redux.
jest.mock('react-redux', () => ({
  useSelector: () => ({ addressC: '0xabc' })
}))

// Mock SwapContext.
jest.mock('features/swap/contexts/SwapContext', () => ({
  useSwapContext: () => ({ fromToken: undefined, toToken: undefined })
}))

// Mock common alert utilities.
jest.mock('common/utils/alertWithTextInput', () => ({
  showAlertWithTextInput: jest.fn(),
  dismissAlertWithTextInput: jest.fn()
}))

// Mock recurring eligibility — return ineligible so component uses default
// 300s min interval (matches the picker's fallback).
jest.mock('../hooks/useRecurringEligibility', () => ({
  useRecurringEligibility: () => ({
    eligible: false,
    reason: 'unsupported-source-chain'
  })
}))

// Mock RecurringSwapContext — variable name must be `mock`-prefixed for jest hoisting.
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

import {
  RecurringDetailsRows,
  ordersChipsForToken
} from './RecurringDetailsRows'

/** Walk the rendered tree and collect all string leaf values. */
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
  amountPerOrder: undefined as bigint | undefined,
  fromTokenSymbol: undefined as string | undefined,
  fromTokenDecimals: undefined as number | undefined
}

const oneToken = 10n ** 18n

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

  it('renders frequency + orders + estimated total spend rows when set', async () => {
    mockContextValue.frequency = { unit: 'week', value: 4 }
    mockContextValue.numberOfOrders = 4

    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(
        <RecurringDetailsRows
          amountPerOrder={15n * oneToken}
          fromTokenSymbol="LINK"
          fromTokenDecimals={18}
        />
      )
    })
    const json = instance.toJSON() as
      | renderer.ReactTestRendererJSON
      | renderer.ReactTestRendererJSON[]
      | null

    // Pluralized cadence on the Frequency row
    expect(containsText(json, 'Every 4 weeks')).toBe(true)
    // Orders count
    expect(containsText(json, '4 orders')).toBe(true)
    // Estimated total spend value (15 × 4 = 60)
    expect(containsText(json, 'Estimated total spend')).toBe(true)
    expect(containsText(json, /60(\.0+)?\s*LINK/)).toBe(true)
  })

  // Regression: with the previous parseFloat(amountPerOrder) implementation
  // a thousands-separated string ("1,234.56") parsed as 1, producing a total
  // off by 1000x. The bigint × numberOfOrders path computes exactly.
  it('formats Estimated total spend correctly for amounts ≥ 1000 tokens', async () => {
    mockContextValue.frequency = { unit: 'week', value: 1 }
    mockContextValue.numberOfOrders = 10

    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(
        <RecurringDetailsRows
          amountPerOrder={5000n * oneToken}
          fromTokenSymbol="USDC"
          fromTokenDecimals={18}
        />
      )
    })
    const json = instance.toJSON() as
      | renderer.ReactTestRendererJSON
      | renderer.ReactTestRendererJSON[]
      | null

    // 5,000 × 10 = 50,000 USDC — formatTokenAmount uses en-US grouping.
    expect(containsText(json, /50,000(\.0+)?\s*USDC/)).toBe(true)
  })

  it('hides Estimated total spend when Unlimited', async () => {
    mockContextValue.frequency = { unit: 'week', value: 4 }
    mockContextValue.numberOfOrders = Infinity

    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(
        <RecurringDetailsRows
          amountPerOrder={15n * oneToken}
          fromTokenSymbol="LINK"
          fromTokenDecimals={18}
        />
      )
    })
    const json = instance.toJSON() as
      | renderer.ReactTestRendererJSON
      | renderer.ReactTestRendererJSON[]
      | null

    expect(containsText(json, 'Unlimited')).toBe(true)
    expect(containsText(json, 'Estimated total spend')).toBe(false)
  })
})

describe('ordersChipsForToken', () => {
  it('includes the Unlimited chip for non-native (ERC-20) source tokens', () => {
    const ids = ordersChipsForToken(false).map(chip => chip.id)
    expect(ids).toContain('unlimited')
  })

  it('omits the Unlimited chip for native source tokens', () => {
    // Native-input recurring pre-wraps the full schedule total, so an unbounded
    // (Unlimited) schedule 400s on Markr's /recurring/quote — hide the option.
    const ids = ordersChipsForToken(true).map(chip => chip.id)
    expect(ids).not.toContain('unlimited')
    // The finite presets + custom remain selectable.
    expect(ids).toEqual(
      expect.arrayContaining(['5', '10', '15', '20', 'custom'])
    )
  })
})

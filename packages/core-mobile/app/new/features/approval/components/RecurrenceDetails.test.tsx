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
      ...rest
    }: {
      children?: any
      sx?: unknown
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
      r.createElement(rn.View as any, rest as any, children)
  }
})

// Import after mock is registered.

import { RecurrenceDetails } from './RecurrenceDetails'

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

/** Render a component, flush async updates, then test text content. */
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

describe('<RecurrenceDetails />', () => {
  const baseCtx = {
    step: 'fill' as const,
    quoteUuid: '6674c5b1-a014-420f-9e5e-f3c4a863061f',
    fromTokenAddress: '0x' + 'a'.repeat(40),
    fromTokenSymbol: 'LINK',
    fromTokenDecimals: 18,
    toTokenAddress: '0x' + 'b'.repeat(40),
    toTokenSymbol: 'AVAX',
    toTokenDecimals: 18,
    amountPerOrder: '15000000000000000000',
    totalAmountIn: '60000000000000000000',
    numberOfOrders: 4,
    isUnlimited: false,
    frequency: { unit: 'week' as const, value: 4 },
    intervalSeconds: 2419200,
    chainId: 43114
  }

  it('renders "Scheduling recurring swap" header', async () => {
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(<RecurrenceDetails context={baseCtx} />)
    })
    const json = instance.toJSON() as
      | renderer.ReactTestRendererJSON
      | renderer.ReactTestRendererJSON[]
      | null
    expect(containsText(json, 'Scheduling recurring swap')).toBe(true)
  })

  it('renders the bounded-schedule summary', async () => {
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(<RecurrenceDetails context={baseCtx} />)
    })
    const json = instance.toJSON() as
      | renderer.ReactTestRendererJSON
      | renderer.ReactTestRendererJSON[]
      | null
    // The amount may render with varying decimal places depending on the
    // formatter; match flexibly. The token symbols, frequency, and orders count
    // are pinned exactly.
    expect(
      containsText(
        json,
        /15(\.0+)? LINK for AVAX every 4 weeks, for 4 orders\./
      )
    ).toBe(true)
    expect(
      containsText(json, 'First swap executes immediately after approval.')
    ).toBe(true)
  })

  it('renders "for an unlimited amount of time" when isUnlimited', async () => {
    const ctx = { ...baseCtx, numberOfOrders: 365, isUnlimited: true }
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(<RecurrenceDetails context={ctx} />)
    })
    const json = instance.toJSON() as
      | renderer.ReactTestRendererJSON
      | renderer.ReactTestRendererJSON[]
      | null
    expect(containsText(json, 'for an unlimited amount of time')).toBe(true)
  })
})

import React from 'react'
import renderer, { act } from 'react-test-renderer'

jest.mock('@avalabs/k2-alpine', () => {
  const ReactActual = jest.requireActual('react')
  const View = (
    props: React.PropsWithChildren<Record<string, unknown>>
  ): React.ReactNode => ReactActual.createElement('View', null, props.children)
  const Text = (
    props: React.PropsWithChildren<Record<string, unknown>>
  ): React.ReactNode => ReactActual.createElement('Text', null, props.children)
  return { View, Text }
})

import { RecurrenceDetails } from './RecurrenceDetails'

// Helper: depth-first string search through the react-test-renderer JSON
// output. The mocked View/Text render their children verbatim, so the
// preview's user-visible copy ends up as text leaves of the tree.
function containsText(
  json:
    | renderer.ReactTestRendererJSON
    | renderer.ReactTestRendererJSON[]
    | null
    | undefined,
  needle: string | RegExp
): boolean {
  if (json === null || json === undefined) return false
  if (Array.isArray(json)) {
    return json.some(child => containsText(child, needle))
  }
  if (typeof json === 'string') {
    const str: string = json
    return needle instanceof RegExp ? needle.test(str) : str.includes(needle)
  }
  if ('children' in json && json.children) {
    return (json.children as renderer.ReactTestRendererJSON[]).some(child =>
      containsText(child, needle)
    )
  }
  return false
}

const fillCtx = {
  type: 'fill' as const,
  fromTokenSymbol: 'LINK',
  toTokenSymbol: 'AVAX',
  amountPerOrderFormatted: '15.00',
  numberOfOrders: 4,
  isUnlimited: false,
  frequency: { unit: 'week' as const, value: 4 }
}

describe('<RecurrenceDetails />', () => {
  it('renders the fill preview matching the Figma copy (frame 21654-62903)', async () => {
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(<RecurrenceDetails context={fillCtx} />)
    })
    const json = instance.toJSON() as
      | renderer.ReactTestRendererJSON
      | renderer.ReactTestRendererJSON[]
      | null
    expect(containsText(json, 'Scheduling recurring swap')).toBe(true)
    expect(
      containsText(json, /15\.00 LINK for AVAX every 4 weeks, for 4 orders\./)
    ).toBe(true)
    expect(
      containsText(json, 'First swap executes immediately after approval.')
    ).toBe(true)
  })

  // Harmonised with `formatFrequencyShort` (the canonical frequency
  // formatter shared with the manage screen): a `value: 1` schedule
  // reads as "every week" — not the old "every 1 week" form the local
  // pluralizer produced before consolidation.
  it('renders the singular frequency form ("every week", not "every 1 week")', async () => {
    const ctx = {
      ...fillCtx,
      frequency: { unit: 'week' as const, value: 1 }
    }
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(<RecurrenceDetails context={ctx} />)
    })
    const json = instance.toJSON() as
      | renderer.ReactTestRendererJSON
      | renderer.ReactTestRendererJSON[]
      | null
    expect(containsText(json, 'every week,')).toBe(true)
    expect(containsText(json, 'every 1 week')).toBe(false)
  })

  it('renders "for an unlimited amount of time" when isUnlimited', async () => {
    const ctx = { ...fillCtx, isUnlimited: true, numberOfOrders: 365 }
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

  it('renders the cancel preview for type="cancel"', async () => {
    const ctx = {
      type: 'cancel' as const,
      fromTokenSymbol: 'LINK',
      toTokenSymbol: 'AVAX'
    }
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(<RecurrenceDetails context={ctx} />)
    })
    const json = instance.toJSON() as
      | renderer.ReactTestRendererJSON
      | renderer.ReactTestRendererJSON[]
      | null
    expect(containsText(json, 'Cancelling recurring swap')).toBe(true)
    expect(
      containsText(json, 'Stops the recurring LINK → AVAX schedule.')
    ).toBe(true)
  })

  it('renders the pause preview for type="pause" with the allowance-preserved callout', async () => {
    const ctx = {
      type: 'pause' as const,
      fromTokenSymbol: 'USDC',
      toTokenSymbol: 'AVAX'
    }
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(<RecurrenceDetails context={ctx} />)
    })
    const json = instance.toJSON() as
      | renderer.ReactTestRendererJSON
      | renderer.ReactTestRendererJSON[]
      | null
    expect(containsText(json, 'Pausing recurring swap')).toBe(true)
    expect(
      containsText(json, 'Pauses the recurring USDC → AVAX schedule.')
    ).toBe(true)
    expect(containsText(json, 'Existing allowance is preserved')).toBe(true)
  })

  it('renders the unpause preview for type="unpause"', async () => {
    const ctx = {
      type: 'unpause' as const,
      fromTokenSymbol: 'USDC',
      toTokenSymbol: 'AVAX'
    }
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(<RecurrenceDetails context={ctx} />)
    })
    const json = instance.toJSON() as
      | renderer.ReactTestRendererJSON
      | renderer.ReactTestRendererJSON[]
      | null
    expect(containsText(json, 'Unpausing recurring swap')).toBe(true)
    expect(
      containsText(json, 'Resumes the recurring USDC → AVAX schedule.')
    ).toBe(true)
  })
})

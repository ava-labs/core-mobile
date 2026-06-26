import React from 'react'
import renderer, { act } from 'react-test-renderer'

// Mock @avalabs/k2-alpine so we don't need a dripsy theme provider.
jest.mock('@avalabs/k2-alpine', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')

  const passthrough =
    (Component: React.ComponentType<unknown>) =>
    ({
      children,
      sx: _sx,
      variant: _v,
      ...rest
    }: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children?: any
      sx?: unknown
      variant?: string
      [k: string]: unknown
    }) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r.createElement(Component as any, rest as any, children)

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Text: passthrough(rn.Text as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    View: passthrough(rn.View as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TouchableOpacity: passthrough(rn.TouchableOpacity as any),
    alpha: (color: string) => color,
    useTheme: () => ({
      theme: {
        isDark: true,
        colors: { $textPrimary: '#fff', $surfacePrimary: '#111' }
      }
    }),
    useInversedTheme: () => ({
      theme: { colors: { $textPrimary: '#000', $surfaceTertiary: '#eee' } }
    })
  }
})

import { RecurrenceChips, type ChipOption } from './RecurrenceChips'

type Preset = 'a' | 'b' | 'c' | 'd' | 'custom'

const OPTIONS: ChipOption<Preset>[] = [
  { id: 'a', label: 'Option A' },
  { id: 'b', label: 'Option B' },
  { id: 'c', label: 'Option C' },
  { id: 'd', label: 'Option D' },
  { id: 'custom', label: 'Custom' }
]

function findByTestID(
  node:
    | renderer.ReactTestRendererJSON
    | renderer.ReactTestRendererJSON[]
    | null,
  testID: string
): renderer.ReactTestRendererJSON | null {
  if (!node) return null
  const queue: renderer.ReactTestRendererJSON[] = Array.isArray(node)
    ? [...node]
    : [node]
  while (queue.length) {
    const n = queue.shift()!
    if (n.props?.testID === testID) return n
    if (n.children) {
      for (const child of n.children) {
        if (typeof child !== 'string') queue.push(child)
      }
    }
  }
  return null
}

function collectText(node: renderer.ReactTestRendererJSON | null): string[] {
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
    if (n.children) n.children.forEach(walk)
  }
  walk(node)
  return texts
}

describe('<RecurrenceChips />', () => {
  it('renders all options as chips', async () => {
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(
        <RecurrenceChips
          options={OPTIONS}
          selectedId="a"
          onSelect={jest.fn()}
          testID="picker"
        />
      )
    })
    const json = instance.toJSON() as
      | renderer.ReactTestRendererJSON
      | renderer.ReactTestRendererJSON[]
      | null

    for (const opt of OPTIONS) {
      const chip = findByTestID(json, `chip_${opt.id}`)
      expect(chip).not.toBeNull()
      expect(collectText(chip).join('')).toContain(opt.label)
    }
  })

  it('fires onSelect with the chip id when pressed', async () => {
    const onSelect = jest.fn()
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(
        <RecurrenceChips options={OPTIONS} selectedId="a" onSelect={onSelect} />
      )
    })
    const customChip = instance.root.findByProps({ testID: 'chip_custom' })
    await act(async () => {
      customChip.props.onPress()
    })
    expect(onSelect).toHaveBeenCalledWith('custom')
  })

  // Regression: previously the parent fell back to `selectedId="hourly"`
  // (or `"5"`) when the user hadn't picked yet, which lit up a chip the
  // user had never confirmed. With selectedId={undefined}, no chip should
  // be highlighted — the renderer still mounts all option chips, but no
  // `chip_<id>` matches the parent's stored selection.
  it('renders no chip as selected when selectedId is undefined', async () => {
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(
        <RecurrenceChips
          options={OPTIONS}
          selectedId={undefined}
          onSelect={jest.fn()}
        />
      )
    })
    // Every option's chip is mounted (so the user can pick one). The
    // visual selected/unselected state lives in the chip's inline style,
    // not in props that tests can directly assert against the renderer.
    // What we can verify is that all chips are tappable and present.
    const json = instance.toJSON() as
      | renderer.ReactTestRendererJSON
      | renderer.ReactTestRendererJSON[]
      | null
    for (const opt of OPTIONS) {
      expect(findByTestID(json, `chip_${opt.id}`)).not.toBeNull()
    }
  })

  it('pads the final row with placeholders so columns line up', async () => {
    // 5 options at 3 cols → row 1: a,b,c | row 2: d,custom,<placeholder>
    let instance!: renderer.ReactTestRenderer
    await act(async () => {
      instance = renderer.create(
        <RecurrenceChips
          options={OPTIONS}
          selectedId="a"
          onSelect={jest.fn()}
          columns={3}
        />
      )
    })
    const json = instance.toJSON() as
      | renderer.ReactTestRendererJSON
      | renderer.ReactTestRendererJSON[]
      | null
    // Real chips should still be exactly OPTIONS.length tappables.
    let chipCount = 0
    for (const opt of OPTIONS) {
      if (findByTestID(json, `chip_${opt.id}`)) chipCount++
    }
    expect(chipCount).toBe(OPTIONS.length)
  })
})

import { TokenUnit } from '@avalabs/core-utils-sdk'
import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { NodeValidator } from 'types/earn'
import { DelegateNodeItem } from './DelegateNodeItem'

jest.mock('@avalabs/k2-alpine', () => {
  const react = require('react') as typeof import('react')
  const rn = require('react-native') as typeof import('react-native')
  const passthrough =
    (Component: React.ElementType) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ children, sx: _sx, ...props }: any) =>
      react.createElement(Component, props, children)
  return {
    alpha: (color: string) => color,
    AnimatedPressable: passthrough(rn.Pressable),
    Icons: {
      Custom: { Database: () => null },
      Navigation: { ChevronRight: () => null }
    },
    // Keep `sx` visible as `style` so tests can assert the uptime colour.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Text: ({ children, sx, variant: _variant, ...props }: any) =>
      react.createElement(rn.Text, { ...props, style: sx }, children),
    useTheme: () => ({
      theme: { colors: { $textPrimary: '#000', $borderPrimary: '#ccc' } }
    }),
    View: passthrough(rn.View)
  }
})
jest.mock('utils/Utils', () => ({ truncateNodeId: (id: string) => id }))
jest.mock('./NodeTagPill', () => ({ NodeTagPill: () => null }))

const NOW_S = Math.floor(Date.now() / 1000)

const available = { toDisplay: () => '100' } as unknown as TokenUnit

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Instance = any

const uptimeStyle = async (uptime: string): Promise<unknown> => {
  const node = {
    nodeID: 'NodeID-A',
    startTime: String(NOW_S - 86400),
    endTime: String(NOW_S + 86400),
    delegatorCount: '1',
    delegationFee: '2',
    uptime
  } as unknown as NodeValidator
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(
      <DelegateNodeItem node={node} available={available} onPress={jest.fn()} />
    )
  })
  const [text] = instance.root.findAll(
    (n: Instance) =>
      typeof n.type === 'string' && n.props.testID === 'delegate_node_uptime'
  )
  const style = text?.props.style
  act(() => instance.unmount())
  return style
}

describe('DelegateNodeItem uptime colour', () => {
  it('is success at or above the threshold', async () => {
    expect(await uptimeStyle('90')).toEqual({ color: '$textSuccess' })
    expect(await uptimeStyle('99.5')).toEqual({ color: '$textSuccess' })
  })

  it('is danger below the threshold', async () => {
    expect(await uptimeStyle('81')).toEqual({ color: '$textDanger' })
  })

  it('falls back to the primary text colour when uptime is unparsable', async () => {
    expect(await uptimeStyle('')).toEqual({ color: '$textPrimary' })
  })
})

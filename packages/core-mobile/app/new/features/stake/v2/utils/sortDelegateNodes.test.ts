import { TokenUnit } from '@avalabs/core-utils-sdk'
import { NodeValidator } from 'types/earn'
import {
  DelegateNodeSortOption,
  NodeWithAvailable,
  sortDelegateNodes
} from './sortDelegateNodes'

// Relative ordering is all that matters here, so the sub-unit magnitude can be
// used directly as the "available" amount.
const avax = (subUnits: number): TokenUnit => new TokenUnit(subUnits, 9, 'AVAX')

const item = (
  id: string,
  opts: {
    fee?: string
    uptime?: string
    endTime?: string
    available?: number
  } = {}
): NodeWithAvailable => ({
  validator: {
    nodeID: id,
    delegationFee: opts.fee ?? '2',
    uptime: opts.uptime ?? '99',
    endTime: opts.endTime ?? '0'
  } as unknown as NodeValidator,
  available: avax(opts.available ?? 0)
})

const ids = (nodes: NodeWithAvailable[]): string[] =>
  nodes.map(n => n.validator.nodeID)

describe('sortDelegateNodes', () => {
  it('LowestFee sorts by delegation fee ascending', () => {
    const nodes = [
      item('a', { fee: '3' }),
      item('b', { fee: '1' }),
      item('c', { fee: '2' })
    ]
    expect(
      ids(sortDelegateNodes(nodes, DelegateNodeSortOption.LowestFee))
    ).toEqual(['b', 'c', 'a'])
  })

  it('MostAvailable sorts by available capacity descending', () => {
    const nodes = [
      item('a', { available: 10 }),
      item('b', { available: 30 }),
      item('c', { available: 20 })
    ]
    expect(
      ids(sortDelegateNodes(nodes, DelegateNodeSortOption.MostAvailable))
    ).toEqual(['b', 'c', 'a'])
  })

  it('TimeRemaining sorts by end time descending', () => {
    const nodes = [
      item('a', { endTime: '100' }),
      item('b', { endTime: '300' }),
      item('c', { endTime: '200' })
    ]
    expect(
      ids(sortDelegateNodes(nodes, DelegateNodeSortOption.TimeRemaining))
    ).toEqual(['b', 'c', 'a'])
  })

  it('Uptime sorts by uptime descending', () => {
    const nodes = [
      item('a', { uptime: '90' }),
      item('b', { uptime: '99' }),
      item('c', { uptime: '95' })
    ]
    expect(
      ids(sortDelegateNodes(nodes, DelegateNodeSortOption.Uptime))
    ).toEqual(['b', 'c', 'a'])
  })

  it('breaks fee ties by longest remaining time first', () => {
    const nodes = [
      item('a', { fee: '2', endTime: '100' }),
      item('b', { fee: '2', endTime: '300' }),
      item('c', { fee: '2', endTime: '200' })
    ]
    expect(
      ids(sortDelegateNodes(nodes, DelegateNodeSortOption.LowestFee))
    ).toEqual(['b', 'c', 'a'])
  })

  it('breaks uptime ties by longest remaining time first', () => {
    const nodes = [
      item('a', { uptime: '99', endTime: '100' }),
      item('b', { uptime: '99', endTime: '300' }),
      item('c', { uptime: '99', endTime: '200' })
    ]
    expect(
      ids(sortDelegateNodes(nodes, DelegateNodeSortOption.Uptime))
    ).toEqual(['b', 'c', 'a'])
  })

  it('does not mutate the input array', () => {
    const nodes = [item('a', { fee: '3' }), item('b', { fee: '1' })]
    const original = [...nodes]
    sortDelegateNodes(nodes, DelegateNodeSortOption.LowestFee)
    expect(nodes).toEqual(original)
  })
})

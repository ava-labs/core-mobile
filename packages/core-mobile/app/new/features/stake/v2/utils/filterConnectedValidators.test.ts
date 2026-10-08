import { filterConnectedValidators } from './filterConnectedValidators'

describe('filterConnectedValidators', () => {
  it('drops validators the P-Chain node is not connected to', () => {
    expect(
      filterConnectedValidators([
        { nodeID: 'NodeID-ON', connected: true },
        { nodeID: 'NodeID-OFF', connected: false },
        { nodeID: 'NodeID-ON-2', connected: true }
      ]).map(v => v.nodeID)
    ).toEqual(['NodeID-ON', 'NodeID-ON-2'])
  })

  it('returns an empty list when no validator is connected', () => {
    expect(
      filterConnectedValidators([{ nodeID: 'NodeID-OFF', connected: false }])
    ).toEqual([])
  })
})

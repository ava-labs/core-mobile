import { getValidatorExplorerUrl } from './getValidatorExplorerUrl'

const NODE_ID = 'NodeID-ABC123'

describe('getValidatorExplorerUrl', () => {
  it('uses the mainnet explorer when not in developer mode', () => {
    expect(getValidatorExplorerUrl(false, NODE_ID)).toBe(
      `https://subnets.avax.network/validators/${NODE_ID}`
    )
  })

  it('uses the testnet explorer in developer mode', () => {
    expect(getValidatorExplorerUrl(true, NODE_ID)).toBe(
      `https://subnets-test.avax.network/validators/${NODE_ID}`
    )
  })

  it('appends the node id to the validators path', () => {
    expect(getValidatorExplorerUrl(false, NODE_ID)).toContain(
      `/validators/${NODE_ID}`
    )
  })
})

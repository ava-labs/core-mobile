import { getValidatorExplorerUrl } from './getValidatorExplorerUrl'

const NODE_ID = 'NodeID-ABC123'

describe('getValidatorExplorerUrl', () => {
  it('uses the mainnet explorer when not in developer mode', () => {
    expect(getValidatorExplorerUrl(false, NODE_ID)).toBe(
      `https://build.avax.network/explorer/mainnet/p-chain/node/${NODE_ID}`
    )
  })

  it('uses the testnet explorer in developer mode', () => {
    expect(getValidatorExplorerUrl(true, NODE_ID)).toBe(
      `https://build.avax.network/explorer/fuji/p-chain/node/${NODE_ID}`
    )
  })

  it('appends the node id to the p-chain node path', () => {
    expect(getValidatorExplorerUrl(false, NODE_ID)).toContain(
      `/p-chain/node/${NODE_ID}`
    )
  })
})

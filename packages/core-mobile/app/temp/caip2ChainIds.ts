import { JsonMap } from 'store/posthog'
import { ChainId } from '@avalabs/core-chains-sdk'

/**
 * In the process of switching to CAIP2 naming convention for blockchain ids we are temporarily modifying Posthog
 * events to send chain ids with new naming convention.
 * Eventually we will use CAIP2 through whole app so this conversion will not be needed anymore.
 * @param properties
 */
export function applyTempChainIdConversion(properties?: JsonMap): void {
  if (properties?.chainId) {
    properties.chainId = updateChainIdIfNeeded(Number(properties.chainId))
  }

  if (properties?.networkChainId) {
    properties.networkChainId = updateChainIdIfNeeded(
      Number(properties.networkChainId)
    )
  }
}

function updateChainIdIfNeeded(original: number): string {
  if (original === ChainId.AVALANCHE_P) {
    return BlockchainId.P_CHAIN
  } else if (original === ChainId.AVALANCHE_TEST_P) {
    return BlockchainId.P_CHAIN_TESTNET
  } else if (original === ChainId.AVALANCHE_X) {
    return BlockchainId.X_CHAIN
  } else if (original === ChainId.AVALANCHE_TEST_X) {
    return BlockchainId.X_CHAIN_TESTNET
  }
  return original.toString()
}

//Based on CAIP-2
enum BlockchainId {
  P_CHAIN = 'avax:11111111111111111111111111111111LpoYY',
  P_CHAIN_TESTNET = 'avax:fuji-11111111111111111111111111111111LpoYY',
  X_CHAIN = 'avax:2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
  X_CHAIN_TESTNET = 'avax:2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm'
}

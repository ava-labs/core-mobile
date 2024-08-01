import { JsonMap } from 'store/posthog'
import { ChainId } from '@avalabs/core-chains-sdk'
import { AVM_PVM_IDENTIFIER } from 'store/rpc/types'

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

// Based on CAIP-2, hashed
enum AvalancheChainId {
  P_CHAIN = 'avax:Rr9hnPVPxuUvrdCul-vjEsU1zmqKqRDo',
  P_CHAIN_TESTNET = 'avax:8AJTpRj3SAqv1e80Mtl9em08LhvKEbkl',
  X_CHAIN = 'avax:imji8papUf2EhV3le337w1vgFauqkJg-',
  X_CHAIN_TESTNET = 'avax:Sj7NVE3jXTbJvwFAiu7OEUo_8g8ctXMG'
}

export const isPVMChainId = (caip2ChainId: string): boolean => {
  return (
    caip2ChainId === AvalancheChainId.P_CHAIN ||
    caip2ChainId === AvalancheChainId.P_CHAIN_TESTNET
  )
}

export const isAVMChainId = (caip2ChainId: string): boolean => {
  return (
    caip2ChainId === AvalancheChainId.X_CHAIN ||
    caip2ChainId === AvalancheChainId.X_CHAIN_TESTNET
  )
}

export const getAvalancheCaip2ChainId = (
  chainId: number
): string | undefined => {
  if (chainId === -ChainId.AVALANCHE_XP) {
    return AvalancheChainId.P_CHAIN
  } else if (chainId === -ChainId.AVALANCHE_TEST_XP) {
    return AvalancheChainId.P_CHAIN_TESTNET
  } else if (chainId === ChainId.AVALANCHE_XP) {
    return AvalancheChainId.X_CHAIN
  } else if (chainId === ChainId.AVALANCHE_TEST_XP) {
    return AvalancheChainId.X_CHAIN_TESTNET
  }
  return undefined
}

export const getAvalancheChainId = (
  caip2ChainId: string
): number | undefined => {
  if (caip2ChainId === AvalancheChainId.P_CHAIN) {
    return -ChainId.AVALANCHE_XP
  } else if (caip2ChainId === AvalancheChainId.P_CHAIN_TESTNET) {
    return -ChainId.AVALANCHE_TEST_XP
  } else if (caip2ChainId === AvalancheChainId.X_CHAIN) {
    return ChainId.AVALANCHE_XP
  } else if (caip2ChainId === AvalancheChainId.X_CHAIN_TESTNET) {
    return ChainId.AVALANCHE_TEST_XP
  }

  return undefined
}

export const getChainIdFromCaip2 = (
  caip2ChainId: string
): number | undefined => {
  return caip2ChainId.split(':')[0] === AVM_PVM_IDENTIFIER
    ? getAvalancheChainId(caip2ChainId)
    : Number(caip2ChainId.split(':')[1])
}

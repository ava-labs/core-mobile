import { AvalancheCaip2ChainId } from '@avalabs/core-chains-sdk'
import type { Avalanche } from '@avalabs/core-wallets-sdk'

/**
 * Maps an Avalanche Primary Network chain alias (`'C' | 'P' | 'X'`) to its
 * AVAX-namespace CAIP-2 chain id. Honors mainnet vs Fuji via `isTestnet`.
 *
 * Used by the CCT atomic-tx signing path: `avalanche_sendTransaction`
 * requests must route to the avalanche-module via an AVAX-namespace CAIP-2
 * (an EVM `eip155:*` CAIP-2 would land on the EVM module, which doesn't
 * implement the method).
 */
export const getAvalancheChainAliasCaip2 = (
  chainAlias: Avalanche.ChainIDAlias,
  isTestnet: boolean
): AvalancheCaip2ChainId => {
  if (chainAlias === 'X') {
    return isTestnet ? AvalancheCaip2ChainId.X_TESTNET : AvalancheCaip2ChainId.X
  }
  if (chainAlias === 'P') {
    return isTestnet ? AvalancheCaip2ChainId.P_TESTNET : AvalancheCaip2ChainId.P
  }
  return isTestnet ? AvalancheCaip2ChainId.C_TESTNET : AvalancheCaip2ChainId.C
}

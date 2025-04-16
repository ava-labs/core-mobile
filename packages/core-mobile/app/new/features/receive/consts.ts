import { ChainId } from '@avalabs/core-chains-sdk'

export const HORIZONTAL_MARGIN = 16

export const isXPChain = (chainId?: ChainId): boolean => {
  if (!chainId) return false
  return [ChainId.AVALANCHE_XP, ChainId.AVALANCHE_TEST_XP].includes(chainId)
}

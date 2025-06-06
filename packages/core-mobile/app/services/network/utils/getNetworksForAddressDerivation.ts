import { Network } from '@avalabs/core-chains-sdk'
import { MAIN_PRIMARY_NETWORKS, TEST_PRIMARY_NETWORKS } from '../consts'

export const getNetworksForAddressDerivation = (
  isTestnet: boolean
): Network[] => {
  if (isTestnet) return TEST_PRIMARY_NETWORKS as Network[]
  return MAIN_PRIMARY_NETWORKS as Network[]
}

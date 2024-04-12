import { RootState } from 'store'
import { Network } from '@avalabs/chains-sdk'
import { getAllNetworksFromCache } from './getAllNetworksFromCache'

export const getSelectNetworkFromCache = (
  chainId: number,
  state: RootState
): Network | undefined => {
  const allNetworks = getAllNetworksFromCache(state)
  return allNetworks[chainId]
}

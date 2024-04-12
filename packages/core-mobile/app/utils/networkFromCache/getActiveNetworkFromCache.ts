import { defaultNetwork, selectActiveChainId } from 'store/network'
import { RootState } from 'store'
import { Network } from '@avalabs/chains-sdk'
import { getSelectNetworksFromCache } from './getSelectNetworksFromCache'

export const getActiveNetworkFromCache = (state: RootState): Network => {
  const activeChainId = selectActiveChainId(state)
  const networks = getSelectNetworksFromCache(state)
  if (networks === undefined) return defaultNetwork
  const network = networks[activeChainId]
  return network === undefined ? defaultNetwork : network
}

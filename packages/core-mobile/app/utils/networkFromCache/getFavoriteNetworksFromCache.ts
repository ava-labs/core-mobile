import { selectFavorites } from 'store/network'
import { RootState } from 'store'
import { Network } from '@avalabs/chains-sdk'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { getNetworksFromCache } from './getNetworksFromCache'

export const getFavoriteNetworksFromCache = (state: RootState): Network[] => {
  const favorites = selectFavorites(state)
  const isDeveloperMode = selectIsDeveloperMode(state)
  const networks = getNetworksFromCache()

  if (networks === undefined) return []
  return favorites.reduce((acc, chainId) => {
    const network = networks[chainId]
    if (network && network.isTestnet === isDeveloperMode) {
      acc.push(network)
    }
    return acc
  }, [] as Network[])
}

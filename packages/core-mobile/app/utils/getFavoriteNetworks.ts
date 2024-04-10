import { selectFavorites } from 'store/network'
import { RootState } from 'store'
import { Network } from '@avalabs/chains-sdk'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { getNetworks } from './getNetworks'

export const getFavoriteNetworks = async (
  state: RootState
): Promise<Network[]> => {
  const favorites = selectFavorites(state)
  const isDeveloperMode = selectIsDeveloperMode(state)
  const networks = await getNetworks()

  if (networks === undefined) return []
  return favorites.reduce((acc, chainId) => {
    const network = networks[chainId]
    if (network && network.isTestnet === isDeveloperMode) {
      acc.push(network)
    }
    return acc
  }, [] as Network[])
}

import { Networks, selectCustomNetworks } from 'store/network'
import { RootState } from 'store'
import { getNetworksFromCache } from './getNetworksFromCache'

export const getAllNetworksFromCache = (state: RootState): Networks => {
  const rawNetworks = getNetworksFromCache()
  const customNetworks = selectCustomNetworks(state)
  return { ...rawNetworks, ...customNetworks }
}

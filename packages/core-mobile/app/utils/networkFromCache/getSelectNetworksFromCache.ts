import { Network } from '@avalabs/chains-sdk'
import { mergeWithCustomTokens } from 'store/network/utils'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { RootState } from 'store'
import { selectAllCustomTokens } from 'store/customToken'
import { Networks, selectCustomNetworks } from 'store/network'
import { getNetworksFromCache } from './getNetworksFromCache'

export const getSelectNetworksFromCache = (state: RootState): Networks => {
  const isDeveloperMode = selectIsDeveloperMode(state)
  const allCustomTokens = selectAllCustomTokens(state)
  const customNetworks = selectCustomNetworks(state)
  const rawNetworks = getNetworksFromCache()

  const populatedNetworks = Object.keys(rawNetworks ?? {}).reduce(
    (reducedNetworks, key) => {
      const chainId = parseInt(key)
      const network = rawNetworks?.[chainId]
      if (network && network.isTestnet === isDeveloperMode) {
        reducedNetworks[chainId] = mergeWithCustomTokens(
          network,
          allCustomTokens
        )
      }
      return reducedNetworks
    },
    {} as Record<number, Network>
  )

  const populatedCustomNetworks = Object.keys(customNetworks).reduce(
    (reducedNetworks, key) => {
      const chainId = parseInt(key)
      const network = customNetworks[chainId]

      if (network && network.isTestnet === isDeveloperMode) {
        reducedNetworks[chainId] = mergeWithCustomTokens(
          network,
          allCustomTokens
        )
      }
      return reducedNetworks
    },
    {} as Record<number, Network>
  )
  return { ...populatedNetworks, ...populatedCustomNetworks }
}

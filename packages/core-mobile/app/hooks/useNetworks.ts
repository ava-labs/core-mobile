import { useSelector } from 'react-redux'
import {
  selectCustomNetworks as customNetworksSelector,
  defaultNetwork,
  selectActiveChainId,
  selectFavorites
} from 'store/network'
import { useCallback } from 'react'
import { selectAllCustomTokens } from 'store/customToken'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { mergeWithCustomTokens } from 'store/network/utils'
import { type Network } from '@avalabs/chains-sdk'
import { BN } from 'bn.js'
import { LocalTokenWithBalance } from 'store/balance'
import { getLocalTokenId } from 'store/balance/utils'
import { useGetNetworks } from './useGetNetworks'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useNetworks = () => {
  const { data: rawNetworks } = useGetNetworks()
  const customNetworks = useSelector(customNetworksSelector)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const allCustomTokens = useSelector(selectAllCustomTokens)
  const activeChainId = useSelector(selectActiveChainId)
  const favorites = useSelector(selectFavorites)

  // get all networks, including custom networks
  const selectAllNetworks = useCallback(() => {
    return { ...rawNetworks, ...customNetworks }
  }, [rawNetworks, customNetworks])

  const selectNetworks = useCallback(() => {
    if (rawNetworks === undefined) return {} as Record<number, Network>

    const populatedNetworks = Object.keys(rawNetworks).reduce(
      (reducedNetworks, key) => {
        const chainId = parseInt(key)
        const network = rawNetworks[chainId]
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
  }, [rawNetworks, customNetworks, isDeveloperMode, allCustomTokens])

  const selectCustomNetworks = useCallback(() => {
    const networks = selectNetworks()
    if (networks === undefined) return []

    const customNetworkChainIds = Object.values(customNetworks).map(
      n => n.chainId
    )
    return Object.values(networks).filter(n =>
      customNetworkChainIds.includes(n.chainId)
    )
  }, [selectNetworks, customNetworks])

  const selectActiveNetwork = useCallback(() => {
    const networks = selectNetworks()
    if (networks === undefined) return defaultNetwork
    const network = networks[activeChainId]
    return network === undefined ? defaultNetwork : network
  }, [selectNetworks, activeChainId])

  const selectFavoriteNetworks = useCallback(() => {
    const networks = selectNetworks()
    if (networks === undefined) return []

    return favorites.reduce((acc, chainId) => {
      const network = networks[chainId]
      if (network && network.isTestnet === isDeveloperMode) {
        acc.push(network)
      }
      return acc
    }, [] as Network[])
  }, [selectNetworks, favorites, isDeveloperMode])

  const selectInactiveNetworks = useCallback(() => {
    const favoriteNetworks = selectFavoriteNetworks()
    return favoriteNetworks.filter(network => network.chainId !== activeChainId)
  }, [selectFavoriteNetworks, activeChainId])

  // get the list of contract tokens for the active network
  const selectActiveNetworkContractTokens = useCallback(() => {
    return selectActiveNetwork()?.tokens ?? []
  }, [selectActiveNetwork])

  // get token info for a contract token of the active network
  const selectTokenInfo = useCallback(
    (symbol: string) => {
      const tokens = selectActiveNetworkContractTokens()
      return tokens.find(token => token.symbol === symbol)
    },
    [selectActiveNetworkContractTokens]
  )

  const selectIsTestnet = useCallback(
    (chainId: number) => {
      const allNetworks = selectAllNetworks()
      const network = allNetworks[chainId]
      return network?.isTestnet
    },
    [selectAllNetworks]
  )

  const selectIsCustomNetwork = useCallback(
    (chainId: number) => {
      return !!customNetworks[chainId]
    },
    [customNetworks]
  )

  const selectAllNetworkTokensAsLocal = useCallback(() => {
    const tokens = selectActiveNetworkContractTokens()
    return (
      tokens?.map(token => {
        return {
          ...token,
          localId: getLocalTokenId(token),
          balance: new BN(0),
          balanceInCurrency: 0,
          balanceDisplayValue: '0',
          balanceCurrencyDisplayValue: '0',
          priceInCurrency: 0,
          marketCap: 0,
          change24: 0,
          vol24: 0
        } as LocalTokenWithBalance
      }) ?? []
    )
  }, [selectActiveNetworkContractTokens])

  const selectSomeNetworks = useCallback(
    (chainIds: number[]) => {
      const allNetworks = selectAllNetworks()
      return chainIds
        .map(id => allNetworks[id])
        .filter((network): network is Network => !!network)
    },
    [selectAllNetworks]
  )

  const selectNetwork = useCallback(
    (chainId?: number) => {
      if (chainId === undefined) return
      const allNetworks = selectAllNetworks()
      return allNetworks[chainId]
    },
    [selectAllNetworks]
  )

  // get the list of contract tokens for the network by chainId
  const selectNetworkContractTokens = useCallback(
    (chainId: number) => {
      const network = selectNetwork(chainId)
      return network?.tokens ?? []
    },
    [selectNetwork]
  )

  const selectFromPopulatedNetwork = useCallback(
    (chainId?: number) => {
      const populatedNetworks = selectNetworks()
      if (chainId === undefined || populatedNetworks === undefined) return
      return populatedNetworks[chainId]
    },
    [selectNetworks]
  )

  return {
    selectAllNetworks,
    selectCustomNetworks,
    selectNetworks,
    selectActiveNetwork,
    selectFavoriteNetworks,
    selectInactiveNetworks,
    selectActiveNetworkContractTokens,
    selectTokenInfo,
    selectIsTestnet,
    selectIsCustomNetwork,
    selectAllNetworkTokensAsLocal,
    selectSomeNetworks,
    selectNetwork,
    selectNetworkContractTokens,
    selectFromPopulatedNetwork
  }
}

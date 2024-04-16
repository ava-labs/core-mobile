import { useSelector } from 'react-redux'
import {
  Networks,
  selectCustomNetworks as customNetworksSelector,
  defaultNetwork,
  selectActiveChainId,
  selectFavorites
} from 'store/network'
import { useCallback, useMemo } from 'react'
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
  const _customNetworks = useSelector(customNetworksSelector)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const allCustomTokens = useSelector(selectAllCustomTokens)
  const activeChainId = useSelector(selectActiveChainId)
  const favorites = useSelector(selectFavorites)

  // all networks, including custom networks
  const allNetworks = useMemo((): Networks => {
    return { ...rawNetworks, ..._customNetworks }
  }, [rawNetworks, _customNetworks])

  const networks = useMemo(() => {
    if (rawNetworks === undefined) return {} as Networks

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
      {} as Networks
    )

    const populatedCustomNetworks = Object.keys(_customNetworks).reduce(
      (reducedNetworks, key) => {
        const chainId = parseInt(key)
        const network = _customNetworks[chainId]

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
  }, [rawNetworks, _customNetworks, isDeveloperMode, allCustomTokens])

  const customNetworks = useMemo(() => {
    if (networks === undefined) return []

    const customNetworkChainIds = Object.values(_customNetworks).map(
      n => n.chainId
    )
    return Object.values(networks).filter(n =>
      customNetworkChainIds.includes(n.chainId)
    )
  }, [networks, _customNetworks])

  const activeNetwork = useMemo(() => {
    if (networks === undefined) return defaultNetwork
    const network = networks[activeChainId]
    return network === undefined ? defaultNetwork : network
  }, [networks, activeChainId])

  const favoriteNetworks = useMemo(() => {
    if (networks === undefined) return []

    return favorites.reduce((acc, chainId) => {
      const network = networks[chainId]
      if (network && network.isTestnet === isDeveloperMode) {
        acc.push(network)
      }
      return acc
    }, [] as Network[])
  }, [networks, favorites, isDeveloperMode])

  const inactiveNetworks = useMemo(() => {
    return favoriteNetworks.filter(network => network.chainId !== activeChainId)
  }, [favoriteNetworks, activeChainId])

  // get the list of contract tokens for the active network
  const activeNetworkContractTokens = useMemo(() => {
    return activeNetwork.tokens ?? []
  }, [activeNetwork])

  const allNetworkTokensAsLocal = useMemo(() => {
    return (
      activeNetworkContractTokens.map(token => {
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
  }, [activeNetworkContractTokens])

  // get token info for a contract token of the active network
  const getTokenInfo = useCallback(
    (symbol: string) => {
      return activeNetworkContractTokens.find(token => token.symbol === symbol)
    },
    [activeNetworkContractTokens]
  )

  const getIsTestnet = useCallback(
    (chainId: number) => {
      const network = allNetworks[chainId]
      return network?.isTestnet
    },
    [allNetworks]
  )

  const getIsCustomNetwork = useCallback(
    (chainId: number) => {
      return !!_customNetworks[chainId]
    },
    [_customNetworks]
  )

  const getSomeNetworks = useCallback(
    (chainIds: number[]) => {
      return chainIds
        .map(id => allNetworks[id])
        .filter((network): network is Network => !!network)
    },
    [allNetworks]
  )

  const getNetwork = useCallback(
    (chainId?: number) => {
      if (chainId === undefined) return
      return allNetworks[chainId]
    },
    [allNetworks]
  )

  // get the list of contract tokens for the network by chainId
  const getNetworkContractTokens = useCallback(
    (chainId: number) => {
      const network = getNetwork(chainId)
      return network?.tokens ?? []
    },
    [getNetwork]
  )

  const getFromPopulatedNetwork = useCallback(
    (chainId?: number) => {
      if (chainId === undefined || networks === undefined) return
      return networks[chainId]
    },
    [networks]
  )

  return {
    allNetworks,
    customNetworks,
    networks,
    activeNetwork,
    favoriteNetworks,
    inactiveNetworks,
    activeNetworkContractTokens,
    allNetworkTokensAsLocal,
    getTokenInfo,
    getIsTestnet,
    getIsCustomNetwork,
    getSomeNetworks,
    getNetwork,
    getNetworkContractTokens,
    getFromPopulatedNetwork
  }
}

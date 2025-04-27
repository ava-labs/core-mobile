import { useSelector } from 'react-redux'
import {
  NetworkWithCaip2ChainId,
  Networks,
  selectCustomNetworks as customNetworksSelector,
  defaultNetwork,
  selectActiveChainId,
  selectEnabledChainIds
} from 'store/network'
import { useCallback, useMemo } from 'react'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { type Network } from '@avalabs/core-chains-sdk'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import { getCaip2ChainId } from 'utils/caip2ChainIds'
import { uniq } from 'lodash'
import { useLastTransactedNetworks } from 'new/common/hooks/useLastTransactedNetworks'
import { useGetNetworks } from './useGetNetworks'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useNetworks = () => {
  const { data: rawNetworks } = useGetNetworks()
  const _customNetworks = useSelector(customNetworksSelector)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const activeChainId = useSelector(selectActiveChainId)
  const enabledChainIds = useSelector(selectEnabledChainIds)
  const { data: lastTransactedChains } = useLastTransactedNetworks()

  // all networks, including custom networks
  const allNetworks = useMemo((): Networks => {
    const enhancedRawNetworks = rawNetworks
      ? decorateWithCaip2ChainId(rawNetworks)
      : {}
    const enhancedCustomNetworks = decorateWithCaip2ChainId(_customNetworks)

    return { ...enhancedRawNetworks, ...enhancedCustomNetworks }
  }, [rawNetworks, _customNetworks])

  // all networks that match the current developer mode
  const networks = useMemo(() => {
    if (rawNetworks === undefined) return {} as Networks

    const populatedNetworks = Object.keys(rawNetworks).reduce(
      (reducedNetworks, key) => {
        const chainId = parseInt(key)
        const network = rawNetworks[chainId]
        if (network && network.isTestnet === isDeveloperMode) {
          reducedNetworks[chainId] = network
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
          reducedNetworks[chainId] = network
        }
        return reducedNetworks
      },
      {} as Record<number, NetworkWithCaip2ChainId>
    )
    return { ...populatedNetworks, ...populatedCustomNetworks }
  }, [rawNetworks, _customNetworks, isDeveloperMode])

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

  const enabledNetworks = useMemo(() => {
    if (networks === undefined) return []

    const lastTransactedChainIds = lastTransactedChains
      ? Object.values(lastTransactedChains).map(chain => chain.chainId)
      : []

    const allChainIds = uniq([...enabledChainIds, ...lastTransactedChainIds])

    const enabled = allChainIds.reduce((acc, chainId) => {
      const network = networks[chainId]
      if (network && network.isTestnet === isDeveloperMode) {
        acc.push(network)
      }
      return acc
    }, [] as Network[])

    // sort all C/X/P networks to the top
    return enabled.sort((a, b) => {
      if (isAvalancheChainId(a.chainId) && !isAvalancheChainId(b.chainId)) {
        return -1
      }
      if (!isAvalancheChainId(a.chainId) && isAvalancheChainId(b.chainId)) {
        return 1
      }
      return 0
    })
  }, [networks, lastTransactedChains, enabledChainIds, isDeveloperMode])

  const inactiveNetworks = useMemo(() => {
    return enabledNetworks.filter(network => network.chainId !== activeChainId)
  }, [enabledNetworks, activeChainId])

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

  const getNetworkByCaip2ChainId = useCallback(
    (caip2ChainId: string) => {
      return Object.values(allNetworks).find(
        n => n.caip2ChainId === caip2ChainId
      )
    },
    [allNetworks]
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
    enabledNetworks,
    inactiveNetworks,
    getIsTestnet,
    getIsCustomNetwork,
    getSomeNetworks,
    getNetwork,
    getNetworkByCaip2ChainId,
    getFromPopulatedNetwork
  }
}

const decorateWithCaip2ChainId = (networks: Networks): Networks =>
  Object.entries(networks).reduce((acc, [key, network]) => {
    const chainId = parseInt(key)
    acc[chainId] = { ...network, caip2ChainId: getCaip2ChainId(chainId) }
    return acc
  }, {} as Networks)

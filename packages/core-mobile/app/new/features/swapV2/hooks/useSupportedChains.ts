import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import type { Network } from '@avalabs/core-chains-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useNetworks } from 'hooks/networks/useNetworks'
import Logger from 'utils/Logger'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import { isSolanaNetwork } from 'utils/network/isSolanaNetwork'
import { selectIsSolanaSwapBlocked } from 'store/posthog'
import { selectIsFusionServiceReady } from '../store/slice'
import FusionService from '../services/FusionService'

/**
 * Stale time in milliseconds
 */
const STALE_TIME = 2 * 60 * 1000 // 2 minutes

/**
 * React hook to fetch supported chains from the Fusion Service dynamically
 *
 * This hook:
 * - Fetches supported chains from FusionService
 * - Converts CAIP-2 chain IDs to app's Network objects from enabled networks
 * - Returns only enabled networks that match developer mode
 * - Uses React Query for caching and state management
 *
 * @returns Object containing chains array, loading state, and error state
 */
export function useSupportedChains(): {
  chains: Network[] | undefined
  isLoading: boolean
  error: Error | null
} {
  const { getEnabledNetworkByCaip2ChainId } = useNetworks()
  const isSolanaSwapBlocked = useSelector(selectIsSolanaSwapBlocked)
  const isFusionServiceReady = useSelector(selectIsFusionServiceReady)

  // Fetch raw CAIP-2 chain IDs from Fusion Service
  const {
    data: caip2ChainIds,
    isLoading,
    error
  } = useQuery({
    queryKey: [ReactQueryKeys.FUSION_SUPPORTED_CHAINS],
    queryFn: async () => {
      return FusionService.getSupportedChains()
    },
    enabled: isFusionServiceReady,
    staleTime: STALE_TIME
  })

  // Convert CAIP-2 IDs to Network objects from enabled networks
  const chains = useMemo(() => {
    if (!caip2ChainIds) return undefined

    const supportedNetworks = caip2ChainIds
      .map(caip2Id => getEnabledNetworkByCaip2ChainId(caip2Id))
      .filter((network): network is Network => network !== undefined)
      .filter(network => {
        // Filter out Solana networks if Solana swap is blocked
        return !(isSolanaSwapBlocked && isSolanaNetwork(network))
      })
      .sort((a, b) => {
        // Avalanche C-Chain always first
        const aIsAvalanche = isAvalancheChainId(a.chainId)
        const bIsAvalanche = isAvalancheChainId(b.chainId)

        if (aIsAvalanche && !bIsAvalanche) return -1
        if (!aIsAvalanche && bIsAvalanche) return 1
        return 0
      })

    Logger.info(
      `Mapped to ${supportedNetworks.length} supported networks:`,
      supportedNetworks.map(n => `${n.chainName} (${n.chainId})`)
    )

    return supportedNetworks
  }, [caip2ChainIds, getEnabledNetworkByCaip2ChainId, isSolanaSwapBlocked])

  return {
    chains,
    isLoading,
    error: error as Error | null
  }
}

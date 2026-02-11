import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Network } from '@avalabs/core-chains-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useNetworks } from 'hooks/networks/useNetworks'
import Logger from 'utils/Logger'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import FusionService from '../services/FusionService'

/**
 * Stale time in milliseconds
 */
const STALE_TIME = 2 * 60 * 1000 // 2 minutes

/**
 * React hook to fetch supported chains from the Fusion SDK dynamically
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

  // Fetch raw CAIP-2 chain IDs from Fusion SDK
  const {
    data: caip2ChainIds,
    isLoading,
    error
  } = useQuery({
    queryKey: [ReactQueryKeys.FUSION_SUPPORTED_CHAINS],
    queryFn: async () => {
      return FusionService.getSupportedChains()
    },
    staleTime: STALE_TIME,
    enabled: FusionService.isInitialized()
  })

  // Convert CAIP-2 IDs to Network objects from enabled networks
  const chains = useMemo(() => {
    if (!caip2ChainIds) return undefined

    const supportedNetworks = caip2ChainIds
      .map(caip2Id => getEnabledNetworkByCaip2ChainId(caip2Id))
      .filter((network): network is Network => network !== undefined)
      .sort((a, b) => {
        // Avalanche C-Chain always first
        if (isAvalancheChainId(a.chainId)) return -1
        if (isAvalancheChainId(b.chainId)) return 1
        return 0
      })

    Logger.info(
      `Mapped to ${supportedNetworks.length} supported networks:`,
      supportedNetworks.map(n => `${n.chainName} (${n.chainId})`)
    )

    return supportedNetworks
  }, [caip2ChainIds, getEnabledNetworkByCaip2ChainId])

  return {
    chains,
    isLoading,
    error: error as Error | null
  }
}

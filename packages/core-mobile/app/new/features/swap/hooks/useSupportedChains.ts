import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import type { Network } from '@avalabs/core-chains-sdk'
import { compareDestinationChains } from '@avalabs/fusion-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useNetworks } from 'hooks/networks/useNetworks'
import Logger from 'utils/Logger'
import { getCaip2ChainId } from 'utils/caip2ChainIds'
import { isSolanaNetwork } from 'utils/network/isSolanaNetwork'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectActiveAccountHasSolanaAddress } from 'store/account'
import { selectIsSolanaSwapBlocked } from 'store/posthog'
import FusionService from '../services/FusionService'
import { logSdkError } from '../utils/fusionLogger'
import { useIsFusionServiceReady } from './useZustandStore'

/**
 * Stale time in milliseconds
 */
const STALE_TIME = 2 * 60 * 1000 // 2 minutes

/**
 * Helper function to filter and sort networks
 * - Filters out Solana networks if blocked or not derived
 * - Sorts using the shared Fusion SDK destination-chain ordering so mobile,
 *   web, and extension present chains in the same deterministic order
 *   (C-Chain, P-Chain, X-Chain, Ethereum, Bitcoin, Solana, then the rest)
 */
function filterAndSortNetworks(
  networks: Network[],
  hideSolana: boolean
): Network[] {
  return networks
    .filter(network => {
      // Filter out Solana networks if blocked or account has no Solana address
      return !(hideSolana && isSolanaNetwork(network))
    })
    .sort((a, b) =>
      // The SDK normalizes numeric ids as EIP-155, so pass the CAIP-2 id via
      // universalChainId to keep non-EVM chains (BTC, Solana, X/P) in the right bucket
      compareDestinationChains(
        { universalChainId: getCaip2ChainId(a.chainId), name: a.chainName },
        { universalChainId: getCaip2ChainId(b.chainId), name: b.chainName }
      )
    )
}

/**
 * React hook to fetch supported chains from the Fusion Service dynamically
 *
 * This hook:
 * - Fetches supported chains Map from FusionService
 * - Converts CAIP-2 chain IDs to app's Network objects from enabled networks
 * - Returns all source chains (chains that support swapping FROM)
 * - Optionally returns filtered destination chains if sourceChainId is provided
 * - Provides isValidDestination function to check if a swap path is supported
 * - Uses React Query for caching and state management
 *
 * @param sourceChainId - Optional source chain ID to filter destination chains
 * @returns Object containing chains array, destinations array, validation function, loading state, and error state
 */
export function useSupportedChains(sourceChainId?: number): {
  chains: Network[] | undefined
  destinations: Network[] | undefined
  isValidDestination: (sourceChainId: number, destChainId: number) => boolean
  isLoading: boolean
  error: Error | null
} {
  const { getEnabledNetworkByCaip2ChainId } = useNetworks()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const [isFusionServiceReady] = useIsFusionServiceReady()
  const hasSolanaAddress = useSelector(selectActiveAccountHasSolanaAddress)
  const isSolanaSwapBlocked = useSelector(selectIsSolanaSwapBlocked)
  const hideSolana = !hasSolanaAddress || isSolanaSwapBlocked

  // Fetch supported chains Map from Fusion Service
  const {
    data: chainsMap,
    isLoading,
    error
  } = useQuery({
    // isDeveloperMode is included so mainnet and testnet have separate cache
    // entries — without it, toggling developer mode within the stale window
    // would serve chains from the previous environment's TransferManager.
    queryKey: [ReactQueryKeys.FUSION_SUPPORTED_CHAINS, isDeveloperMode],
    queryFn: async () => {
      return FusionService.getSupportedChains()
    },
    enabled: isFusionServiceReady,
    staleTime: STALE_TIME
  })

  // Convert CAIP-2 IDs (Map keys) to Network objects - all source chains
  const chains = useMemo(() => {
    if (!chainsMap) return undefined

    // Extract source chain IDs from Map keys
    const caip2ChainIds = Array.from(chainsMap.keys())

    const networks = caip2ChainIds
      .map(caip2Id => getEnabledNetworkByCaip2ChainId(caip2Id))
      .filter((network): network is Network => network !== undefined)

    const supportedNetworks = filterAndSortNetworks(networks, hideSolana)

    Logger.info(
      `Mapped to ${supportedNetworks.length} supported networks:`,
      supportedNetworks.map(n => `${n.chainName} (${n.chainId})`)
    )

    return supportedNetworks
  }, [chainsMap, getEnabledNetworkByCaip2ChainId, hideSolana])

  // Convert source chainId to CAIP-2 and look up destinations (optional)
  const destinations = useMemo(() => {
    // If no source chain provided, return undefined (no filtering)
    if (sourceChainId === undefined) return undefined

    // If map not loaded yet, return undefined
    if (!chainsMap) return undefined

    // Convert source chainId to CAIP-2 format
    const sourceCaip2 = getCaip2ChainId(sourceChainId)

    // Look up destination CAIP-2 IDs in the Map
    const destCaip2Ids = chainsMap.get(sourceCaip2)

    // If source chain not found in map or has no destinations, return empty array
    if (!destCaip2Ids) {
      Logger.warn(
        `Source chain ${sourceChainId} (${sourceCaip2}) not found in supported chains map or has no destinations`
      )
      return []
    }

    // Convert destination CAIP-2 IDs to Network objects
    const networks = Array.from(destCaip2Ids)
      .map(caip2Id => getEnabledNetworkByCaip2ChainId(caip2Id))
      .filter((network): network is Network => network !== undefined)

    const destNetworks = filterAndSortNetworks(networks, hideSolana)

    Logger.info(
      `Source chain ${sourceChainId} (${sourceCaip2}) can swap to ${destNetworks.length} destination networks:`,
      destNetworks.map(n => `${n.chainName} (${n.chainId})`)
    )

    return destNetworks
  }, [sourceChainId, chainsMap, getEnabledNetworkByCaip2ChainId, hideSolana])

  // Function to check if a destination chain is valid for a source chain
  const isValidDestination = useCallback(
    (srcChainId: number, destChainId: number): boolean => {
      if (!chainsMap) return true

      // Convert chain IDs to CAIP-2 format
      const sourceCaip2 = getCaip2ChainId(srcChainId)
      const destCaip2 = getCaip2ChainId(destChainId)

      // Check if destination is in the Map for this source
      const destCaip2Ids = chainsMap.get(sourceCaip2)
      if (!destCaip2Ids || !destCaip2Ids.has(destCaip2)) {
        return false
      }

      // Check if destination network is enabled
      const destNetwork = getEnabledNetworkByCaip2ChainId(destCaip2)
      if (!destNetwork) return false

      // Check Solana blocking - return true if not blocked/missing
      return !(hideSolana && isSolanaNetwork(destNetwork))
    },
    [chainsMap, getEnabledNetworkByCaip2ChainId, hideSolana]
  )

  useEffect(() => {
    if (error)
      logSdkError('[useSupportedChains] getSupportedChains error', error)
  }, [error])

  return {
    chains,
    destinations,
    isValidDestination,
    isLoading,
    error: error as Error | null
  }
}

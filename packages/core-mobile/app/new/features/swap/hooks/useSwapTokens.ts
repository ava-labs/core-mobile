import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { getV1Tokens } from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import { tokenAggregatorApi } from 'utils/api/clients/aggregatedTokensApiClient'
import { LocalTokenWithBalance } from 'store/balance'
import { AdjustedLocalTokenWithBalance } from 'services/balance/types'
import { getChainIdFromCaip2, isSvmChainId } from 'utils/caip2ChainIds'
import { useNetworks } from 'hooks/networks/useNetworks'
import { TokenType } from '@avalabs/vm-module-types'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { selectIsSolanaSwapBlocked } from 'store/posthog'
import { mapApiTokenToLocal } from '../utils/mapApiTokenToLocal'
import { getLocalTokenIdFromApi } from '../utils/getLocalTokenIdFromApi'
import { useSwapNetworkBalances } from './useSwapNetworkBalances'

const STALE_TIME = 5 * 60 * 1000 // 5 minutes

/**
 * Fetches and prepares tokens for Swap token selection.
 *
 * This hook:
 * 1. Fetches tokens from the token aggregator API for the specified network
 * 2. Merges API token data with user's balance data from their active account
 * 3. Manually adds native tokens (AVAX for C-Chain, SOL for Solana) since the API doesn't return them
 *
 * @param caip2Id - CAIP-2 chain identifier (e.g., "eip155:43114" for Avalanche C-Chain)
 * @returns Object containing:
 *   - tokens: Array of tokens with balance data merged
 *   - isLoading: Boolean indicating if the initial fetch is in progress
 *   - error: Error object if the fetch failed, null otherwise
 */
export const useSwapTokens = (
  caip2Id: string
): {
  tokens: LocalTokenWithBalance[]
  isLoading: boolean
  error: Error | null
} => {
  const isSolanaSwapBlocked = useSelector(selectIsSolanaSwapBlocked)

  const isSolanaBlocked = useMemo(() => {
    return isSvmChainId(caip2Id) && isSolanaSwapBlocked
  }, [caip2Id, isSolanaSwapBlocked])

  // Derive chainId from caip2Id
  const chainId = useMemo(() => getChainIdFromCaip2(caip2Id), [caip2Id])

  const { getNetwork } = useNetworks()

  // Get current network
  const currentNetwork = useMemo(
    () => (chainId ? getNetwork(chainId) : undefined),
    [chainId, getNetwork]
  )

  // Balances for this network — works for both enabled and disabled networks
  const balances = useSwapNetworkBalances(chainId)

  // Fetch tokens from API
  const query = useQuery({
    queryKey: [ReactQueryKeys.FUSION_TOKENS, caip2Id, isSolanaBlocked],
    queryFn: async () => {
      if (!caip2Id || isSolanaBlocked) return []

      const response = await getV1Tokens({
        client: tokenAggregatorApi,
        query: { caip2Id }
      })

      return response.data?.data || []
    },
    enabled: !!caip2Id && !isSolanaBlocked,
    staleTime: STALE_TIME
  })

  // Transform and merge with balance data
  const tokens = useMemo((): LocalTokenWithBalance[] => {
    if (!chainId || query.data === undefined) return []

    // Create balance lookup map by localId
    const balanceMap = new Map<string, AdjustedLocalTokenWithBalance>()
    balances?.forEach(balance => {
      if (balance.localId) {
        balanceMap.set(balance.localId.toLowerCase(), balance)
      }
    })

    // Create native token if network is available
    let nativeToken: LocalTokenWithBalance | null = null

    if (currentNetwork) {
      const symbol = currentNetwork.networkToken.symbol
      const decimals = currentNetwork.networkToken.decimals
      const localId = `NATIVE-${symbol.toLowerCase()}`
      const nativeBalanceData = balanceMap.get(localId.toLowerCase())

      const balance = nativeBalanceData?.balance ?? 0n
      const balanceDisplayValue = new TokenUnit(
        balance,
        decimals,
        symbol
      ).toDisplay()

      nativeToken = {
        type: TokenType.NATIVE,
        symbol,
        name: currentNetwork.networkToken.name,
        description: currentNetwork.networkToken.description,
        decimals,
        logoUri: currentNetwork.logoUri,
        localId,
        internalId: localId,
        networkChainId: chainId,
        isDataAccurate: true,
        balance,
        balanceDisplayValue,
        balanceInCurrency: nativeBalanceData?.balanceInCurrency ?? 0,
        priceInCurrency: nativeBalanceData?.priceInCurrency ?? 0,
        coingeckoId:
          currentNetwork.pricingProviders?.coingecko.nativeTokenId ?? ''
      }
    }

    // Map API tokens (if any)
    const apiTokens =
      query.data.length > 0
        ? query.data.map(apiToken => {
            const localId = getLocalTokenIdFromApi(apiToken)
            const balanceData = balanceMap.get(localId.toLowerCase())
            return mapApiTokenToLocal(apiToken, chainId, balanceData)
          })
        : []

    // Add native token
    return nativeToken ? [nativeToken, ...apiTokens] : apiTokens
  }, [query.data, balances, chainId, currentNetwork])

  return {
    tokens,
    isLoading: query.isLoading,
    error: query.error
  }
}

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { getV1Tokens } from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import { tokenAggregatorApi } from 'utils/api/clients/aggregatedTokensApiClient'
import { LocalTokenWithBalance } from 'store/balance'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { selectActiveAccount } from 'store/account'
import { useTokensWithBalanceByNetworkForAccount } from 'features/portfolio/hooks/useTokensWithBalanceByNetworkForAccount'
import { useNetworks } from 'hooks/networks/useNetworks'
import { TokenType } from '@avalabs/vm-module-types'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { mapApiTokenToLocal } from '../utils/mapApiTokenToLocal'
import { getLocalTokenIdFromApi } from '../utils/getLocalTokenIdFromApi'

const STALE_TIME = 5 * 60 * 1000 // 5 minutes

/**
 * Fetches and prepares tokens for SwapV2 token selection.
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
export const useSwapV2Tokens = (
  caip2Id: string
): {
  tokens: LocalTokenWithBalance[]
  isLoading: boolean
  error: Error | null
} => {
  // Derive chainId from caip2Id
  const chainId = useMemo(() => getChainIdFromCaip2(caip2Id), [caip2Id])
  const activeAccount = useSelector(selectActiveAccount)
  const { getNetwork } = useNetworks()

  // Get current network
  const currentNetwork = useMemo(
    () => (chainId ? getNetwork(chainId) : undefined),
    [chainId, getNetwork]
  )

  // Get balances
  const balances = useTokensWithBalanceByNetworkForAccount(
    activeAccount,
    chainId
  )

  // Fetch tokens from API
  const query = useQuery({
    queryKey: [ReactQueryKeys.FUSION_TOKENS, caip2Id],
    queryFn: async () => {
      if (!caip2Id) return []

      const response = await getV1Tokens({
        client: tokenAggregatorApi,
        query: { caip2Id }
      })

      return response.data?.data || []
    },
    enabled: !!caip2Id,
    staleTime: STALE_TIME
  })

  // Transform and merge with balance data
  const tokens = useMemo((): LocalTokenWithBalance[] => {
    if (!chainId || query.data === undefined) return []

    // Create balance lookup map by localId
    const balanceMap = new Map<string, LocalTokenWithBalance>()
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
      const localId = `NATIVE-${symbol}`
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

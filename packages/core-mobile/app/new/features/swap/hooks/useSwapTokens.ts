import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { getV2Tokens } from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import { tokenAggregatorApi } from 'utils/api/clients/aggregatedTokensApiClient'
import { LocalTokenWithBalance } from 'store/balance'
import { getChainIdFromCaip2, isSvmChainId } from 'utils/caip2ChainIds'
import { selectActiveAccount } from 'store/account'
import { useTokensWithBalanceByNetworkForAccount } from 'features/portfolio/hooks/useTokensWithBalanceByNetworkForAccount'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { selectIsSolanaSwapBlocked } from 'store/posthog'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { isAddressLikeSearch } from 'common/utils/isAddressLikeSearch'
import { mapApiTokenToLocal } from '../utils/mapApiTokenToLocal'
import { getLocalTokenIdFromApi } from '../utils/getLocalTokenIdFromApi'

const STALE_TIME = 2 * 60 * 1000 // 2 minutes
const PAGE_LIMIT = 50 // max tokens per page
const EMPTY_SEARCH_PARAMS = {} // stable reference to avoid spurious query key changes

type UseSwapTokensResult = {
  tokens: LocalTokenWithBalance[]
  isLoading: boolean
  error: unknown | null
  fetchNextPage: () => Promise<unknown>
  hasNextPage: boolean
  isFetchingNextPage: boolean
}

/**
 * Fetches and prepares tokens for Swap token selection using the v2 API.
 *
 * This hook:
 * 1. Fetches paginated tokens from the /v2/tokens endpoint for the specified network
 * 2. Supports server-side keyword/address search via searchText param
 * 3. Merges API token data with user's balance data from their active account
 * 4. Native tokens are returned directly by the API (no manual injection)
 *
 * @param caip2Id - CAIP-2 chain identifier (e.g., "eip155:43114" for Avalanche C-Chain)
 * @param searchText - Optional search text; passed to API as keyword or address filter
 */
export const useSwapTokens = (
  caip2Id: string,
  searchText?: string
): UseSwapTokensResult => {
  const isSolanaSwapBlocked = useSelector(selectIsSolanaSwapBlocked)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const isSolanaBlocked = useMemo(
    () => isSvmChainId(caip2Id) && isSolanaSwapBlocked,
    [caip2Id, isSolanaSwapBlocked]
  )

  const chainId = useMemo(() => getChainIdFromCaip2(caip2Id), [caip2Id])
  const activeAccount = useSelector(selectActiveAccount)

  const { tokens: balances } = useTokensWithBalanceByNetworkForAccount(
    activeAccount,
    chainId
  )

  // Determine server-side search params
  // Use a stable constant for the empty case so the query key doesn't change
  // on every keystroke while the search term is still too short to send.
  const searchParams = useMemo(() => {
    const trimmed = searchText?.trim() ?? ''
    if (trimmed.length < 2) return EMPTY_SEARCH_PARAMS
    if (isAddressLikeSearch(trimmed, isDeveloperMode)) {
      return { address: trimmed }
    }
    return { keyword: trimmed }
  }, [searchText, isDeveloperMode])

  const query = useInfiniteQuery({
    queryKey: [
      ReactQueryKeys.FUSION_TOKENS,
      caip2Id,
      isSolanaBlocked,
      searchParams
    ],
    queryFn: async ({ pageParam }) => {
      if (!caip2Id || isSolanaBlocked) return null

      const response = await getV2Tokens({
        client: tokenAggregatorApi,
        query: {
          caip2Id,
          page: pageParam as number,
          limit: PAGE_LIMIT,
          ...searchParams
        }
      })

      return response.data ?? null
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (!lastPage?.metadata) return undefined
      const { currentPage, totalPages } = lastPage.metadata
      return currentPage < totalPages ? currentPage + 1 : undefined
    },
    enabled: !!caip2Id && !isSolanaBlocked,
    staleTime: STALE_TIME
  })

  const tokens = useMemo((): LocalTokenWithBalance[] => {
    if (!chainId || !query.data) return []

    // Flatten all pages into a single token array
    const allApiTokens = query.data.pages.flatMap(
      page => page?.data?.tokens ?? []
    )

    // Build balance lookup by localId
    const balanceMap = new Map<string, LocalTokenWithBalance>()
    balances?.forEach(balance => {
      if (balance.localId) {
        balanceMap.set(balance.localId.toLowerCase(), balance)
      }
    })

    return allApiTokens.map(apiToken => {
      const localId = getLocalTokenIdFromApi(apiToken)
      const balanceData = balanceMap.get(localId.toLowerCase())
      return mapApiTokenToLocal(apiToken, chainId, balanceData)
    })
  }, [query.data, balances, chainId])

  return {
    tokens,
    isLoading: query.isLoading,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage
  }
}

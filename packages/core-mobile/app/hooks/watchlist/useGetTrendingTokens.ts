import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { TrendingToken } from 'services/token/types'
import WatchlistService from 'services/watchlist/WatchlistService'

export const useGetTrendingTokens = <TData = TrendingToken[]>(
  select?: (data: TrendingToken[]) => TData
): UseQueryResult<TData, Error> => {
  return useQuery({
    queryKey: [ReactQueryKeys.WATCHLIST_TRENDING_TOKENS_AND_CHARTS],
    queryFn: async () => WatchlistService.getTrendingTokens(),
    refetchInterval: 120000, // 2 mins
    select
  })
}

export const useGetTrendingToken = (
  address: string
): UseQueryResult<TrendingToken | undefined, Error> =>
  useGetTrendingTokens(data => data.find(token => token.address === address))

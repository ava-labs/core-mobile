import { useIsFocused } from '@react-navigation/native'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useExchangeRates } from 'hooks/defi/useExchangeRates'
import { useSelector } from 'react-redux'
import WatchlistService from 'services/watchlist/WatchlistService'
import { selectSelectedCurrency } from 'store/settings/currency'
import { TrendingToken } from 'utils/api/types'
import { runAfterInteractions } from 'utils/runAfterInteractions'

export const useGetTrendingTokens = <TData = TrendingToken[]>(
  select?: (data: TrendingToken[]) => TData
): UseQueryResult<TData, Error> => {
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const isFocused = useIsFocused()
  const { data } = useExchangeRates()
  const exchangeRate = data?.usd?.[selectedCurrency.toLowerCase()]

  return useQuery({
    enabled: isFocused,
    queryKey: [ReactQueryKeys.WATCHLIST_TRENDING_TOKENS, exchangeRate],
    queryFn: async () => {
      const tokens = await runAfterInteractions(async () => {
        return WatchlistService.getTrendingTokens(exchangeRate)
      })

      return tokens ?? []
    },
    refetchInterval: 120000, // 2 mins
    select
  })
}

export const useGetTrendingToken = (
  internalId: string | undefined
): UseQueryResult<TrendingToken | undefined, Error> =>
  useGetTrendingTokens(data =>
    internalId ? data.find(token => token.internalId === internalId) : undefined
  )

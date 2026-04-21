import { ListMarketQuotesResponse } from '@avalabs/prediction-market-sdk'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useMemo } from 'react'
import { predictionMarketClient } from '../services/predictionMarketClient'

const STALE_TIME = 60 * 1000 // 1 minute

export function useMarketQuotes(tickerIds: string[]): {
  data: ListMarketQuotesResponse | undefined
  isPending: boolean
  isFetching: boolean
  isError: boolean
} {
  const sortedTickerIds = useMemo(() => [...tickerIds].sort(), [tickerIds])

  return useQuery({
    queryKey: [ReactQueryKeys.PREDICTIONS_MARKET_QUOTES, sortedTickerIds],
    queryFn: () =>
      predictionMarketClient.markets.listMarketQuotes(sortedTickerIds),
    enabled: sortedTickerIds.length > 0,
    staleTime: STALE_TIME
  })
}

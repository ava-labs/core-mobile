import { ListMarketQuotesResponse } from '@avalabs/prediction-market-sdk'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { predictionMarketClient } from '../services/predictionMarketClient'

const STALE_TIME = 60 * 1000 // 1 minute

export function useMarketQuotes(tickerIds: string[]): {
  data: ListMarketQuotesResponse | undefined
  isPending: boolean
  isFetching: boolean
  isError: boolean
} {
  return useQuery({
    queryKey: [ReactQueryKeys.PREDICTIONS_MARKET_QUOTES, tickerIds],
    queryFn: () => predictionMarketClient.markets.listMarketQuotes(tickerIds),
    enabled: tickerIds.length > 0,
    staleTime: STALE_TIME
  })
}

import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { predictionMarketClient } from 'features/trade/predictions/services/predictionMarketClient'
import { MarketDetail } from '@avalabs/prediction-market-sdk'

const STALE_TIME = 60 * 1000 // 1 minute

export function useMarketByTickerId(tickerId: string | undefined): {
  market: MarketDetail | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [ReactQueryKeys.PREDICTIONS_MARKET_DETAIL, tickerId],
    queryFn: () =>
      predictionMarketClient.markets.getMarketByTickerId(tickerId as string),
    enabled: tickerId !== undefined && tickerId !== '',
    staleTime: STALE_TIME
  })

  return {
    market: data,
    isLoading,
    error,
    refetch
  }
}

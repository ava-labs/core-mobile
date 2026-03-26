import { useQuery } from '@tanstack/react-query'
import type { TradableMarket } from '@avalabs/prediction-market-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { predictionMarketClient } from 'features/predictions/services/predictionMarketClient'

const STALE_TIME = 60 * 1000 // 1 minute

/**
 * Fetches all open (unresolved) tradable markets from the Kalshi SDK.
 * A market is considered resolved when its `result` field is set.
 */
export function useTradableMarkets(): {
  markets: TradableMarket[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [ReactQueryKeys.PREDICTIONS_MARKETS],
    queryFn: async () => {
      const response =
        await predictionMarketClient.markets.listTradableMarkets()
      return response.markets.filter(m => !m.result)
    },
    staleTime: STALE_TIME
  })

  return {
    markets: data ?? [],
    isLoading,
    error,
    refetch
  }
}

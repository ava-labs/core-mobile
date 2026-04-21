import { useQuery } from '@tanstack/react-query'
import type { SeriesResponse } from '@avalabs/prediction-market-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { predictionMarketClient } from 'features/trade/predictions/services/predictionMarketClient'

const STALE_TIME = 5 * 60 * 1000 // 5 minutes — series change infrequently

/**
 * Fetches the list of market series from the Kalshi SDK.
 * Series provide the category labels used for filter chips on BrowseScreen.
 */
export function useMarketSeries(): {
  series: SeriesResponse[]
  isLoading: boolean
  error: Error | null
} {
  const { data, isLoading, error } = useQuery({
    queryKey: [ReactQueryKeys.PREDICTIONS_SERIES],
    queryFn: async () => {
      const response = await predictionMarketClient.markets.listSeries()
      return response.series
    },
    staleTime: STALE_TIME
  })

  return {
    series: data ?? [],
    isLoading,
    error
  }
}

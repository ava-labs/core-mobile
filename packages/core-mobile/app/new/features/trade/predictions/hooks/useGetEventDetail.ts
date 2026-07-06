import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { predictionMarketClient } from 'features/trade/predictions/services/predictionMarketClient'
import { useMemo } from 'react'
import { EventDetailWithMarkets } from '../types'
import { attachQuotesToMarkets, normalizeEventMarkets } from '../utils'
import { useMarketQuotes } from './useMarketQuotes'

const STALE_TIME = 60 * 1000 // 1 minute

export function useGetEventDetail(eventTicker: string | undefined): {
  event: EventDetailWithMarkets | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [ReactQueryKeys.PREDICTIONS_EVENT_DETAIL, eventTicker],
    queryFn: () =>
      predictionMarketClient.markets.getEventById(eventTicker as string, {
        withNestedMarkets: true
      }),
    enabled: eventTicker !== undefined && eventTicker !== '',
    staleTime: STALE_TIME
  })

  const marketTickerIds = useMemo(
    () => [...new Set(data?.markets?.map(market => market.ticker))],
    [data?.markets]
  )
  const marketQuotesQuery = useMarketQuotes(marketTickerIds)
  const isFetchingMarketQuotes =
    marketTickerIds.length > 0 &&
    (marketQuotesQuery.isPending || marketQuotesQuery.isFetching)

  const markets = useMemo(
    () => normalizeEventMarkets(data?.markets),
    [data?.markets]
  )

  const event: EventDetailWithMarkets | undefined = useMemo(() => {
    if (data === undefined) {
      return undefined
    }

    return {
      ...data,
      markets: attachQuotesToMarkets({
        markets,
        quotesData: marketQuotesQuery.data,
        isFetching: isFetchingMarketQuotes,
        isError: marketQuotesQuery.isError
      })
    }
  }, [
    isFetchingMarketQuotes,
    marketQuotesQuery.data,
    marketQuotesQuery.isError,
    markets,
    data
  ])

  return {
    event,
    isLoading,
    error,
    refetch
  }
}

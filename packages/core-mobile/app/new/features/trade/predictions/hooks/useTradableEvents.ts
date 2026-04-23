import { EventResponse } from '@avalabs/prediction-market-sdk'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { predictionMarketClient } from 'features/trade/predictions/services/predictionMarketClient'
import { useMemo } from 'react'

const STALE_TIME = 60 * 1000 // 1 minute
const EVENTS_PAGE_SIZE = 30

type PageParam = string | undefined

/**
 * Paginated open events from the prediction market API (cursor + limit).
 */
export function useTradableEvents(): {
  events: EventResponse[]
  isLoading: boolean
  isRefreshing: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  error: Error | null
  refetch: () => void
} {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isPending,
    refetch
  } = useInfiniteQuery({
    queryKey: [ReactQueryKeys.PREDICTIONS_MARKETS],
    initialPageParam: undefined as PageParam,
    queryFn: async ({ pageParam }) => {
      return predictionMarketClient.markets.listEvents({
        withNestedMarkets: true,
        limit: EVENTS_PAGE_SIZE,
        ...(pageParam !== undefined && pageParam !== ''
          ? { cursor: pageParam }
          : {})
      })
    },
    getNextPageParam: lastPage =>
      lastPage.cursor != null && lastPage.cursor !== ''
        ? lastPage.cursor
        : undefined,
    staleTime: STALE_TIME
  })

  const events = useMemo(() => {
    return data?.pages.flatMap(page => page.events) ?? []
  }, [data])

  const isLoading = isPending
  const isRefreshing = isFetching && !isPending && !isFetchingNextPage

  return {
    events,
    isLoading,
    isRefreshing,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    error,
    refetch
  }
}

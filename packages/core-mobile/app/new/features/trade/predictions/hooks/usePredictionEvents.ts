import { EventResponse } from '@avalabs/prediction-market-sdk'
import { useMemo, useState } from 'react'
import { useTradableEvents } from './useTradableEvents'

export const TRENDING_CHIP = 'Trending'

export function usePredictionEvents(): {
  events: EventResponse[]
  isLoading: boolean
  isRefreshing: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  refetch: () => void
  selectedChip: string
  filteredEvents: EventResponse[]
  selectChip: (chip: string) => void
} {
  const [selectedChip, setSelectedChip] = useState<string>(TRENDING_CHIP)

  const {
    events,
    isLoading: marketsLoading,
    isRefreshing,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch
  } = useTradableEvents()

  const filteredEvents = useMemo(() => {
    const base =
      selectedChip === TRENDING_CHIP
        ? [...events]
        : events.filter(e => e.category === selectedChip)

    return [...base].sort(
      (a, b) => parseFloat(b.volume ?? '0') - parseFloat(a.volume ?? '0')
    )
  }, [events, selectedChip])

  return {
    events,
    isLoading: marketsLoading,
    isRefreshing,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    selectedChip,
    filteredEvents,
    selectChip: setSelectedChip
  }
}

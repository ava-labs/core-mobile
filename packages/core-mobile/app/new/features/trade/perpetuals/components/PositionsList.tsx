import { View } from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { CollapsibleTabList } from 'common/components/CollapsibleTabList'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import { useRouter } from 'expo-router'
import {
  TradeFilterChip,
  TradeFilters
} from 'features/trade/components/TradeFilters'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ViewStyle } from 'react-native'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { usePerpsPositionsView } from '../hooks/usePerpsPositionsView'
import { usePerpsPullToRefresh } from '../hooks/usePerpsPullToRefresh'
import { usePerpsUserFills } from '../hooks/usePerpsUserFills'
import { usePositionActions } from '../hooks/usePositionActions'
import { Position, PositionEntry } from '../types'
import { toPositionEntries } from '../utils/toPosition'
import { ClosedPositionCard } from './ClosedPositionCard'
import { PositionCard } from './PositionCard'

const FILTERS: TradeFilterChip[] = ['All', 'Active', 'Won', 'Lost']
/** How many rows to reveal per lazy-load page as the user scrolls. */
const PAGE_SIZE = 15

/** Union row so the list can render both open positions and closed history. */
type PositionRow =
  | { readonly kind: 'open'; readonly id: string; readonly position: Position }
  | {
      readonly kind: 'closed'
      readonly id: string
      readonly entry: PositionEntry
    }

const PositionsList = ({
  containerStyle
}: {
  containerStyle?: ViewStyle
}): JSX.Element => {
  const [selectedFilter, setSelectedFilter] = useState<string>('Active')
  const filterScrollOffsetRef = useRef(0)
  const router = useRouter()
  const { positions } = usePerpsPositionsView()

  const keyExtractor = useCallback((item: PositionRow) => item.id, [])

  const positionActions = usePositionActions()

  const handleSelectFilter = useCallback((chip: string) => {
    setSelectedFilter(chip)
    AnalyticsService.capture('PerpetualsPositionsFilterChanged', {
      filter: chip as 'All' | 'Active' | 'Won' | 'Lost'
    })
  }, [])

  const handleSearchPress = useCallback(() => {
    router.navigate('/perpetualsPositionsSearch')
  }, [router])

  // Closed positions come from trade history (fills that closed a position),
  // not the clearinghouse — HL only keeps *open* positions in clearinghouse
  // state. Keep the closing fills so they can be listed alongside open ones.
  const { fills, refetch: refetchFills } = usePerpsUserFills()

  // Pull-to-refresh re-fetches the clearinghouse (open positions) and the
  // fills history backing the closed rows.
  const { isRefreshing, onRefresh } = usePerpsPullToRefresh(refetchFills)

  const closedEntries = useMemo(
    () =>
      toPositionEntries(fills).filter(entry =>
        entry.outcome.toLowerCase().includes('close')
      ),
    [fills]
  )

  const rows = useMemo<PositionRow[]>(() => {
    const openRows: PositionRow[] = positions.map(position => ({
      kind: 'open',
      id: `open-${position.id}`,
      position
    }))
    const toClosedRows = (entries: PositionEntry[]): PositionRow[] =>
      entries.map(entry => ({
        kind: 'closed',
        id: `closed-${entry.id}`,
        entry
      }))

    switch (selectedFilter) {
      case 'Active':
        // Open positions only.
        return openRows
      case 'Won':
        // Closed positions that realized a profit.
        return toClosedRows(closedEntries.filter(e => (e.pnl ?? 0) > 0))
      case 'Lost':
        // Closed positions that realized a loss.
        return toClosedRows(closedEntries.filter(e => (e.pnl ?? 0) < 0))
      default:
        // 'All' → open positions first, then closed history.
        return [...openRows, ...toClosedRows(closedEntries)]
    }
  }, [positions, closedEntries, selectedFilter])

  // Lazy-load: only render the first N rows and reveal more on scroll-end.

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  // Reset the window when the filter (and thus the dataset) changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [selectedFilter])
  const displayedRows = useMemo(
    () => rows.slice(0, visibleCount),
    [rows, visibleCount]
  )
  const hasMore = visibleCount < rows.length
  const handleEndReached = useCallback(() => {
    setVisibleCount(prev => (prev < rows.length ? prev + PAGE_SIZE : prev))
  }, [rows.length])

  const renderItem: ListRenderItem<PositionRow> = useCallback(
    ({ item, index }) => {
      if (item.kind === 'closed') {
        // Same card style as an active position, minus the chevron / TP-SL —
        // shows the closing time instead (can't be expanded / managed / closed).
        return (
          <View
            sx={{
              paddingHorizontal: 16,
              marginTop: index === 0 ? 0 : 10
            }}>
            <ClosedPositionCard entry={item.entry} />
          </View>
        )
      }
      return (
        <View sx={{ paddingHorizontal: 16, marginTop: index === 0 ? 0 : 10 }}>
          <PositionCard
            position={item.position}
            fullWidth
            expandable
            onMarketClose={() => positionActions.marketClose(item.position)}
            onLimitClose={() => positionActions.limitClose(item.position)}
            onManage={() => positionActions.manage(item.position)}
          />
        </View>
      )
    },
    [positionActions]
  )

  const emptyState = useMemo(() => {
    switch (selectedFilter) {
      case 'Active':
        return {
          title: 'No open positions',
          description: 'Open a position from the Perps tab to see it here'
        }
      case 'Won':
        return {
          title: 'No winning trades yet',
          description: 'Positions you close in profit will show up here'
        }
      case 'Lost':
        return {
          title: 'No losing trades yet',
          description: 'Positions you close at a loss will show up here'
        }
      default:
        return {
          title: 'No positions yet',
          description: 'Open a position from the Perps tab to see it here'
        }
    }
  }, [selectedFilter])

  const renderEmpty = useCallback(
    () => (
      <CollapsibleTabs.ContentWrapper>
        <ErrorState
          icon={undefined}
          title={emptyState.title}
          description={emptyState.description}
        />
      </CollapsibleTabs.ContentWrapper>
    ),
    [emptyState]
  )

  const renderHeader = useCallback(() => {
    return (
      <View sx={{ paddingTop: 20 }}>
        <TradeFilters
          chips={FILTERS}
          selectedChip={selectedFilter}
          onSelectChip={handleSelectFilter}
          onSearchPress={handleSearchPress}
          scrollOffsetRef={filterScrollOffsetRef}
        />
      </View>
    )
  }, [handleSelectFilter, handleSearchPress, selectedFilter])

  return (
    <CollapsibleTabList
      renderHeader={renderHeader}
      data={displayedRows}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      renderEmpty={renderEmpty}
      extraData={{ selectedFilter }}
      containerStyle={containerStyle}
      contentContainerStyle={containerStyle}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      listKey="my-positions"
      onEndReached={handleEndReached}
      isFetchingNextPage={hasMore}
    />
  )
}

export default PositionsList

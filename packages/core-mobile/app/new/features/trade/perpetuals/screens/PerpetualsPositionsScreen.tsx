import {
  Icons,
  NavigationTitleHeader,
  PriceChangeStatus,
  StatusArrow,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { CollapsibleTabList } from 'common/components/CollapsibleTabList'
import {
  CollapsibleTabs,
  CollapsibleTabsRef
} from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import NavigationBarButton from 'common/components/NavigationBarButton'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useRouter } from 'expo-router'
import {
  TradeFilterChip,
  TradeFilters
} from 'features/trade/components/TradeFilters'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LayoutChangeEvent, LayoutRectangle, Platform } from 'react-native'
import Animated from 'react-native-reanimated'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  useSafeAreaFrame,
  useSafeAreaInsets
} from 'react-native-safe-area-context'
import { ClosedPositionCard } from '../components/ClosedPositionCard'
import { PositionCard } from '../components/PositionCard'
import { usePerpsPositionsView } from '../hooks/usePerpsPositionsView'
import { usePerpsUserFills } from '../hooks/usePerpsUserFills'
import { usePositionActions } from '../hooks/usePositionActions'
import { toNumber } from '../utils/format'
import { toPositionEntries, toPositionsSummary } from '../utils/toPosition'
import { Position, PositionEntry } from '../types'

const FILTERS: TradeFilterChip[] = ['All', 'Active', 'Won', 'Lost']

/** How many rows to reveal per lazy-load page as the user scrolls. */
const PAGE_SIZE = 15

/** Rolling window for the "24h change" stat. */
const MS_24H = 24 * 60 * 60 * 1000

/** Union row so the list can render both open positions and closed history. */
type PositionRow =
  | { readonly kind: 'open'; readonly id: string; readonly position: Position }
  | {
      readonly kind: 'closed'
      readonly id: string
      readonly entry: PositionEntry
    }

export const PerpetualsPositionsScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const headerHeight = useEffectiveHeaderHeight()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [selectedFilter, setSelectedFilter] = useState<string>('Active')
  const filterScrollOffsetRef = useRef(0)
  const tabViewRef = useRef<CollapsibleTabsRef>(null)

  useEffect(() => {
    AnalyticsService.capture('PerpetualsPositionsViewed')
  }, [])

  const [headerLayout, setHeaderLayout] = useState<LayoutRectangle | undefined>(
    undefined
  )

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout
    setHeaderLayout({ x, y, width, height })
  }, [])

  const handleSelectFilter = useCallback((chip: string) => {
    setSelectedFilter(chip)
    AnalyticsService.capture('PerpetualsPositionsFilterChanged', {
      filter: chip as 'All' | 'Active' | 'Won' | 'Lost'
    })
  }, [])

  const handleSearchPress = useCallback(() => {
    router.navigate('/perpetualsPositionsSearch')
  }, [router])

  const handleHistoryPress = useCallback(() => {
    router.navigate('/perpetualsPositionsHistory')
  }, [router])

  const renderHeaderRight = useCallback(
    () => (
      <NavigationBarButton onPress={handleHistoryPress}>
        <Icons.Navigation.History color={theme.colors.$textPrimary} />
      </NavigationBarButton>
    ),
    [handleHistoryPress, theme.colors.$textPrimary]
  )

  const { positions, rawPositions } = usePerpsPositionsView()
  const summary = useMemo(
    () => toPositionsSummary(rawPositions),
    [rawPositions]
  )

  // Closed positions come from trade history (fills that closed a position),
  // not the clearinghouse — HL only keeps *open* positions in clearinghouse
  // state. Keep the closing fills so they can be listed alongside open ones.
  const { fills } = usePerpsUserFills()
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

  // Realized P&L from positions closed within the last 24h (from fills).
  const realized24hPnl = useMemo(() => {
    const cutoff = Date.now() - MS_24H
    return fills.reduce(
      (sum, fill) =>
        fill.time >= cutoff ? sum + toNumber(fill.closedPnl) : sum,
      0
    )
  }, [fills])

  // 24h account change = realized P&L from the last 24h of closes + the current
  // unrealized P&L on open positions.
  const change24h = realized24hPnl + summary.pnl
  const change24hStatus =
    change24h > 0
      ? PriceChangeStatus.Up
      : change24h < 0
      ? PriceChangeStatus.Down
      : PriceChangeStatus.Neutral

  const colorForStatus = (status: PriceChangeStatus): string =>
    status === PriceChangeStatus.Up
      ? theme.colors.$textSuccess
      : status === PriceChangeStatus.Down
      ? theme.colors.$textDanger
      : theme.colors.$textPrimary

  const formattedOpen = String(summary.openPositions)
  const formattedPnl = formatCurrency({ amount: summary.pnl })
  const pnlSign = summary.pnl >= 0 ? '+' : ''
  const change24hSign = change24h >= 0 ? '+' : ''
  const formattedChange = `${change24hSign}${formatCurrency({
    amount: change24h
  })}`
  const change24hColor = colorForStatus(change24hStatus)
  const pnlColor = colorForStatus(summary.pnlStatus)

  const header = useMemo(
    () => <NavigationTitleHeader title="My positions" />,
    []
  )
  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header,
    targetLayout: headerLayout,
    renderHeaderRight
  })

  const renderHeader = useCallback(
    (): JSX.Element => (
      <View
        style={{
          paddingTop: 14,
          gap: 20
        }}
        onLayout={handleHeaderLayout}>
        <View sx={{ paddingHorizontal: 16, gap: 8 }}>
          <Text variant="heading2">My positions</Text>
          <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
            Track your wins, losses, and open positions across all markets
          </Text>
        </View>
        <View sx={{ paddingHorizontal: 16 }}>
          <View
            sx={{
              height: 65,
              borderRadius: 18,
              backgroundColor: theme.colors.$surfaceSecondary,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              gap: 24
            }}>
            <SummaryStat label="Open positions" value={formattedOpen} />
            <SummaryStat
              label="24h change"
              value={formattedChange}
              valueColor={change24hColor}
              leftIcon={<StatusArrow status={change24hStatus} size={14} />}
            />
            <SummaryStat
              label="Unrealized P&L"
              value={`${pnlSign}${formattedPnl}`}
              valueColor={pnlColor}
            />
          </View>
        </View>
        <TradeFilters
          chips={FILTERS}
          selectedChip={selectedFilter}
          onSelectChip={handleSelectFilter}
          onSearchPress={handleSearchPress}
          scrollOffsetRef={filterScrollOffsetRef}
        />
      </View>
    ),
    [
      handleHeaderLayout,
      theme.colors.$surfaceSecondary,
      formattedOpen,
      formattedChange,
      change24hStatus,
      change24hColor,
      pnlSign,
      formattedPnl,
      pnlColor,
      selectedFilter,
      handleSelectFilter,
      handleSearchPress
    ]
  )

  const positionActions = usePositionActions()

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

  const keyExtractor = useCallback((item: PositionRow) => item.id, [])

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

  const frame = useSafeAreaFrame()

  const tabHeight = useMemo(() => {
    // Android reports headerHeight as 0 (see workaround for the absolutely-
    // positioned header background below), so the Android branch uses
    // additive geometry against frame.height + safe-area top, padded by 8 to
    // keep the list scrollable under the blurred header overlay.
    return Platform.select({
      ios: frame.height - headerHeight - insets.top - insets.bottom,
      android: frame.height + headerHeight + insets.top + 8
    })
  }, [frame.height, headerHeight, insets.bottom, insets.top])

  const contentContainerStyle = useMemo(() => {
    return {
      paddingBottom: insets.bottom + 16,
      minHeight: tabHeight
    }
  }, [tabHeight, insets.bottom])

  const tabs = useMemo(
    () => [
      {
        tabName: 'positions',
        component: (
          <Animated.View
            entering={getListItemEnteringAnimation(10)}
            style={{ flex: 1 }}>
            <CollapsibleTabList
              data={displayedRows}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              renderEmpty={renderEmpty}
              extraData={{ selectedFilter }}
              containerStyle={contentContainerStyle}
              contentContainerStyle={contentContainerStyle}
              listKey="my-positions"
              onEndReached={handleEndReached}
              isFetchingNextPage={hasMore}
            />
          </Animated.View>
        )
      }
    ],
    [
      displayedRows,
      renderItem,
      keyExtractor,
      renderEmpty,
      selectedFilter,
      contentContainerStyle,
      handleEndReached,
      hasMore
    ]
  )

  const renderEmptyTabBar = useCallback((): JSX.Element => <></>, [])

  return (
    <BlurredBarsContentLayout>
      <CollapsibleTabs.Container
        ref={tabViewRef}
        renderHeader={renderHeader}
        renderTabBar={renderEmptyTabBar}
        onScrollY={onScroll}
        tabs={tabs}
      />
      {/* 
        This is a workaround to display the header background + separator on Android.
        Android returns a header height of 0, so we need to display the background + separator manually.
      */}
      {Platform.OS === 'android' && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: headerHeight
          }}>
          <BlurredBackgroundView
            separator={{ opacity: targetHiddenProgress, position: 'bottom' }}
          />
        </View>
      )}
    </BlurredBarsContentLayout>
  )
}

const SummaryStat = ({
  label,
  value,
  valueColor,
  leftIcon
}: {
  label: string
  value: string
  valueColor?: string
  leftIcon?: JSX.Element
}): JSX.Element => {
  const { theme } = useTheme()
  return (
    <View sx={{ flex: 1 }}>
      <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {leftIcon}
        <Text variant="heading5" sx={{ color: valueColor }}>
          {value}
        </Text>
      </View>
      <Text variant="caption" sx={{ color: theme.colors.$textSecondary }}>
        {label}
      </Text>
    </View>
  )
}

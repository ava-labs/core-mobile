import {
  ActivityIndicator,
  PriceChangeStatus,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { CollapsibleTabList } from 'common/components/CollapsibleTabList'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useRouter } from 'expo-router'
import {
  TradeFilterChip,
  TradeFilters
} from 'features/trade/components/TradeFilters'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { PerpetualListItem } from '../components/PerpetualListItem'
import { Positions } from '../components/Positions'
import { PERP_MARKETS_MOCK, POSITIONS_MOCK } from '../mocks'
import { PerpetualMarket } from '../types'

const CHIPS = ['Trending', 'Volume', 'Change', 'Price']

const signedChange = (market: PerpetualMarket): number =>
  market.changeStatus === PriceChangeStatus.Down
    ? -market.changePercent
    : market.changeStatus === PriceChangeStatus.Up
    ? market.changePercent
    : 0

const PERPETUAL_FILTERS: TradeFilterChip[] = [
  'Trending',
  'Volume',
  'Change',
  'Price'
]

export const PerpetualsScreen = ({
  containerStyle
}: {
  containerStyle: ViewStyle
}): JSX.Element => {
  const { theme } = useTheme()
  const router = useRouter()

  const [selectedFilter, setSelectedFilter] = useState<string>(
    PERPETUAL_FILTERS[0] as string
  )
  const filterScrollOffsetRef = useRef(0)

  const handleSelectFilter = useCallback((chip: string) => {
    setSelectedFilter(chip)
    AnalyticsService.capture('PerpetualsFilterChanged', {
      filter: chip as 'Trending' | 'Volume' | 'Change' | 'Price'
    })
  }, [])

  const handleSearchPress = useCallback(() => {
    router.navigate('/perpetualsSearch')
  }, [router])

  const handleMyPositionsPress = useCallback(() => {
    router.navigate('/perpetualsPositions')
  }, [router])

  const sortedMarkets = useMemo(() => {
    switch (selectedFilter) {
      case 'Volume':
        return [...PERP_MARKETS_MOCK].sort((a, b) => b.volume - a.volume)
      case 'Change':
        return [...PERP_MARKETS_MOCK].sort(
          (a, b) => signedChange(b) - signedChange(a)
        )
      case 'Price':
        return [...PERP_MARKETS_MOCK].sort((a, b) => b.price - a.price)
      case 'Trending':
      default:
        return PERP_MARKETS_MOCK
    }
  }, [selectedFilter])

  const renderItem: ListRenderItem<PerpetualMarket> = useCallback(
    ({ item, index }) => (
      <PerpetualListItem market={item} isFirst={index === 0} />
    ),
    []
  )

  const keyExtractor = useCallback((item: PerpetualMarket) => item.id, [])

  const isLoading = false
  const isRefreshing = false
  const isFetchingNextPage = false
  const hasNextPage = false

  const fetchNextPage = useCallback(() => {
    // TODO: Implement fetchNextPage
  }, [])

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const refetch = useCallback(() => {
    // TODO: Implement refetch
  }, [])

  const renderEmptyComponent = useCallback(
    () => (
      <CollapsibleTabs.ContentWrapper>
        {isLoading ? (
          <ActivityIndicator color={theme.colors.$textPrimary} />
        ) : (
          <ErrorState
            description="Please hit refresh or try again later"
            button={{
              title: 'Refresh',
              onPress: refetch
            }}
          />
        )}
      </CollapsibleTabs.ContentWrapper>
    ),
    [isLoading, refetch, theme.colors.$textPrimary]
  )

  const renderHeader = useCallback(
    () => (
      <View
        sx={{
          gap: 20
        }}>
        <Positions
          positions={POSITIONS_MOCK}
          onTitlePress={handleMyPositionsPress}
          onPositionPress={handleMyPositionsPress}
        />
        <TradeFilters
          chips={CHIPS}
          selectedChip={selectedFilter}
          onSelectChip={handleSelectFilter}
          onSearchPress={handleSearchPress}
          scrollOffsetRef={filterScrollOffsetRef}
        />
      </View>
    ),
    [
      selectedFilter,
      handleSelectFilter,
      handleSearchPress,
      handleMyPositionsPress
    ]
  )

  return (
    <Animated.View
      testID="trade-perpetuals"
      entering={getListItemEnteringAnimation(10)}
      style={{ flex: 1 }}>
      <CollapsibleTabList
        data={sortedMarkets}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        renderEmpty={renderEmptyComponent}
        isRefreshing={isRefreshing}
        renderHeader={renderHeader}
        contentContainerStyle={containerStyle}
        extraData={{ selectedFilter }}
        listKey="trade-perpetuals"
        onRefresh={refetch}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
        maintainVisibleContentPosition={{ disabled: true }}
      />
    </Animated.View>
  )
}

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
import { PerpsApiDownState } from '../components/PerpsApiDownState'
import { PerpsCategoryChips } from '../components/PerpsCategoryChips'
import { Positions } from '../components/Positions'
import { PerpMarketView } from '../types'
import { PerpsGeoRestrictionWarning } from '../components/PerpsGeoRestrictionWarning'
import { usePerps } from '../contexts/PerpsProvider'
import { usePerpsAvailability } from '../hooks/usePerpsAvailability'
import { usePerpetualMarkets } from '../hooks/usePerpetualMarkets'
import { usePerpsLiveMidsFeed } from '../hooks/usePerpsLiveMids'
import { PerpsCategoryChip } from '../hooks/usePerpsMarketFilters'
import {
  availableCategories,
  CATEGORY_LABELS,
  CategoryId
} from '../utils/marketCategories'

const PERPETUAL_FILTERS: TradeFilterChip[] = [
  'Trending',
  'Volume',
  'Change',
  'Price'
]

const signedChange = (market: PerpMarketView): number =>
  market.changeStatus === PriceChangeStatus.Down
    ? -market.changePercent
    : market.changeStatus === PriceChangeStatus.Up
    ? market.changePercent
    : 0

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
  const [selectedCategory, setSelectedCategory] = useState<
    CategoryId | undefined
  >(undefined)
  const filterScrollOffsetRef = useRef(0)
  const categoryScrollOffsetRef = useRef(0)
  const positionsScrollOffsetRef = useRef(0)

  const { markets, categoryIndex, isLoading, isRefreshing, refetch } =
    usePerpetualMarkets()
  // Perps manager init failure = our trading partner (Hyperliquid) is down.
  const { error: perpsError, retryInit } = usePerps()

  // Open the shared live-mid WS feed for as long as this screen is mounted;
  // individual rows read their own coin's mid via `useLiveMid`.
  usePerpsLiveMidsFeed()

  const categories = useMemo<PerpsCategoryChip[]>(() => {
    const names = markets.map(m => m.symbol)
    return availableCategories(names, categoryIndex).map(id => ({
      id,
      label: CATEGORY_LABELS[id]
    }))
  }, [markets, categoryIndex])

  const handleSelectFilter = useCallback((chip: string) => {
    setSelectedFilter(chip)
    AnalyticsService.capture('PerpetualsFilterChanged', {
      filter: chip as 'Trending' | 'Volume' | 'Change' | 'Price'
    })
  }, [])

  const handleSelectCategory = useCallback(
    (category: CategoryId | undefined) => {
      setSelectedCategory(category)
    },
    []
  )

  const handleSearchPress = useCallback(() => {
    router.navigate('/perpetualsSearch')
  }, [router])

  const categoryFilteredMarkets = useMemo(() => {
    if (selectedCategory === undefined) {
      return markets
    }
    return markets.filter(
      m => categoryIndex.get(m.symbol)?.has(selectedCategory) ?? false
    )
  }, [markets, categoryIndex, selectedCategory])

  const sortedMarkets = useMemo(() => {
    switch (selectedFilter) {
      case 'Volume':
        return [...categoryFilteredMarkets].sort((a, b) => b.volume - a.volume)
      case 'Change':
        return [...categoryFilteredMarkets].sort(
          (a, b) => signedChange(b) - signedChange(a)
        )
      case 'Price':
        return [...categoryFilteredMarkets].sort((a, b) => b.price - a.price)
      case 'Trending':
      default:
        return categoryFilteredMarkets
    }
  }, [selectedFilter, categoryFilteredMarkets])

  const handleMarketPress = useCallback(
    (symbol: string) => {
      router.navigate(`/perpetualsDetails?coin=${encodeURIComponent(symbol)}`)
    },
    [router]
  )

  const renderItem: ListRenderItem<PerpMarketView> = useCallback(
    ({ item, index }) => (
      <PerpetualListItem
        market={item}
        isFirst={index === 0}
        onPress={handleMarketPress}
      />
    ),
    [handleMarketPress]
  )

  const keyExtractor = useCallback((item: PerpMarketView) => item.id, [])

  const isFetchingNextPage = false

  const onEndReached = useCallback(() => {
    // Hyperliquid returns the full universe in one request — no pagination.
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

  const { isGeoBlocked } = usePerpsAvailability()

  const renderHeader = useCallback(
    () => (
      <View
        sx={{
          gap: 20
        }}>
        {isGeoBlocked && (
          <View style={{ paddingHorizontal: 16 }}>
            <PerpsGeoRestrictionWarning />
          </View>
        )}

        <Positions scrollOffsetRef={positionsScrollOffsetRef} />
        <View sx={{ gap: 4 }}>
          <TradeFilters
            chips={PERPETUAL_FILTERS}
            selectedChip={selectedFilter}
            onSelectChip={handleSelectFilter}
            onSearchPress={handleSearchPress}
            scrollOffsetRef={filterScrollOffsetRef}
          />
          <PerpsCategoryChips
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            scrollOffsetRef={categoryScrollOffsetRef}
          />
        </View>
      </View>
    ),
    [
      isGeoBlocked,
      selectedFilter,
      handleSelectFilter,
      handleSearchPress,
      categories,
      selectedCategory,
      handleSelectCategory
    ]
  )

  if (perpsError !== null) {
    return (
      <Animated.View
        testID="trade-perpetuals"
        entering={getListItemEnteringAnimation(10)}
        style={{ flex: 1 }}>
        <PerpsApiDownState onRetry={retryInit} />
      </Animated.View>
    )
  }

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

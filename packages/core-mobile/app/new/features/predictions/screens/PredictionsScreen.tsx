import {
  Chip,
  NavigationTitleHeader,
  Text,
  View,
  useTheme
} from '@avalabs/k2-alpine'
import type { TradableMarket } from '@avalabs/prediction-market-sdk'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { CollapsibleTabList } from 'common/components/CollapsibleTabList'
import {
  CollapsibleTabs,
  CollapsibleTabsRef
} from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { MarketCard } from 'features/predictions/components/MarketCard'
import { useMarketSeries } from 'features/predictions/hooks/useMarketSeries'
import {
  TRENDING_CHIP,
  usePredictionsFilter
} from 'features/predictions/hooks/usePredictionsFilter'
import { useTradableMarkets } from 'features/predictions/hooks/useTradableMarkets'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  LayoutChangeEvent,
  LayoutRectangle
} from 'react-native'
import type { TabBarProps } from 'react-native-collapsible-tab-view'
import { ScrollView } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'

const MARKETS_MOCK = [
  {
    category: 'Finance',
    seriesTicker: 'INXD-24-B4900',
    featuredImageUrl: 'https://via.placeholder.com/150',
    subTitle: 'Subtitle 1',
    tickerId: '1',
    yesMarketId: '1',
    noMarketId: '2',
    title: 'Market 1',
    imageUrl: 'https://via.placeholder.com/150',
    volume: '100',
    volume24h: '100',
    expectedExpirationTime: '2026-01-01',
    openTime: '2026-01-01',
    closeTime: '2026-01-01',
    result: null,
    yesQuote: {
      maxBidPrice: '100',
      minAskPrice: '100'
    },
    competition: 'Competition 1',
    competitionScope: 'Competition Scope 1',
    openInterest: '100',
    rulesPrimary: 'Rules Primary 1',
    kycRequired: false,
    noQuote: {
      maxBidPrice: '100',
      minAskPrice: '100'
    }
  },
  {
    category: 'Finance',
    seriesTicker: 'INXD-24-B4900',
    featuredImageUrl: 'https://via.placeholder.com/150',
    subTitle: 'Subtitle 2',
    tickerId: '2',
    yesMarketId: '2',
    noMarketId: '3',
    title: 'Market 2',
    competition: 'Competition 2',
    competitionScope: 'Competition Scope 2',
    openInterest: '100',
    rulesPrimary: 'Rules Primary 2',
    kycRequired: false,
    imageUrl: 'https://via.placeholder.com/150',
    volume: '100',
    volume24h: '100',
    expectedExpirationTime: '2026-01-01',
    openTime: '2026-01-01',
    closeTime: '2026-01-01',
    result: null,
    yesQuote: {
      maxBidPrice: '60',
      minAskPrice: '100'
    },
    noQuote: {
      maxBidPrice: '60',
      minAskPrice: '100'
    }
  }
] as unknown as TradableMarket[]

function renderEmptyTabBar(_props: TabBarProps): JSX.Element {
  return <></>
}

/**
 * Browse screen — shows all open prediction markets in a 2-column card grid.
 *
 * Uses CollapsibleTabs.Container (same pattern as Portfolio) for a collapsible
 * header containing the title, subtitle and chip filter row.
 * A single tab with CollapsibleTabs.FlashList renders the 2-column card grid.
 *
 * Chip row: "Trending" (always first) + unique categories from listSeries().
 * Default sort: volume24h descending.
 */
export function PredictionsScreen(): JSX.Element {
  const { theme } = useTheme()
  const tabViewRef = useRef<CollapsibleTabsRef>(null)

  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()

  const { markets, isLoading: marketsLoading, refetch } = useTradableMarkets()
  const { series } = useMarketSeries()
  const { selectedChip, filteredMarkets, selectChip } =
    usePredictionsFilter(MARKETS_MOCK)

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    setHeaderLayout(event.nativeEvent.layout)
  }, [])

  const header = useMemo(
    () => <NavigationTitleHeader title={'Predictions'} />,
    []
  )

  const { onScroll } = useFadingHeaderNavigation({
    header,
    targetLayout: headerLayout,
    /*
     * there's a bug on the Predictions screen where the BlurView
     * in the navigation header doesn't render correctly on initial load.
     * To work around it, we delay the BlurView's rendering slightly
     * so it captures the correct content behind it.
     *
     * note: we are also applying the same solution to the linear gradient bottom wrapper below
     */
    shouldDelayBlurOniOS: true
  })

  // Unique category chips: Trending first, then deduplicated series categories
  const chips = useMemo(() => {
    const cats = series
      .map(s => s.category)
      .filter((c, i, arr) => arr.indexOf(c) === i)
    return [TRENDING_CHIP, ...cats]
  }, [series])

  const renderHeader = useCallback(
    () => (
      <View
        onLayout={handleHeaderLayout}
        sx={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <Text
          sx={{
            fontFamily: 'Aeonik-Bold',
            fontSize: 36,
            lineHeight: 36,
            marginBottom: 4
          }}>
          Predictions
        </Text>
        <Text
          sx={{
            fontFamily: 'Inter-Regular',
            fontSize: 15,
            lineHeight: 20,
            opacity: 0.6,
            marginBottom: 16,
            width: 300
          }}>
          Bet on anything, choose your outcome with your crypto
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 8,
            paddingRight: 8
          }}>
          {chips.map(chip => (
            <Chip
              key={chip}
              size="large"
              variant={chip === selectedChip ? 'dark' : 'light'}
              onPress={() => selectChip(chip)}>
              {chip}
            </Chip>
          ))}
        </ScrollView>
      </View>
    ),
    [handleHeaderLayout, chips, selectedChip, selectChip]
  )

  const renderItem = useCallback(
    ({ item }: { item: TradableMarket }) => (
      <View sx={{ flex: 1, marginHorizontal: 7, marginBottom: 13 }}>
        <MarketCard
          market={item}
          onPress={() => {
            // Navigation to detail screen — wired in CP-13831
          }}
        />
      </View>
    ),
    []
  )

  const keyExtractor = useCallback((item: TradableMarket) => item.tickerId, [])

  const renderEmptyComponent = useCallback(
    () => (
      <CollapsibleTabs.ContentWrapper>
        {marketsLoading ? (
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
    [marketsLoading, refetch, theme.colors.$textPrimary]
  )

  const tabs = useMemo(
    () => [
      {
        tabName: 'Browse',
        component: (
          <Animated.View
            testID="portfolio_token_list"
            entering={getListItemEnteringAnimation(10)}
            style={{
              flex: 1
            }}>
            <CollapsibleTabList
              data={filteredMarkets}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              renderEmpty={renderEmptyComponent}
              isRefreshing={marketsLoading}
              numColumns={2}
              extraData={{ selectedChip }}
              listKey="predictions-browse"
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingBottom: 40
              }}
            />
          </Animated.View>
        )
      }
    ],
    [
      filteredMarkets,
      renderItem,
      keyExtractor,
      renderEmptyComponent,
      marketsLoading,
      selectedChip
    ]
  )

  return (
    <BlurredBarsContentLayout>
      <CollapsibleTabs.Container
        ref={tabViewRef}
        renderHeader={renderHeader}
        renderTabBar={renderEmptyTabBar}
        tabs={tabs}
        onScrollY={onScroll}
      />
    </BlurredBarsContentLayout>
  )
}

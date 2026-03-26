import {
  Chip,
  NavigationTitleHeader,
  SegmentedControl,
  Text,
  View,
  useTheme
} from '@avalabs/k2-alpine'
import type { TradableMarket } from '@avalabs/prediction-market-sdk'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { BottomTabWrapper } from 'common/components/BlurredBottomWrapper'
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
  InteractionManager,
  LayoutChangeEvent,
  LayoutRectangle
} from 'react-native'
import type { TabBarProps } from 'react-native-collapsible-tab-view'
import { ScrollView } from 'react-native-gesture-handler'
import Animated, { useSharedValue } from 'react-native-reanimated'
import { AnalyticsEventName } from 'services/analytics/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { MarketOption } from '../components/MarketCardOption'

type MockMarket = TradableMarket & { options: MarketOption[] }

const MARKETS_MOCK: MockMarket[] = [
  {
    tickerId: 'SPORTS-LIVE-TILE',
    title: 'Tile layout for live events',
    category: 'Sports',
    imageUrl: null,
    openTime: '2026-01-01T00:00:00Z',
    closeTime: '2027-06-01T00:00:00Z',
    expectedExpirationTime: '2027-06-01T00:00:00Z',
    volume: '8200',
    volume24h: '1400',
    kycRequired: false,
    result: null,
    yesQuote: { maxBidPrice: '0.73', minAskPrice: '0.75' },
    noQuote: { maxBidPrice: '0.23', minAskPrice: '0.25' },
    options: [
      {
        label: 'Team 1',
        imageUrl: 'https://picsum.photos/17',
        probability: 0.75
      },
      {
        label: 'Team 2',
        imageUrl: 'https://picsum.photos/17',
        probability: 0.25
      }
    ]
  },
  {
    tickerId: 'EPL-WINNER-2026',
    title: 'English Premier League Winner',
    category: 'Sports',
    imageUrl: 'https://picsum.photos/30',
    openTime: '2026-01-01T00:00:00Z',
    closeTime: '2027-05-20T00:00:00Z',
    expectedExpirationTime: '2027-05-20T00:00:00Z',
    volume: '24500',
    volume24h: '3800',
    kycRequired: false,
    result: null,
    yesQuote: { maxBidPrice: '0.77', minAskPrice: '0.79' },
    noQuote: { maxBidPrice: '0.16', minAskPrice: '0.18' },
    options: [
      {
        label: 'Arsenal',
        imageUrl: 'https://placehold.co/17x17',
        probability: 0.79
      },
      { label: 'Man City', imageUrl: null, probability: 0.18 },
      { label: 'Aston Villa', imageUrl: null, probability: 0.03 }
    ]
  },
  {
    tickerId: 'OSCARS-2026-BEST-PICTURE',
    title: 'Oscars 2026: Best Picture Winner',
    category: 'Entertainment',
    imageUrl: 'https://picsum.photos/30',
    openTime: '2026-01-01T00:00:00Z',
    closeTime: '2027-03-28T00:00:00Z',
    expectedExpirationTime: '2027-03-28T00:00:00Z',
    volume: '11000',
    volume24h: '2100',
    kycRequired: false,
    result: null,
    yesQuote: { maxBidPrice: '0.69', minAskPrice: '0.71' },
    noQuote: { maxBidPrice: '0.16', minAskPrice: '0.18' },
    options: [
      { label: 'One Battle at a Time', imageUrl: null, probability: 0.71 },
      { label: 'Sinners', imageUrl: null, probability: 0.18 },
      { label: 'Hamnet', imageUrl: null, probability: 0.05 }
    ]
  },
  {
    tickerId: 'BTC-150K-JUNE-2026',
    title: 'Will Bitcoin reach $150k by the end of June?',
    category: 'Crypto',
    imageUrl: 'https://picsum.photos/30',
    openTime: '2026-01-01T00:00:00Z',
    closeTime: '2026-06-30T00:00:00Z',
    expectedExpirationTime: '2026-06-30T00:00:00Z',
    volume: '43000',
    volume24h: '7200',
    kycRequired: false,
    result: null,
    yesQuote: { maxBidPrice: '0.02', minAskPrice: '0.04' },
    noQuote: { maxBidPrice: '0.94', minAskPrice: '0.96' },
    options: [
      { label: 'No', imageUrl: null, probability: 0.96 },
      { label: 'Yes', imageUrl: null, probability: 0.04 }
    ]
  },
  {
    tickerId: 'LOREM-IPSUM-POLITICS',
    title: 'Lorem ipsum dolor sit amet?',
    category: 'Politics',
    imageUrl: null,
    openTime: '2026-01-01T00:00:00Z',
    closeTime: '2026-12-31T00:00:00Z',
    expectedExpirationTime: '2026-12-31T00:00:00Z',
    volume: '5600',
    volume24h: '900',
    kycRequired: false,
    result: null,
    yesQuote: { maxBidPrice: '0.73', minAskPrice: '0.75' },
    noQuote: { maxBidPrice: '0.23', minAskPrice: '0.25' },
    options: [
      { label: 'Yes', imageUrl: null, probability: 0.75 },
      { label: 'No', imageUrl: null, probability: 0.25 }
    ]
  }
] as unknown as MockMarket[]

const SEGMENT_ITEMS = [{ title: 'Predictions' }, { title: 'Perps' }]

const SEGMENT_EVENT_MAP: Record<number, AnalyticsEventName> = {
  0: 'PredictionsClicked',
  1: 'PerpsClicked'
}

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

  const [segmentedControlLayout, setSegmentedControlLayout] = useState<
    LayoutRectangle | undefined
  >()

  const selectedSegmentIndex = useSharedValue(0)

  const { isLoading: marketsLoading, refetch } = useTradableMarkets()
  const { series } = useMarketSeries()
  const { selectedChip, filteredMarkets, selectChip } = usePredictionsFilter(
    MARKETS_MOCK as unknown as TradableMarket[]
  )

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    setHeaderLayout(event.nativeEvent.layout)
  }, [])

  const handleSegmentedControlLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setSegmentedControlLayout(event.nativeEvent.layout)
    },
    []
  )

  const handleSelectSegment = useCallback(
    (index: number): void => {
      const eventName = SEGMENT_EVENT_MAP[index]

      if (eventName) {
        AnalyticsService.capture(eventName)
      }

      selectedSegmentIndex.value = index

      InteractionManager.runAfterInteractions(() => {
        if (tabViewRef.current?.getCurrentIndex() !== index) {
          tabViewRef.current?.setIndex(index)
        }
      })
    },
    [selectedSegmentIndex]
  )

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
        sx={{ paddingHorizontal: 16, paddingVertical: 14 }}>
        <View
          sx={{
            backgroundColor: theme.colors.$surfacePrimary,
            gap: 8
          }}>
          <Text variant="heading2">Predictions</Text>
          <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
            Bet on anything, choose your outcome with your crypto
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 8,
            marginTop: 18
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
    [
      handleHeaderLayout,
      theme.colors.$surfacePrimary,
      chips,
      selectedChip,
      selectChip
    ]
  )

  const renderItem = useCallback(({ item }: { item: TradableMarket }) => {
    const options = (item as MockMarket).options ?? []
    return (
      <View sx={{ flex: 1, marginHorizontal: 7, marginBottom: 13 }}>
        <MarketCard
          market={item}
          options={options}
          onPress={() => {
            // Navigation to detail screen — wired in CP-13831
          }}
        />
      </View>
    )
  }, [])

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
        tabName: 'Predictions',
        component: (
          <Animated.View
            testID="trade-predictions"
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
              masonry
              extraData={{ selectedChip }}
              listKey="trade-predictions"
              contentContainerStyle={{
                paddingHorizontal: 8,
                paddingBottom: (segmentedControlLayout?.height ?? 0) + 32
              }}
            />
          </Animated.View>
        )
      },
      {
        tabName: 'Perps',
        component: (
          <Animated.View
            testID="trade-perps"
            entering={getListItemEnteringAnimation(10)}
            style={{
              flex: 1
            }}>
            <Text>Perps</Text>
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
      selectedChip,
      segmentedControlLayout?.height
    ]
  )

  const renderSegmentedControl = useCallback(
    (): JSX.Element => (
      <SegmentedControl
        dynamicItemWidth={false}
        items={SEGMENT_ITEMS}
        selectedSegmentIndex={selectedSegmentIndex}
        onSelectSegment={handleSelectSegment}
        style={{
          marginHorizontal: 16,
          marginBottom: 16
        }}
      />
    ),
    [handleSelectSegment, selectedSegmentIndex]
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

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0
        }}
        onLayout={handleSegmentedControlLayout}>
        <BottomTabWrapper>{renderSegmentedControl()}</BottomTabWrapper>
      </View>
    </BlurredBarsContentLayout>
  )
}

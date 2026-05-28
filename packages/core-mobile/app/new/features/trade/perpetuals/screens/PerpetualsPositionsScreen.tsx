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
import { PositionCard } from '../components/PositionCard'
import { MY_POSITIONS_MOCK, POSITIONS_SUMMARY_MOCK } from '../mocks'
import { Position } from '../types'

const FILTERS: TradeFilterChip[] = ['All', 'Closed', 'Won', 'Ending soon']

export const PerpetualsPositionsScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const headerHeight = useEffectiveHeaderHeight()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [selectedFilter, setSelectedFilter] = useState<string>(
    FILTERS[0] as string
  )
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
      filter: chip as 'All' | 'Closed' | 'Won' | 'Ending soon'
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

  const positions = MY_POSITIONS_MOCK

  const formattedOpen = String(POSITIONS_SUMMARY_MOCK.openPositions)
  const formattedPnl = formatCurrency({ amount: POSITIONS_SUMMARY_MOCK.pnl })
  const pnlSign = POSITIONS_SUMMARY_MOCK.pnl >= 0 ? '+' : ''
  const formattedChange = `${POSITIONS_SUMMARY_MOCK.changePercent.toFixed(2)}%`
  const pnlColor =
    POSITIONS_SUMMARY_MOCK.pnlStatus === PriceChangeStatus.Up
      ? theme.colors.$textSuccess
      : POSITIONS_SUMMARY_MOCK.pnlStatus === PriceChangeStatus.Down
      ? theme.colors.$textDanger
      : theme.colors.$textPrimary

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
              leftIcon={
                <StatusArrow
                  status={POSITIONS_SUMMARY_MOCK.changeStatus}
                  size={14}
                />
              }
            />
            <SummaryStat
              label="Total P&L"
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
      pnlSign,
      formattedPnl,
      pnlColor,
      selectedFilter,
      handleSelectFilter,
      handleSearchPress
    ]
  )

  const renderItem: ListRenderItem<Position> = useCallback(
    ({ item, index }) => (
      <View sx={{ paddingHorizontal: 16, marginTop: index === 0 ? 0 : 10 }}>
        <PositionCard position={item} fullWidth expandable />
      </View>
    ),
    []
  )

  const keyExtractor = useCallback((item: Position) => item.id, [])

  const renderEmpty = useCallback(
    () => (
      <CollapsibleTabs.ContentWrapper>
        <ErrorState
          icon={undefined}
          title="No positions yet"
          description="Open a position from the Perps tab to see it here"
        />
      </CollapsibleTabs.ContentWrapper>
    ),
    []
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
              data={positions}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              renderEmpty={renderEmpty}
              extraData={{ selectedFilter }}
              containerStyle={contentContainerStyle}
              contentContainerStyle={contentContainerStyle}
              listKey="my-positions"
            />
          </Animated.View>
        )
      }
    ],
    [
      positions,
      renderItem,
      keyExtractor,
      renderEmpty,
      selectedFilter,
      contentContainerStyle
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

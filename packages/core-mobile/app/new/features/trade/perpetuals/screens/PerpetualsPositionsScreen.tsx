import {
  NavigationTitleHeader,
  PriceChangeStatus,
  SegmentedControl,
  StatusArrow,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import {
  CollapsibleTabs,
  CollapsibleTabsRef,
  OnTabChange
} from 'common/components/CollapsibleTabs'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  InteractionManager,
  LayoutChangeEvent,
  LayoutRectangle,
  Platform
} from 'react-native'
import Animated, { useSharedValue } from 'react-native-reanimated'
import {
  useSafeAreaFrame,
  useSafeAreaInsets
} from 'react-native-safe-area-context'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { OpenOrdersList } from '../components/OpenOrdersList'
import { PerpsActivityList } from '../components/PerpsActivityList'
import PositionsList from '../components/PositionsList'
import { usePerpsPositionsView } from '../hooks/usePerpsPositionsView'
import { usePerpsUserFills } from '../hooks/usePerpsUserFills'
import { toNumber } from '../utils/format'
import { toPositionsSummary } from '../utils/toPosition'

const SEGMENT_ITEMS = [
  { title: 'All positions' },
  { title: 'Open orders' },
  {
    title: 'Activity'
  }
]

/** Rolling window for the "24h change" stat. */
const MS_24H = 24 * 60 * 60 * 1000

export const PerpetualsPositionsScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const headerHeight = useEffectiveHeaderHeight()
  const insets = useSafeAreaInsets()
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

  const selectedSegmentIndex = useSharedValue(0)
  const [segmentedControlLayout, setSegmentedControlLayout] = useState<
    LayoutRectangle | undefined
  >(undefined)

  const handleSegmentedControlLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setSegmentedControlLayout(event.nativeEvent.layout)
    },
    []
  )

  const handleSelectSegment = useCallback(
    (index: number): void => {
      selectedSegmentIndex.value = index
      InteractionManager.runAfterInteractions(() => {
        if (tabViewRef.current?.getCurrentIndex() !== index) {
          tabViewRef.current?.setIndex(index)
        }
      })
    },
    [selectedSegmentIndex]
  )

  const handleTabChange: OnTabChange = useCallback(
    data => {
      if (selectedSegmentIndex.value === data.prevIndex) {
        selectedSegmentIndex.value = data.index
      }
    },
    [selectedSegmentIndex]
  )

  const { rawPositions } = usePerpsPositionsView()
  const summary = useMemo(
    () => toPositionsSummary(rawPositions),
    [rawPositions]
  )

  // Closed positions come from trade history (fills that closed a position),
  // not the clearinghouse — HL only keeps *open* positions in clearinghouse
  // state. Keep the closing fills so they can be listed alongside open ones.
  const { fills } = usePerpsUserFills()

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
    targetLayout: headerLayout
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
      pnlColor
    ]
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
      paddingBottom: (segmentedControlLayout?.height ?? 0) + 32,
      minHeight: tabHeight
    }
  }, [tabHeight, segmentedControlLayout?.height])

  const tabs = useMemo(
    () => [
      {
        tabName: 'positions',
        component: (
          <Animated.View
            entering={getListItemEnteringAnimation(10)}
            style={{ flex: 1 }}>
            <PositionsList containerStyle={contentContainerStyle} />
          </Animated.View>
        )
      },
      {
        tabName: 'openOrders',
        component: (
          <Animated.View
            entering={getListItemEnteringAnimation(10)}
            style={{ flex: 1 }}>
            <OpenOrdersList containerStyle={contentContainerStyle} />
          </Animated.View>
        )
      },
      {
        tabName: 'activity',
        component: (
          <Animated.View
            entering={getListItemEnteringAnimation(10)}
            style={{ flex: 1 }}>
            <PerpsActivityList containerStyle={contentContainerStyle} />
          </Animated.View>
        )
      }
    ],
    [contentContainerStyle]
  )

  const renderEmptyTabBar = useCallback((): JSX.Element => <></>, [])

  return (
    <BlurredBarsContentLayout>
      <CollapsibleTabs.Container
        ref={tabViewRef}
        renderHeader={renderHeader}
        renderTabBar={renderEmptyTabBar}
        onTabChange={handleTabChange}
        onScrollY={onScroll}
        tabs={tabs}
      />

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0
        }}
        onLayout={handleSegmentedControlLayout}>
        <LinearGradientBottomWrapper>
          <SegmentedControl
            dynamicItemWidth={false}
            items={SEGMENT_ITEMS}
            selectedSegmentIndex={selectedSegmentIndex}
            onSelectSegment={handleSelectSegment}
            style={{
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 16
            }}
          />
        </LinearGradientBottomWrapper>
      </View>

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

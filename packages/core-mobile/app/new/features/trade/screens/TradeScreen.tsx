import {
  alpha,
  NavigationTitleHeader,
  SegmentedControl,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { BottomTabWrapper } from 'common/components/BlurredBottomWrapper'
import {
  CollapsibleTabs,
  CollapsibleTabsRef,
  OnTabChange
} from 'common/components/CollapsibleTabs'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  InteractionManager,
  LayoutChangeEvent,
  LayoutRectangle
} from 'react-native'
import type { TabBarProps } from 'react-native-collapsible-tab-view'
import Animated, { useSharedValue } from 'react-native-reanimated'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { AnalyticsEventName } from 'services/analytics/types'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { PredictionBalanceRow } from '../predictions/components/PredictionBalanceRow'
import { PredictionsScreen } from '../predictions/screens/PredictionsScreen'

const BALANCE_ROW_HEIGHT = 60
const BALANCE_ROW_VERTICAL_MARGIN = 28 // 14 top + 14 bottom
const MIN_HEADER_HEIGHT = BALANCE_ROW_HEIGHT + BALANCE_ROW_VERTICAL_MARGIN

const SEGMENT_ITEMS = [{ title: 'Predictions' }, { title: 'Perps' }]

const SEGMENT_EVENT_MAP: Record<number, AnalyticsEventName> = {
  0: 'PredictionsClicked',
  1: 'PerpsClicked'
}

function renderEmptyTabBar(_props: TabBarProps): JSX.Element {
  return <></>
}

/**
 * Trade screen with a collapsible header and segmented navigation between
 * the Predictions and Perps tabs.
 */
export function TradeScreen(): JSX.Element {
  const { theme } = useTheme()
  const headerHeight = useEffectiveHeaderHeight()
  const frame = useSafeAreaFrame()
  const tabViewRef = useRef<CollapsibleTabsRef>(null)

  const selectedSegmentIndex = useSharedValue(0)
  const [selectedTab, setSelectedTab] = useState(0)

  const [segmentedControlLayout, setSegmentedControlLayout] = useState<
    LayoutRectangle | undefined
  >()

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
      setSelectedTab(index)

      InteractionManager.runAfterInteractions(() => {
        if (tabViewRef.current?.getCurrentIndex() !== index) {
          tabViewRef.current?.setIndex(index)
        }
      })
    },
    [selectedSegmentIndex]
  )

  const tabTitle = selectedTab === 0 ? 'Predictions' : 'Perps'
  const tabDescription =
    selectedTab === 0
      ? 'Trade what happens next in global markets powered by Kalshi'
      : 'Trade perpetual futures long or short with leverage powered by Hyperliquid'

  const header = useMemo(
    () => <NavigationTitleHeader title={tabTitle} />,
    [tabTitle]
  )

  const { onScroll } = useFadingHeaderNavigation({
    header,
    // targetLayout: headerLayout,
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

  const tabHeight = useMemo(
    () => frame.height - headerHeight,
    [frame.height, headerHeight]
  )

  const contentContainerStyle = useMemo(() => {
    return {
      paddingBottom: (segmentedControlLayout?.height ?? 0) + 32,
      minHeight: tabHeight
    }
  }, [segmentedControlLayout?.height, tabHeight])

  const tabs = useMemo(
    () => [
      {
        tabName: 'Predictions',
        component: <PredictionsScreen containerStyle={contentContainerStyle} />
      },
      {
        tabName: 'Perps',
        component: (
          <Animated.View
            testID="trade-perps"
            entering={getListItemEnteringAnimation(10)}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <Text>Perps</Text>
          </Animated.View>
        )
      }
    ],
    [contentContainerStyle]
  )

  const onTabChange: OnTabChange = useCallback(
    data => {
      if (selectedSegmentIndex.value === data.prevIndex) {
        selectedSegmentIndex.value = data.index
        setSelectedTab(data.index)
      }
    },
    [selectedSegmentIndex]
  )

  const renderContainerHeader = useCallback(
    (): JSX.Element => (
      <View
        style={{
          paddingTop: 14,
          paddingBottom: 16
        }}>
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          <Text variant="heading2">{tabTitle}</Text>
          <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
            {tabDescription}
          </Text>
        </View>
        <View>
          <LinearGradient
            colors={[
              theme.colors.$surfacePrimary,
              alpha(theme.colors.$surfacePrimary, 0)
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0, y: 1 }}
            style={{
              height: 90,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          />

          <View
            style={{
              marginTop: 14,
              marginHorizontal: 16
            }}>
            <PredictionBalanceRow />
          </View>
        </View>
      </View>
    ),
    [tabTitle, tabDescription, theme.colors.$surfacePrimary]
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
        renderTabBar={renderEmptyTabBar}
        tabs={tabs}
        onScrollY={onScroll}
        onTabChange={onTabChange}
        renderHeader={renderContainerHeader}
        minHeaderHeight={MIN_HEADER_HEIGHT}
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

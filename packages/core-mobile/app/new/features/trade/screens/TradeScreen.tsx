import {
  NavigationTitleHeader,
  SegmentedControl,
  Text,
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
  LayoutRectangle,
  Platform
} from 'react-native'
import type { TabBarProps } from 'react-native-collapsible-tab-view'
import Animated, { useSharedValue } from 'react-native-reanimated'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { AnalyticsEventName } from 'services/analytics/types'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { PredictionsScreen } from '../predictions/screens/PredictionsScreen'

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
export function TradeScreen(): JSX.Element {
  const headerHeight = useEffectiveHeaderHeight()
  const frame = useSafeAreaFrame()
  const tabViewRef = useRef<CollapsibleTabsRef>(null)

  const selectedSegmentIndex = useSharedValue(0)

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

  const tabHeight = useMemo(() => {
    return Platform.select({
      ios: frame.height - headerHeight,
      android: frame.height - headerHeight
    })
  }, [frame.height, headerHeight])

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
      }
    },
    [selectedSegmentIndex]
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
        renderHeader={() => <></>}
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

import { View } from '@avalabs/k2-alpine'
import { useBottomTabBarHeight } from 'common/hooks/useBottomTabBarHeight'
import React, { forwardRef, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import {
  CollapsibleRef,
  OnTabChangeCallback,
  TabBarProps,
  Tabs,
  useCurrentTabScrollY,
  useHeaderMeasurements
} from 'react-native-collapsible-tab-view'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { scheduleOnRN } from 'react-native-worklets'

export type OnTabChange = OnTabChangeCallback<string>

export const CollapsibleTabsContainer = forwardRef<
  CollapsibleRef,
  {
    renderHeader: () => JSX.Element
    renderTabBar: (props: TabBarProps) => JSX.Element
    onIndexChange?: (index: number) => void
    onTabChange?: OnTabChange
    onScrollY?: (contentOffsetY: number) => void
    tabs: { tabName: string; component: JSX.Element }[]
    minHeaderHeight?: number
    /**
     * Reserve header space via layout `paddingTop` instead of the native iOS
     * `contentInset` model. Defaults to `true` because the New Architecture
     * (Fabric) clamps programmatic scrolling into a negative `contentInset`
     * region, which breaks the iOS inset model on tab switch / remount (content
     * renders under the header). The layout model needs no negative scroll.
     */
    useLayoutHeaderInset?: boolean
  }
>(
  (
    {
      tabs,
      renderHeader,
      renderTabBar,
      onIndexChange,
      onTabChange,
      onScrollY,
      minHeaderHeight,
      useLayoutHeaderInset = true
    },
    ref
  ): JSX.Element => {
    const content = useMemo(() => {
      return tabs.map(tab => (
        <Tabs.Tab key={tab.tabName} name={tab.tabName}>
          <CollapsibleTabWrapper
            component={tab.component}
            onScrollY={onScrollY}
          />
        </Tabs.Tab>
      ))
    }, [onScrollY, tabs])

    const pagerProps = useMemo(() => {
      return {
        style: styles.overflow,
        // Disable swipe between tabs when there's only one tab. iOS PagerView
        // shows a rubber-band/enlarge effect at the edge of a single-tab pager
        // when scroll is enabled.
        scrollEnabled: tabs.length > 1
      }
    }, [tabs.length])

    return (
      <Tabs.Container
        ref={ref}
        headerContainerStyle={styles.tabsContainer}
        containerStyle={styles.overflow}
        renderHeader={renderHeader}
        renderTabBar={renderTabBar}
        pagerProps={pagerProps}
        onTabChange={onTabChange}
        onIndexChange={onIndexChange}
        minHeaderHeight={minHeaderHeight}
        useLayoutHeaderInset={useLayoutHeaderInset}>
        {content}
      </Tabs.Container>
    )
  }
)

const CollapsibleTabWrapper = ({
  component,
  onScrollY
}: {
  component: JSX.Element
  onScrollY?: (contentOffsetY: number) => void
}): JSX.Element => {
  const scrollY = useCurrentTabScrollY()

  useAnimatedReaction(
    () => scrollY.value,
    (curr, prev) => {
      if (curr !== prev && onScrollY) {
        scheduleOnRN(onScrollY, scrollY.value)
      }
    }
  )

  return component
}

const ContentWrapper = ({
  children,
  animate = true,
  extraOffset = 0
}: {
  children: React.ReactNode
  /**
   * Extra bottom padding added to the wrapper. Useful when there are missing UI
   * elements (like SegmentedControl) that would normally take space below the
   * content.
   * @default 0
   */
  animate?: boolean
  extraOffset?: number
}): JSX.Element => {
  const scrollY = useCurrentTabScrollY()
  const insets = useSafeAreaInsets()
  const header = useHeaderMeasurements()
  const tabBarHeight = useBottomTabBarHeight()

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = animate
      ? interpolate(
          scrollY.value,
          [0, header.height],
          [-48, tabBarHeight],
          Extrapolation.CLAMP
        )
      : 0

    return {
      transform: [
        {
          translateY
        }
      ]
    }
  })

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Animated.View
        style={[
          animatedStyle,
          {
            paddingBottom: insets.bottom + tabBarHeight + extraOffset
          }
        ]}>
        {children}
      </Animated.View>
    </View>
  )
}

export const CollapsibleTabs = {
  Container: CollapsibleTabsContainer,
  ContentWrapper: ContentWrapper,
  Tab: Tabs.Tab,
  FlatList: Tabs.FlatList,
  ScrollView: Tabs.ScrollView,
  FlashList: Tabs.FlashList
}

export type CollapsibleTabsRef = CollapsibleRef

const styles = StyleSheet.create({
  overflow: {
    overflow: 'visible'
  },
  tabsContainer: {
    shadowOpacity: 0,
    elevation: 0,
    overflow: 'visible',
    backgroundColor: 'transparent',
    zIndex: 1
  }
})

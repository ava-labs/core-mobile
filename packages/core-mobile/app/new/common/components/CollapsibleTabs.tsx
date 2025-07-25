import { ANIMATED, View } from '@avalabs/k2-alpine'
import React, { forwardRef, useMemo } from 'react'
import { Platform, StyleSheet } from 'react-native'
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
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'

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
      minHeaderHeight
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
        style: styles.overflow
      }
    }, [])

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
        minHeaderHeight={minHeaderHeight}>
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
        runOnJS(onScrollY)(scrollY.value)
      }
    }
  )

  return component
}

const ContentWrapper = ({
  children,
  height
}: {
  children: React.ReactNode
  height: number
}): JSX.Element => {
  const scrollY = useCurrentTabScrollY()
  const header = useHeaderMeasurements()

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, header.height],
      [-header.height / 2, 0],
      Extrapolation.CLAMP
    )
    return {
      transform: [
        {
          translateY: withTiming(translateY, {
            ...ANIMATED.TIMING_CONFIG,
            duration: 250
          })
        }
      ]
    }
  })

  return (
    <View
      style={{
        height: height - (Platform.OS === 'android' ? header.height + 32 : 24),
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </View>
  )
}

export const CollapsibleTabs = {
  Container: CollapsibleTabsContainer,
  ContentWrapper: ContentWrapper,
  Tab: Tabs.Tab,
  FlatList: Tabs.FlatList,
  MasonryList: Tabs.MasonryFlashList,
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
    overflow: 'visible'
  }
})

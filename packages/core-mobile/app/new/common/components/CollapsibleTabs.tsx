import { ANIMATED, View } from '@avalabs/k2-alpine'
import React, { forwardRef, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import {
  CollapsibleRef,
  OnTabChangeCallback,
  TabBarProps,
  Tabs,
  useCurrentTabScrollY
} from 'react-native-collapsible-tab-view'
import Animated, {
  runOnJS,
  SharedValue,
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
  bottomOffset,
  height
}: {
  children: React.ReactNode
  bottomOffset: SharedValue<number>
  height: number
}): JSX.Element => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(-bottomOffset.value, {
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
        height: height,
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

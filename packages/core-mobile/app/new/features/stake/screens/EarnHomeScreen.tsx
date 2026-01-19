import {
  NavigationTitleHeader,
  Text,
  View,
  SegmentedControl
} from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { BottomTabWrapper } from 'common/components/BlurredBottomWrapper'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import DepositTabScreen from 'features/defiMarket/screens/DepositTabScreen'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeSyntheticEvent,
  Platform,
  ViewStyle
} from 'react-native'
import PagerView, {
  PagerViewOnPageScrollEventData,
  PagerViewOnPageSelectedEventData
} from 'react-native-pager-view'
import Animated, {
  AnimatedStyle,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import {
  useSafeAreaFrame,
  useSafeAreaInsets
} from 'react-native-safe-area-context'
import { scheduleOnRN } from 'react-native-worklets'
import { useSelector } from 'react-redux'
import {
  selectIsInAppDefiBlocked,
  selectIsInAppDefiNewBlocked
} from 'store/posthog'
import StakeTabScreen from './StakeTabScreen'

export const EarnHomeScreen = (): JSX.Element => {
  const frame = useSafeAreaFrame()
  const insets = useSafeAreaInsets()
  const pagerRef = useRef<PagerView>(null)
  const isInAppDefiBlocked = useSelector(selectIsInAppDefiBlocked)
  const isInAppDefiNewBlocked = useSelector(selectIsInAppDefiNewBlocked)

  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()

  const [segmentedControlLayout, setSegmentedControlLayout] = useState<
    LayoutRectangle | undefined
  >()

  const selectedSegmentIndex = useSharedValue(0)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useAnimatedReaction(
    () => selectedSegmentIndex.value,
    (currentValue, previousValue) => {
      if (currentValue !== previousValue && Number.isInteger(currentValue)) {
        scheduleOnRN(setSelectedIndex, currentValue)
      }
    }
  )

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent): void => {
    setHeaderLayout(event.nativeEvent.layout)
  }, [])

  const animatedNavigationTitleHeaderStyle = useAnimatedStyle(() => {
    const progress = selectedSegmentIndex.value
    const isInteger = Number.isInteger(progress)

    if (isInteger) {
      return {
        opacity: withTiming(1, { duration: 300 })
      }
    } else {
      return {
        opacity: withTiming(0, { duration: 300 })
      }
    }
  })

  const animatedBadgeStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - selectedSegmentIndex.value
    }
  })

  const header = useMemo(() => {
    return (
      <Animated.View style={animatedNavigationTitleHeaderStyle}>
        <NavigationTitleHeader
          title={selectedIndex === 0 ? 'Stake' : 'Deposit'}
        />
      </Animated.View>
    )
  }, [selectedIndex, animatedNavigationTitleHeaderStyle])

  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: header,
    targetLayout: headerLayout,
    hasSeparator: false
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const handleSelectSegment = useCallback((index: number): void => {
    pagerRef.current?.setPage(index)
  }, [])

  const handleTabChange = useCallback(
    (e: NativeSyntheticEvent<PagerViewOnPageSelectedEventData>) => {
      selectedSegmentIndex.value = e.nativeEvent.position
    },
    [selectedSegmentIndex]
  )

  const handleTabScroll = useCallback(
    (e: NativeSyntheticEvent<PagerViewOnPageScrollEventData>) => {
      selectedSegmentIndex.value = e.nativeEvent.position + e.nativeEvent.offset
    },
    [selectedSegmentIndex]
  )

  const handleSegmentedControlLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setSegmentedControlLayout(event.nativeEvent.layout)
    },
    []
  )

  const tabHeight = useMemo(() => {
    return frame.height + (Platform.OS === 'android' ? insets.bottom : 0)
  }, [frame.height, insets.bottom])

  const contentContainerStyle = useMemo(() => {
    return {
      paddingBottom: (segmentedControlLayout?.height ?? 0) + 32,
      paddingTop: 10,
      minHeight: tabHeight
    }
  }, [segmentedControlLayout?.height, tabHeight])

  const tabs = useMemo(() => {
    return [
      {
        id: EarnHomeScreenTab.Stake,
        title: EarnHomeScreenTab.Stake,
        component: (
          <StakeTabScreen
            onScroll={onScroll}
            onHeaderLayout={handleHeaderLayout}
            animatedHeaderStyle={animatedHeaderStyle}
            containerStyle={contentContainerStyle}
            isActive={selectedIndex === 0}
          />
        )
      },
      {
        id: EarnHomeScreenTab.Deposit,
        title: EarnHomeScreenTab.Deposit,
        component: (
          <DepositTabScreen
            onScroll={onScroll}
            onHeaderLayout={handleHeaderLayout}
            animatedHeaderStyle={animatedHeaderStyle}
            containerStyle={contentContainerStyle}
            isActive={selectedIndex === 1}
          />
        )
      }
    ]
  }, [
    contentContainerStyle,
    animatedHeaderStyle,
    onScroll,
    handleHeaderLayout,
    selectedIndex
  ])

  const segmentedControlItems = useMemo(
    () => [
      { title: EarnHomeScreenTab.Stake },
      {
        title: EarnHomeScreenTab.Deposit,
        badge:
          isInAppDefiNewBlocked === false ? (
            <NewBadge style={animatedBadgeStyle} />
          ) : undefined
      }
    ],
    [animatedBadgeStyle, isInAppDefiNewBlocked]
  )

  return (
    <BlurredBarsContentLayout>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handleTabChange}
        onPageScroll={handleTabScroll}
        offscreenPageLimit={1}
        pageMargin={Platform.OS === 'android' ? 0 : undefined}>
        {tabs.map(tab => (
          <View key={tab.id}>{tab.component}</View>
        ))}
      </PagerView>
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0
        }}
        onLayout={handleSegmentedControlLayout}>
        {isInAppDefiBlocked ? undefined : (
          <BottomTabWrapper>
            <SegmentedControl
              dynamicItemWidth={false}
              items={segmentedControlItems}
              selectedSegmentIndex={selectedSegmentIndex}
              onSelectSegment={handleSelectSegment}
              style={{
                marginHorizontal: 16,
                marginBottom: 16
              }}
            />
          </BottomTabWrapper>
        )}
      </View>
    </BlurredBarsContentLayout>
  )
}

enum EarnHomeScreenTab {
  Stake = 'Stake',
  Deposit = 'Deposit'
}

const NewBadge = ({
  style
}: {
  style: AnimatedStyle<ViewStyle>
}): JSX.Element => {
  return (
    <Animated.View
      style={[
        style,
        {
          backgroundColor: '#F7B500',
          paddingHorizontal: 5,
          paddingVertical: 2,
          borderRadius: 100,
          position: 'absolute',
          top: -6,
          right: -32
        }
      ]}>
      <Text
        sx={{
          fontSize: 8,
          lineHeight: 10,
          fontWeight: '700',
          color: '$black'
        }}>
        NEW
      </Text>
    </Animated.View>
  )
}

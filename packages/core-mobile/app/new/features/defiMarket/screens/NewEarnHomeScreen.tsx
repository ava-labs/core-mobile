import {
  NavigationTitleHeader,
  SegmentedControl,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { BottomTabWrapper } from 'common/components/BlurredBottomWrapper'
import { Placeholder } from 'common/components/Placeholder'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeSyntheticEvent,
  Platform
} from 'react-native'
import PagerView, {
  PagerViewOnPageScrollEventData,
  PagerViewOnPageSelectedEventData
} from 'react-native-pager-view'
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import CoreAppIconLight from '../../../assets/icons/core-app-icon-light.svg'
import CoreAppIconDark from '../../../assets/icons/core-app-icon-dark.svg'
import DepositTabScreen from './DepositTabScreen'
import BorrowTabScreen from './BorrowTabScreen'

export const NewEarnHomeScreen = (): JSX.Element => {
  const frame = useSafeAreaFrame()
  const headerHeight = useHeaderHeight()
  const pagerRef = useRef<PagerView>(null)
  const { theme } = useTheme()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const dispatch = useDispatch()

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
        runOnJS(setSelectedIndex)(currentValue)
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

  const header = useMemo(() => {
    return (
      <Animated.View style={animatedNavigationTitleHeaderStyle}>
        <NavigationTitleHeader
          title={selectedIndex === 0 ? 'Deposit' : 'Borrow'}
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
    return frame.height - headerHeight
  }, [frame.height, headerHeight])

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
        id: EarnTab.Deposit,
        title: EarnTab.Deposit,
        component: (
          <DepositTabScreen
            onScroll={onScroll}
            onHeaderLayout={handleHeaderLayout}
            animatedHeaderStyle={animatedHeaderStyle}
            containerStyle={contentContainerStyle}
            isActive={selectedIndex === 0}
          />
        )
      },
      {
        id: EarnTab.Borrow,
        title: EarnTab.Borrow,
        component: (
          <BorrowTabScreen
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
    () => [{ title: EarnTab.Deposit }, { title: EarnTab.Borrow }],
    []
  )

  if (isDeveloperMode) {
    return (
      <Placeholder
        sx={{ flex: 1, paddingBottom: 50 }}
        icon={
          <View style={{ marginBottom: 0 }}>
            {theme.isDark ? <CoreAppIconLight /> : <CoreAppIconDark />}
            <View
              style={{
                position: 'absolute',
                bottom: -15,
                right: -14
              }}>
              <Text variant="heading6" sx={{ fontSize: 36, lineHeight: 44 }}>
                ⚠️
              </Text>
            </View>
          </View>
        }
        title={`Earn is only\navailable on mainnet`}
        description="Earn yield by depositing crypto into lending protocols and withdraw anytime."
        button={{
          title: 'Turn off testnet',
          onPress: () => {
            dispatch(toggleDeveloperMode())
          }
        }}
      />
    )
  }

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
      </View>
    </BlurredBarsContentLayout>
  )
}

enum EarnTab {
  Deposit = 'Deposit',
  Borrow = 'Borrow'
}

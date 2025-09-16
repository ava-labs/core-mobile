import {
  NavigationTitleHeader,
  SegmentedControl,
  Text,
  useMotion,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { useIsFocused } from '@react-navigation/native'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { BottomTabWrapper } from 'common/components/BlurredBottomWrapper'
import {
  CollapsibleTabs,
  CollapsibleTabsRef,
  OnTabChange
} from 'common/components/CollapsibleTabs'
import { LoadingState } from 'common/components/LoadingState'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { useRouter } from 'expo-router'
import { ActiveStakesScreen } from 'features/stake/components/ActiveStakesScreen'
import { AllStakesScreen } from 'features/stake/components/AllStakesScreen'
import { Banner } from 'features/stake/components/Banner'
import { CompletedStakesScreen } from 'features/stake/components/CompletedStakesScreen'
import { useAddStake } from 'features/stake/hooks/useAddStake'
import { useStakes } from 'hooks/earn/useStakes'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AppState,
  InteractionManager,
  LayoutChangeEvent,
  LayoutRectangle,
  Platform
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useSafeAreaFrame } from 'react-native-safe-area-context'

export const StakeHomeScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const frame = useSafeAreaFrame()
  const headerHeight = useHeaderHeight()
  const { data, isLoading } = useStakes()
  const { theme } = useTheme()
  const tabViewRef = useRef<CollapsibleTabsRef>(null)

  const [balanceHeaderLayout, setBalanceHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()

  const [segmentedControlLayout, setSegmentedControlLayout] = useState<
    LayoutRectangle | undefined
  >()

  const selectedSegmentIndex = useSharedValue(0)
  const isFocused = useIsFocused()
  const [appState, setAppState] = useState(AppState.currentState)
  const isMotionActive = useMemo(
    () => appState === 'active' && isFocused && Platform.OS === 'ios',
    [appState, isFocused]
  )

  const motion = useMotion(isMotionActive)
  const isEmpty = !data || data.length === 0
  const { addStake, canAddStake } = useAddStake()

  const handleBalanceHeaderLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setBalanceHeaderLayout(event.nativeEvent.layout)
    },
    []
  )

  const header = useMemo(() => <NavigationTitleHeader title={'Stakes'} />, [])

  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: header,
    targetLayout: balanceHeaderLayout,
    hasSeparator: false
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <View
        sx={{
          backgroundColor: theme.colors.$surfacePrimary,
          paddingBottom: 16
        }}>
        <Animated.View
          onLayout={handleBalanceHeaderLayout}
          style={[
            {
              paddingHorizontal: 16,
              marginTop: 24,
              marginBottom: 16,
              backgroundColor: theme.colors.$surfacePrimary
            },
            animatedHeaderStyle
          ]}>
          <Text variant="heading2">Stake</Text>
        </Animated.View>
        <Banner />
      </View>
    )
  }, [
    theme.colors.$surfacePrimary,
    handleBalanceHeaderLayout,
    animatedHeaderStyle
  ])

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
    tab => {
      if (selectedSegmentIndex.value === tab.prevIndex) {
        selectedSegmentIndex.value = tab.index
      }
    },
    [selectedSegmentIndex]
  )

  const handlePressStake = useCallback(
    (txHash: string) => {
      // @ts-ignore TODO: make routes typesafe
      navigate({ pathname: '/stakeDetail', params: { txHash } })
    },
    [navigate]
  )

  const handleClaim = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/claimStakeReward')
  }, [navigate])

  const renderEmptyTabBar = useCallback((): JSX.Element => <></>, [])

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
    const allTab = {
      tabName: StakeHomeScreenTab.All,
      component: (
        <AllStakesScreen
          onPressStake={handlePressStake}
          onAddStake={addStake}
          onClaim={handleClaim}
          motion={motion}
          canAddStake={canAddStake}
          containerStyle={contentContainerStyle}
        />
      )
    }

    if (isEmpty) {
      return [allTab]
    }

    return [
      allTab,
      {
        tabName: StakeHomeScreenTab.Active,
        component: (
          <ActiveStakesScreen
            onPressStake={handlePressStake}
            onAddStake={addStake}
            onClaim={handleClaim}
            motion={motion}
            canAddStake={canAddStake}
            containerStyle={contentContainerStyle}
          />
        )
      },
      {
        tabName: StakeHomeScreenTab.Completed,
        component: (
          <CompletedStakesScreen
            onPressStake={handlePressStake}
            onAddStake={addStake}
            onClaim={handleClaim}
            canAddStake={canAddStake}
            containerStyle={contentContainerStyle}
          />
        )
      }
    ]
  }, [
    handlePressStake,
    addStake,
    handleClaim,
    motion,
    canAddStake,
    contentContainerStyle,
    isEmpty
  ])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState)
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const handleSegmentedControlLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setSegmentedControlLayout(event.nativeEvent.layout)
    },
    []
  )

  if (isLoading) {
    return <LoadingState sx={{ flex: 1 }} />
  }

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
        {isEmpty ? null : (
          <BottomTabWrapper>
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
          </BottomTabWrapper>
        )}
      </View>
    </BlurredBarsContentLayout>
  )
}

enum StakeHomeScreenTab {
  All = 'All',
  Active = 'Active',
  Completed = 'Completed'
}

const SEGMENT_ITEMS = [
  StakeHomeScreenTab.All,
  StakeHomeScreenTab.Active,
  StakeHomeScreenTab.Completed
]

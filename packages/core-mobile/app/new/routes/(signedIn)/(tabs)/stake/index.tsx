import React, { useCallback, useRef, useState, useMemo } from 'react'
import {
  View,
  NavigationTitleHeader,
  useTheme,
  SegmentedControl,
  Text,
  useMotion
} from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  StyleSheet,
  InteractionManager
} from 'react-native'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import {
  CollapsibleTabs,
  CollapsibleTabsRef,
  OnTabChange
} from 'common/components/CollapsibleTabs'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { useRouter } from 'expo-router'
import { useStakes } from 'hooks/earn/useStakes'
import { Banner } from 'features/stake/components/Banner'
import { LoadingState } from 'common/components/LoadingState'
import StakesScreen from 'features/stake/components/StakesScreen'
import { useActiveStakes } from 'hooks/earn/useActiveStakes'
import { usePastStakes } from 'hooks/earn/usePastStakes'

const StakeHomeScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const { data, isLoading } = useStakes()
  const { stakes: activeStakes } = useActiveStakes()
  const { stakes: pastStakes } = usePastStakes()
  const { theme } = useTheme()
  const tabViewRef = useRef<CollapsibleTabsRef>(null)
  const [balanceHeaderLayout, setBalanceHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const selectedSegmentIndex = useSharedValue(0)
  const motion = useMotion()
  const isEmpty = !data || data.length === 0

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
      <View sx={{ backgroundColor: theme.colors.$surfacePrimary }}>
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
  }, [handleBalanceHeaderLayout, animatedHeaderStyle, theme.colors])

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

  const handlePressStake = useCallback(() => {
    navigate('/stake/details')
  }, [navigate])

  const handleAddStake = useCallback(() => {
    navigate('/stake/add')
  }, [navigate])

  const handleClaim = useCallback(() => {
    navigate('/stake/claim')
  }, [navigate])

  const renderEmptyTabBar = useCallback((): JSX.Element => <></>, [])

  const tabs = useMemo(() => {
    const allTab = {
      tabName: StakeHomeScreenTab.All,
      component: (
        <StakesScreen
          stakes={data ?? []}
          onPressStake={handlePressStake}
          onAddStake={handleAddStake}
          onClaim={handleClaim}
          motion={motion}
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
          <StakesScreen
            stakes={activeStakes}
            onPressStake={handlePressStake}
            onAddStake={handleAddStake}
            onClaim={handleClaim}
            motion={motion}
          />
        )
      },
      {
        tabName: StakeHomeScreenTab.Completed,
        component: (
          <StakesScreen
            stakes={pastStakes}
            onPressStake={handlePressStake}
            onAddStake={handleAddStake}
            onClaim={handleClaim}
          />
        )
      }
    ]
  }, [
    activeStakes,
    data,
    pastStakes,
    isEmpty,
    motion,
    handlePressStake,
    handleAddStake,
    handleClaim
  ])

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
      {!isEmpty && (
        <LinearGradientBottomWrapper>
          <SegmentedControl
            dynamicItemWidth={false}
            items={SEGMENT_ITEMS}
            selectedSegmentIndex={selectedSegmentIndex}
            onSelectSegment={handleSelectSegment}
            style={styles.segmentedControl}
          />
        </LinearGradientBottomWrapper>
      )}
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

const styles = StyleSheet.create({
  segmentedControl: { marginHorizontal: 16, marginBottom: 16 }
})

export default StakeHomeScreen

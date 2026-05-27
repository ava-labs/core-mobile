import {
  NavigationTitleHeader,
  SegmentedControl,
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
import { TokenHeader } from 'common/components/TokenHeader'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { ActionButtons } from 'features/portfolio/assets/components/ActionButtons'
import TokenDetail from 'features/portfolio/assets/components/TokenDetail'
import TransactionHistory from 'features/portfolio/assets/components/TransactionHistory'
import { useTokenDetailData } from 'features/portfolio/assets/hooks/useTokenDetailData'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  InteractionManager,
  LayoutChangeEvent,
  LayoutRectangle,
  Platform,
  useWindowDimensions
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LocalTokenWithBalance } from 'store/balance'

export enum TokenDetailTab {
  Assets = 'Assets',
  Activity = 'Activity'
}

const SEGMENT_ITEMS = [
  { title: TokenDetailTab.Assets },
  { title: TokenDetailTab.Activity }
]

type Props = {
  token: LocalTokenWithBalance
}

/**
 * Token detail layout for XP tokens (AVAX X-Chain / P-Chain). Renders the
 * Assets + Activity tabs inside a collapsible header; the in-content
 * `TokenHeader` cross-fades into the nav-bar title as the user scrolls.
 */
export const XpTokenDetailScreen = ({ token }: Props): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const frame = useWindowDimensions()
  const headerHeight = useEffectiveHeaderHeight()
  const insets = useSafeAreaInsets()

  const {
    formattedBalance,
    selectedCurrency,
    isBalanceAccurate,
    isBalanceLoading,
    isPrivacyModeEnabled,
    actionButtons,
    handleExplorerLink,
    activity
  } = useTokenDetailData(token)

  const tabViewRef = useRef<CollapsibleTabsRef>(null)
  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const [titleLayout, setTitleLayout] = useState<LayoutRectangle | undefined>()
  const [segmentedControlLayout, setSegmentedControlLayout] = useState<
    LayoutRectangle | undefined
  >()

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent): void => {
    setHeaderLayout(event.nativeEvent.layout)
  }, [])

  const handleTitleLayout = useCallback((event: LayoutChangeEvent): void => {
    setTitleLayout(event.nativeEvent.layout)
  }, [])

  const handleSegmentedControlLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setSegmentedControlLayout(event.nativeEvent.layout)
    },
    []
  )

  const navigationHeader = useMemo(
    () => <NavigationTitleHeader title={token.name ?? ''} />,
    [token.name]
  )

  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: navigationHeader,
    targetLayout: titleLayout
  })

  const selectedSegmentIndex = useSharedValue(0)

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

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

  const renderEmptyTabBar = useCallback((): JSX.Element => <></>, [])

  const renderHeader = useCallback(
    (): JSX.Element => (
      <View
        style={{
          backgroundColor: colors.$surfacePrimary,
          paddingTop: 8
        }}
        onLayout={handleHeaderLayout}>
        <View onLayout={handleTitleLayout} style={{ paddingHorizontal: 16 }}>
          <Animated.View
            style={[
              { backgroundColor: colors.$surfacePrimary },
              animatedHeaderStyle
            ]}>
            <TokenHeader
              token={token}
              formattedBalance={formattedBalance}
              currency={selectedCurrency}
              errorMessage={
                isBalanceAccurate ? undefined : 'Unable to load all balances'
              }
              isLoading={isBalanceLoading}
              isPrivacyModeEnabled={isPrivacyModeEnabled}
            />
          </Animated.View>
        </View>
        <ActionButtons
          buttons={actionButtons}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 24,
            paddingBottom: 16
          }}
        />
      </View>
    ),
    [
      token,
      colors.$surfacePrimary,
      handleHeaderLayout,
      handleTitleLayout,
      animatedHeaderStyle,
      formattedBalance,
      selectedCurrency,
      isBalanceAccurate,
      isBalanceLoading,
      isPrivacyModeEnabled,
      actionButtons
    ]
  )

  const tabHeight = useMemo(
    () =>
      Platform.select({
        ios: frame.height - headerHeight - insets.bottom - insets.top,
        android: frame.height + (headerLayout?.height ?? 0) - insets.top
      }),
    [
      frame.height,
      headerHeight,
      headerLayout?.height,
      insets.bottom,
      insets.top
    ]
  )

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: insets.bottom + (segmentedControlLayout?.height ?? 0),
      minHeight: tabHeight
    }),
    [insets.bottom, segmentedControlLayout?.height, tabHeight]
  )

  const tabs = useMemo(
    () => [
      {
        tabName: TokenDetailTab.Assets,
        component: <TokenDetail token={token} />
      },
      {
        tabName: TokenDetailTab.Activity,
        component: (
          <TransactionHistory
            token={token}
            handleExplorerLink={handleExplorerLink}
            containerStyle={contentContainerStyle}
            activity={activity}
          />
        )
      }
    ],
    [token, handleExplorerLink, contentContainerStyle, activity]
  )

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
            style={{ marginHorizontal: 16, marginBottom: insets.bottom }}
          />
        </LinearGradientBottomWrapper>
      </View>
      {/*
        Android returns a header height of 0, so we need to display the
        nav-bar background + separator manually.
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

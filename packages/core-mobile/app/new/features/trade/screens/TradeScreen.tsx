import {
  alpha,
  NavigationTitleHeader,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import {
  CollapsibleTabs,
  CollapsibleTabsRef
} from 'common/components/CollapsibleTabs'
import { useBottomTabBarHeight } from 'common/hooks/useBottomTabBarHeight'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LayoutChangeEvent, LayoutRectangle, Platform } from 'react-native'
import type { TabBarProps } from 'react-native-collapsible-tab-view'
import Animated, {
  interpolate,
  useAnimatedStyle
} from 'react-native-reanimated'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'
import { TradeBalance } from '../components/TradeBalance'
import { PerpetualsScreen } from '../perpetuals/screens/PerpetualsScreen'

const BALANCE_ROW_HEIGHT = 60
const BALANCE_ROW_VERTICAL_MARGIN = 28
const MIN_HEADER_HEIGHT = BALANCE_ROW_HEIGHT + BALANCE_ROW_VERTICAL_MARGIN

function renderEmptyTabBar(_props: TabBarProps): JSX.Element {
  return <></>
}

export function TradeScreen(): JSX.Element {
  const { theme } = useTheme()
  const headerHeight = useEffectiveHeaderHeight()
  const tabBarHeight = useBottomTabBarHeight()
  const frame = useSafeAreaFrame()
  const router = useRouter()
  const tabViewRef = useRef<CollapsibleTabsRef>(null)

  const hasViewedPerpsOnboarding = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.PERPETUALS_ONBOARDING)
  )

  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()

  const title = 'Perps'
  const description =
    'Trade perpetual futures long or short with leverage powered by Hyperliquid'

  useEffect(() => {
    AnalyticsService.capture('PerpetualsViewed')
  }, [])

  useEffect(() => {
    if (!hasViewedPerpsOnboarding) {
      router.navigate('/perpetualsOnboarding')
    }
  }, [hasViewedPerpsOnboarding, router])

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout
    setHeaderLayout({ x, y, width, height })
  }, [])

  const header = useMemo(() => <NavigationTitleHeader title={title} />, [])

  const { onScroll, scrollY, targetHiddenProgress } = useFadingHeaderNavigation(
    {
      header,
      hasSeparator: false,
      targetLayout: headerLayout
    }
  )

  const tabHeight = useMemo(
    () => frame.height - headerHeight,
    [frame.height, headerHeight]
  )

  const contentContainerStyle = useMemo(() => {
    return {
      paddingBottom: tabBarHeight + 16,
      minHeight: tabHeight
    }
  }, [tabBarHeight, tabHeight])

  const tabs = useMemo(
    () => [
      {
        tabName: 'Perps',
        component: <PerpetualsScreen containerStyle={contentContainerStyle} />
      }
    ],
    [contentContainerStyle]
  )

  const animatedGradientStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 110], [0, 1])
    return {
      opacity
    }
  })

  const renderHeader = useCallback(
    (): JSX.Element => (
      <View
        style={{
          paddingTop: 14,
          paddingBottom: 16
        }}
        onLayout={handleHeaderLayout}>
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          <Text variant="heading2">{title}</Text>
          <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
            {description}
          </Text>
        </View>
        <View>
          <Animated.View
            style={[
              animatedGradientStyle,
              {
                height: 110,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0
              }
            ]}>
            <LinearGradient
              colors={[
                theme.colors.$surfacePrimary,
                alpha(theme.colors.$surfacePrimary, 0)
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 0, y: 1 }}
              style={{
                flex: 1
              }}
            />
          </Animated.View>

          <View
            style={{
              marginTop: 14,
              marginHorizontal: 16
            }}>
            <TradeBalance
              balance={10250000.23}
              onBalancePress={() => router.navigate('/perpetualsBalance')}
            />
          </View>
        </View>
      </View>
    ),
    [
      handleHeaderLayout,
      title,
      description,
      animatedGradientStyle,
      theme.colors.$surfacePrimary,
      router
    ]
  )

  return (
    <BlurredBarsContentLayout>
      <CollapsibleTabs.Container
        ref={tabViewRef}
        renderTabBar={renderEmptyTabBar}
        tabs={tabs}
        onScrollY={onScroll}
        renderHeader={renderHeader}
        minHeaderHeight={MIN_HEADER_HEIGHT}
      />
      {/* 
        This is a workaround to display the header background + separator on Android.
        Android returns a header height of 0, so we need to display the background + separator manually.
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

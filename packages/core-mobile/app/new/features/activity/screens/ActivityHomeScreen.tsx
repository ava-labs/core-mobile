import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import {
  NavigationTitleHeader,
  SearchBar,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import {
  CollapsibleTabs,
  CollapsibleTabsRef,
  OnTabChange
} from 'common/components/CollapsibleTabs'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import useInAppBrowser from 'common/hooks/useInAppBrowser'
import { getSourceChainId } from 'common/utils/bridgeUtils'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { LayoutChangeEvent, LayoutRectangle, Platform } from 'react-native'
import {
  AndroidSoftInputModes,
  KeyboardController
} from 'react-native-keyboard-controller'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import {
  useSafeAreaFrame,
  useSafeAreaInsets
} from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { ActivityScreen } from './ActivityScreen'

const ActivityHomeScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const frame = useSafeAreaFrame()

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const [searchText, setSearchText] = useState('')
  const [isSearchBarFocused, setSearchBarFocused] = useState(false)
  const tabViewRef = useRef<CollapsibleTabsRef>(null)

  const [stickyHeaderLayout, setStickyHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()

  const [balanceHeaderLayout, setBalanceHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()

  const [searchBarLayout, setSearchBarLayout] = useState<
    LayoutRectangle | undefined
  >()

  const selectedSegmentIndex = useSharedValue(0)

  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: <NavigationTitleHeader title={'Activity'} />,
    targetLayout: balanceHeaderLayout,
    hasSeparator: false
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const animatedSearchbarStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      targetHiddenProgress.value,
      [0, 1],
      [0, 0],
      'clamp'
    )

    return {
      transform: [{ translateY }]
    }
  })

  const animatedSeparatorStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      targetHiddenProgress.value,
      [0, 1],
      [0, 0],
      'clamp'
    )
    const opacity = interpolate(
      targetHiddenProgress.value,
      [0, 1],
      [0, 1],
      'clamp'
    )
    return {
      transform: [{ translateY }],
      opacity
    }
  })

  const handleScrollResync = useCallback(() => {
    tabViewRef.current?.scrollResync()
  }, [])

  const onSearchTextChanged = useCallback(
    (text: string) => {
      setSearchText(text)
      handleScrollResync()
    },
    [handleScrollResync]
  )

  const handleStickyHeaderLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setStickyHeaderLayout(event.nativeEvent.layout)
    },
    []
  )

  const handleBalanceHeaderLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setBalanceHeaderLayout(event.nativeEvent.layout)
    },
    []
  )

  const handleTabChange: OnTabChange = useCallback(
    data => {
      if (selectedSegmentIndex.value === data.prevIndex) {
        selectedSegmentIndex.value = data.index
      }
    },
    [selectedSegmentIndex]
  )

  const handlePendingBridge = useCallback(
    (pendingBridge: BridgeTransaction | BridgeTransfer): void => {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/bridgeStatus',
        params: {
          txHash: pendingBridge.sourceTxHash,
          chainId: getSourceChainId(pendingBridge, isDeveloperMode)
        }
      })
    },
    [navigate, isDeveloperMode]
  )

  const { openUrl } = useInAppBrowser()

  const handleExplorerLink = useCallback(
    (explorerLink: string): void => {
      AnalyticsService.capture('ExplorerLinkClicked')
      openUrl(explorerLink)
    },
    [openUrl]
  )

  useFocusEffect(
    useCallback(() => {
      handleScrollResync()
    }, [handleScrollResync])
  )

  const handleSearchBarLayout = useCallback((event: LayoutChangeEvent) => {
    setSearchBarLayout(event.nativeEvent.layout)
  }, [])

  const tabHeight = useMemo(() => {
    return Platform.select({
      ios: frame.height - (stickyHeaderLayout?.height ?? 0) - insets.top + 10,
      android: frame.height - insets.top
    })
  }, [frame.height, insets.top, stickyHeaderLayout?.height])

  const contentContainerStyle = useMemo(() => {
    return {
      paddingBottom: 16,
      paddingTop: 10,
      minHeight: tabHeight
    }
  }, [tabHeight])

  const renderEmptyTabBar = useCallback((): JSX.Element => <></>, [])

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <View
        style={{ backgroundColor: theme.colors.$surfacePrimary }}
        onLayout={handleStickyHeaderLayout}>
        <Animated.View style={[animatedHeaderStyle]}>
          <View
            onLayout={handleBalanceHeaderLayout}
            style={{
              paddingHorizontal: 16,
              marginTop: 16,
              backgroundColor: theme.colors.$surfacePrimary
            }}>
            <Text variant="heading2">Activity</Text>
          </View>
        </Animated.View>
        <View>
          <Animated.View
            onLayout={handleSearchBarLayout}
            style={[
              animatedSearchbarStyle,
              {
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: theme.colors.$surfacePrimary
              }
            ]}>
            <SearchBar
              setSearchBarFocused={setSearchBarFocused}
              onTextChanged={onSearchTextChanged}
              searchText={searchText}
              placeholder="Search"
            />
          </Animated.View>
          <Animated.View
            style={[
              { height: 1, backgroundColor: theme.colors.$surfaceSecondary },
              animatedSeparatorStyle
            ]}
          />
        </View>
      </View>
    )
  }, [
    theme.colors.$surfacePrimary,
    theme.colors.$surfaceSecondary,
    handleStickyHeaderLayout,
    animatedHeaderStyle,
    handleBalanceHeaderLayout,
    handleSearchBarLayout,
    animatedSearchbarStyle,
    onSearchTextChanged,
    searchText,
    animatedSeparatorStyle
  ])

  const tabs = useMemo(() => {
    return [
      {
        tabName: ActivityTab.Activity,
        component: (
          <ActivityScreen
            isSearchBarFocused={isSearchBarFocused}
            searchText={searchText}
            handleExplorerLink={handleExplorerLink}
            handlePendingBridge={handlePendingBridge}
            containerStyle={contentContainerStyle}
          />
        )
      }
    ]
  }, [
    contentContainerStyle,
    handleExplorerLink,
    handlePendingBridge,
    searchText,
    isSearchBarFocused
  ])

  useFocusEffect(() => {
    if (!KeyboardController.isVisible()) {
      KeyboardController.setInputMode(
        AndroidSoftInputModes.SOFT_INPUT_ADJUST_NOTHING
      )
    }
    return () => {
      if (!KeyboardController.isVisible()) {
        KeyboardController.setDefaultMode()
      }
    }
  })

  return (
    <BlurredBarsContentLayout>
      <CollapsibleTabs.Container
        ref={tabViewRef}
        renderHeader={renderHeader}
        renderTabBar={renderEmptyTabBar}
        onTabChange={handleTabChange}
        onScrollY={onScroll}
        tabs={tabs}
        minHeaderHeight={searchBarLayout?.height ?? 0}
      />
    </BlurredBarsContentLayout>
  )
}

export enum ActivityTab {
  Activity = 'Activity'
}

export default ActivityHomeScreen

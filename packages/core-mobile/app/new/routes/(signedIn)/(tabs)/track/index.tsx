import {
  NavigationTitleHeader,
  SCREEN_HEIGHT,
  SearchBar,
  SegmentedControl,
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
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { useBottomTabBarHeight } from 'common/hooks/useBottomTabBarHeight'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { useIsAndroidWithBottomBar } from 'common/hooks/useIsAndroidWithBottomBar'
import { useFocusEffect, useRouter } from 'expo-router'
import FavoriteScreen from 'features/track/market/components/FavoriteScreen'
import MarketScreen from 'features/track/market/components/MarketScreen'
import SearchResultScreen from 'features/track/market/components/SearchResultScreen'
import { TrendingScreen } from 'features/track/trending/components/TrendingScreen'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  InteractionManager,
  LayoutChangeEvent,
  LayoutRectangle,
  Platform,
  StyleSheet
} from 'react-native'
import {
  AndroidSoftInputModes,
  KeyboardController
} from 'react-native-keyboard-controller'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MarketType } from 'store/watchlist/types'

const SEARCH_BAR_MARGIN_TOP = Platform.OS === 'ios' ? 60 : 55

const TrackHomeScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const { theme } = useTheme()
  const [isSearchBarFocused, setSearchBarFocused] = useState(false)
  const [searchText, setSearchText] = useState('')
  const tabViewRef = useRef<CollapsibleTabsRef>(null)
  const [balanceHeaderLayout, setBalanceHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const selectedSegmentIndex = useSharedValue(0)

  const handleBalanceHeaderLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setBalanceHeaderLayout(event.nativeEvent.layout)
    },
    []
  )

  const showSearchResults = isSearchBarFocused || searchText.length > 0

  const header = useMemo(() => <NavigationTitleHeader title={'Track'} />, [])

  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: header,
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
      [0, SEARCH_BAR_MARGIN_TOP],
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
      [0, SEARCH_BAR_MARGIN_TOP],
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

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <View style={{ backgroundColor: theme.colors.$surfacePrimary }}>
        <Animated.View style={[animatedHeaderStyle]}>
          <View
            onLayout={handleBalanceHeaderLayout}
            style={{
              paddingHorizontal: 16,
              marginTop: 16,
              backgroundColor: theme.colors.$surfacePrimary
            }}>
            <Text variant="heading2">Track</Text>
          </View>
        </Animated.View>
        <Animated.View
          style={[
            animatedSearchbarStyle,
            {
              paddingHorizontal: 16,
              paddingVertical: 16,
              backgroundColor: theme.colors.$surfacePrimary
            }
          ]}>
          <SearchBar
            setSearchBarFocused={setSearchBarFocused}
            onTextChanged={setSearchText}
            searchText={searchText}
            placeholder="Search"
            useDebounce={true}
            useCancel
          />
        </Animated.View>
        <Animated.View
          style={[
            { height: 1, backgroundColor: theme.colors.$surfaceSecondary },
            animatedSeparatorStyle
          ]}
        />
      </View>
    )
  }, [
    handleBalanceHeaderLayout,
    animatedHeaderStyle,
    animatedSearchbarStyle,
    animatedSeparatorStyle,
    setSearchBarFocused,
    setSearchText,
    searchText,
    theme.colors.$surfacePrimary,
    theme.colors.$surfaceSecondary
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
    data => {
      if (selectedSegmentIndex.value === data.prevIndex) {
        selectedSegmentIndex.value = data.index
      }
    },
    [selectedSegmentIndex]
  )

  const handleGotoMarketDetail = useCallback(
    (tokenId: string, marketType: MarketType): void => {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/trackTokenDetail',
        params: { tokenId, marketType }
      })
    },
    [navigate]
  )

  const renderEmptyTabBar = useCallback((): JSX.Element => <></>, [])

  const renderSearchResults = useCallback(() => {
    return (
      <SearchResultScreen
        isSearchBarFocused={isSearchBarFocused}
        searchText={searchText}
        goToMarketDetail={handleGotoMarketDetail}
      />
    )
  }, [handleGotoMarketDetail, isSearchBarFocused, searchText])

  const handleScrollResync = useCallback(() => {
    tabViewRef.current?.scrollResync()
  }, [])

  useFocusEffect(
    useCallback(() => {
      handleScrollResync()
    }, [handleScrollResync])
  )

  useEffect(() => {
    handleScrollResync()
  }, [showSearchResults, handleScrollResync])

  const insets = useSafeAreaInsets()
  const isAndroidWithBottomBar = useIsAndroidWithBottomBar()
  const tabBarHeight = useBottomTabBarHeight()

  const tabHeight = useMemo(() => {
    return Platform.select({
      ios:
        SCREEN_HEIGHT -
        insets.top -
        (balanceHeaderLayout?.height ?? 0) -
        tabBarHeight -
        11,
      android: SCREEN_HEIGHT - insets.top + (isAndroidWithBottomBar ? -11 : 11)
    })
  }, [
    balanceHeaderLayout?.height,
    insets.top,
    isAndroidWithBottomBar,
    tabBarHeight
  ])

  const contentContainerStyle = useMemo(() => {
    return {
      paddingBottom: 16,
      minHeight: tabHeight
    }
  }, [tabHeight])

  const tabs = useMemo(() => {
    return [
      {
        tabName: TrackHomeScreenTab.Trending,
        component:
          showSearchResults && selectedSegmentIndex.get() === 0 ? (
            renderSearchResults()
          ) : (
            <TrendingScreen
              goToMarketDetail={handleGotoMarketDetail}
              containerStyle={contentContainerStyle}
            />
          )
      },
      {
        tabName: TrackHomeScreenTab.Favorites,
        component:
          showSearchResults && selectedSegmentIndex.get() === 1 ? (
            renderSearchResults()
          ) : (
            <FavoriteScreen
              goToMarketDetail={handleGotoMarketDetail}
              containerStyle={contentContainerStyle}
            />
          )
      },
      {
        tabName: TrackHomeScreenTab.Market,
        component:
          showSearchResults && selectedSegmentIndex.get() === 2 ? (
            renderSearchResults()
          ) : (
            <MarketScreen
              goToMarketDetail={handleGotoMarketDetail}
              containerStyle={contentContainerStyle}
            />
          )
      }
    ]
  }, [
    contentContainerStyle,
    handleGotoMarketDetail,
    renderSearchResults,
    selectedSegmentIndex,
    showSearchResults
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
      />
      {!showSearchResults && (
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

enum TrackHomeScreenTab {
  Trending = 'Trending',
  Favorites = 'Favorites',
  Market = 'Market'
}

const SEGMENT_ITEMS = [
  TrackHomeScreenTab.Trending,
  TrackHomeScreenTab.Favorites,
  TrackHomeScreenTab.Market
]

const styles = StyleSheet.create({
  segmentedControl: { marginHorizontal: 16, marginBottom: 16 }
})

export default TrackHomeScreen

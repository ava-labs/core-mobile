import {
  NavigationTitleHeader,
  SearchBar,
  SegmentedControl,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { BottomTabWrapper } from 'common/components/BlurredBottomWrapper'
import {
  CollapsibleTabs,
  CollapsibleTabsRef,
  OnTabChange
} from 'common/components/CollapsibleTabs'

import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { useFocusEffect, useRouter } from 'expo-router'
import FavoriteScreen from 'features/track/market/components/FavoriteScreen'
import MarketScreen from 'features/track/market/components/MarketScreen'
import SearchResultScreen from 'features/track/market/components/SearchResultScreen'
import { TrendingScreen } from 'features/track/trending/components/TrendingScreen'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  InteractionManager,
  LayoutChangeEvent,
  LayoutRectangle,
  Platform
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
import {
  useSafeAreaFrame,
  useSafeAreaInsets
} from 'react-native-safe-area-context'
import { MarketType } from 'store/watchlist'

const TrackHomeScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const frame = useSafeAreaFrame()

  const [isSearchBarFocused, setSearchBarFocused] = useState(false)
  const [searchText, setSearchText] = useState('')
  const tabViewRef = useRef<CollapsibleTabsRef>(null)

  const [stickyHeaderLayout, setStickyHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const [balanceHeaderLayout, setBalanceHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()

  const [segmentedControlLayout, setSegmentedControlLayout] = useState<
    LayoutRectangle | undefined
  >()

  const [searchBarLayout, setSearchBarLayout] = useState<
    LayoutRectangle | undefined
  >()

  const selectedSegmentIndex = useSharedValue(0)

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

  useFocusEffect(
    useCallback(() => {
      handleScrollResync()
    }, [handleScrollResync])
  )

  const handleSearchBarLayout = useCallback((event: LayoutChangeEvent) => {
    setSearchBarLayout(event.nativeEvent.layout)
  }, [])

  const handleSegmentedControlLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setSegmentedControlLayout(event.nativeEvent.layout)
    },
    []
  )

  const tabHeight = useMemo(() => {
    return Platform.select({
      ios: frame.height - (stickyHeaderLayout?.height ?? 0) - insets.top + 10,
      android: frame.height - insets.top - 4
    })
  }, [frame.height, insets.top, stickyHeaderLayout?.height])

  const contentContainerStyle = useMemo(() => {
    return {
      paddingBottom: (segmentedControlLayout?.height ?? 0) + 16,
      paddingTop: 10,
      minHeight: tabHeight
    }
  }, [segmentedControlLayout?.height, tabHeight])

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
            <Text variant="heading2">Track</Text>
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

  const renderSearchResults = useCallback(() => {
    const containerStyle = {
      ...contentContainerStyle,
      minHeight: (tabHeight ?? 0) + (segmentedControlLayout?.height ?? 0)
    }
    return (
      <SearchResultScreen
        isSearchBarFocused={isSearchBarFocused}
        searchText={searchText}
        goToMarketDetail={handleGotoMarketDetail}
        handleScrollResync={handleScrollResync}
        containerStyle={containerStyle}
      />
    )
  }, [
    contentContainerStyle,
    handleGotoMarketDetail,
    handleScrollResync,
    isSearchBarFocused,
    searchText,
    segmentedControlLayout?.height,
    tabHeight
  ])

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
              onScrollResync={handleScrollResync}
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
              onScrollResync={handleScrollResync}
            />
          )
      }
    ]
  }, [
    contentContainerStyle,
    handleGotoMarketDetail,
    handleScrollResync,
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
        minHeaderHeight={searchBarLayout?.height ?? 0}
      />
      {!showSearchResults && (
        <View
          onLayout={handleSegmentedControlLayout}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0
          }}>
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
        </View>
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

export default TrackHomeScreen

import React, { useCallback, useRef, useState, useMemo } from 'react'
import {
  View,
  NavigationTitleHeader,
  useTheme,
  SegmentedControl,
  Text,
  SearchBar
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
  interpolate,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import {
  CollapsibleTabs,
  CollapsibleTabsRef,
  OnTabChange
} from 'common/components/CollapsibleTabs'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { TrendingScreen } from 'features/track/trending/components/TrendingScreen'
import MarketScreen from 'features/track/market/components/MarketScreen'
import { useRouter } from 'expo-router'
import FavoriteScreen from 'features/track/market/components/FavoriteScreen'
import SearchResultScreen from 'features/track/market/components/SearchResultScreen'
import { Platform } from 'react-native'

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
        <View onLayout={handleBalanceHeaderLayout}>
          <Animated.View
            style={[
              {
                paddingHorizontal: 16,
                marginTop: Platform.OS === 'ios' ? 24 : 8,
                backgroundColor: theme.colors.$surfacePrimary
              },
              animatedHeaderStyle
            ]}>
            <Text variant="heading2">Track</Text>
          </Animated.View>
        </View>
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
    (tokenId: string): void => {
      navigate({
        pathname: '/trackTokenDetail',
        params: { tokenId }
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

  const tabs = useMemo(() => {
    return [
      {
        tabName: TrackHomeScreenTab.Trending,
        component:
          showSearchResults && selectedSegmentIndex.get() === 0 ? (
            renderSearchResults()
          ) : (
            <TrendingScreen />
          )
      },
      {
        tabName: TrackHomeScreenTab.Favorites,
        component:
          showSearchResults && selectedSegmentIndex.get() === 1 ? (
            renderSearchResults()
          ) : (
            <FavoriteScreen goToMarketDetail={handleGotoMarketDetail} />
          )
      },
      {
        tabName: TrackHomeScreenTab.Market,
        component:
          showSearchResults && selectedSegmentIndex.get() === 2 ? (
            renderSearchResults()
          ) : (
            <MarketScreen goToMarketDetail={handleGotoMarketDetail} />
          )
      }
    ]
  }, [
    handleGotoMarketDetail,
    renderSearchResults,
    selectedSegmentIndex,
    showSearchResults
  ])

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

import React, { useCallback, useRef, useState } from 'react'
import {
  View,
  NavigationTitleHeader,
  useTheme,
  SegmentedControl,
  Text,
  SearchBar
} from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import Animated, {
  interpolate,
  useAnimatedStyle
} from 'react-native-reanimated'
import {
  CollapsibleTabs,
  CollapsibleTabsRef
} from 'common/components/CollapsibleTabs'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { TrendingScreen } from 'features/track/trending/components/TrendingScreen'
import MarketScreen from 'features/track/market/components/MarketScreen'
import { useRouter } from 'expo-router'
import FavoriteScreen from 'features/track/market/components/FavoriteScreen'
import SearchResultScreen from 'features/track/market/components/SearchResultScreen'

const TrackHomeScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const { theme } = useTheme()
  const [isSearchBarFocused, setSearchBarFocused] = useState(false)
  const [searchText, setSearchText] = useState('')
  const tabViewRef = useRef<CollapsibleTabsRef>(null)
  const [balanceHeaderLayout, setBalanceHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(0)
  const handleBalanceHeaderLayout = (event: LayoutChangeEvent): void => {
    setBalanceHeaderLayout(event.nativeEvent.layout)
  }

  const showSearchResults = isSearchBarFocused || searchText.length > 0

  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: <NavigationTitleHeader title={'Track'} />,
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
      [0, 60],
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
      [0, 60],
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

  const renderHeader = (): JSX.Element => {
    return (
      <View style={{ backgroundColor: theme.colors.$surfacePrimary }}>
        <View onLayout={handleBalanceHeaderLayout}>
          <Animated.View
            style={[
              {
                paddingHorizontal: 16,
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
              paddingTop: 16,
              paddingBottom: 8,
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
  }

  const handleSelectSegment = useCallback(
    (index: number): void => {
      if (index !== selectedSegmentIndex) {
        tabViewRef.current?.setIndex(index)
      }
    },
    [selectedSegmentIndex]
  )

  const handleChangeTab = (index: number): void => {
    setSelectedSegmentIndex(index)
  }

  const handleGotoMarketDetail = useCallback(
    (tokenId: string): void => {
      navigate({
        pathname: '/trackTokenDetail',
        params: { tokenId }
      })
    },
    [navigate]
  )

  const renderEmptyTabBar = (): JSX.Element => <></>

  const renderSearchResults = useCallback(() => {
    return (
      <SearchResultScreen
        isSearchBarFocused={isSearchBarFocused}
        searchText={searchText}
        goToMarketDetail={handleGotoMarketDetail}
      />
    )
  }, [handleGotoMarketDetail, isSearchBarFocused, searchText])

  const renderTabs = useCallback(() => {
    return [
      {
        tabName: TrackHomeScreenTab.Trending,
        component:
          showSearchResults && selectedSegmentIndex === 0 ? (
            renderSearchResults()
          ) : (
            <TrendingScreen />
          )
      },
      {
        tabName: TrackHomeScreenTab.Favorites,
        component:
          showSearchResults && selectedSegmentIndex === 1 ? (
            renderSearchResults()
          ) : (
            <FavoriteScreen goToMarketDetail={handleGotoMarketDetail} />
          )
      },
      {
        tabName: TrackHomeScreenTab.Market,
        component:
          showSearchResults && selectedSegmentIndex === 2 ? (
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
      <>
        <CollapsibleTabs.Container
          ref={tabViewRef}
          renderHeader={renderHeader}
          renderTabBar={renderEmptyTabBar}
          onIndexChange={handleChangeTab}
          onScroll={onScroll}
          tabs={renderTabs()}
        />
        {!showSearchResults && (
          <LinearGradientBottomWrapper>
            <SegmentedControl
              dynamicItemWidth={true}
              items={[
                TrackHomeScreenTab.Trending,
                TrackHomeScreenTab.Favorites,
                TrackHomeScreenTab.Market
              ]}
              selectedSegmentIndex={selectedSegmentIndex}
              onSelectSegment={handleSelectSegment}
              style={{ marginHorizontal: 16, marginBottom: 16 }}
            />
          </LinearGradientBottomWrapper>
        )}
      </>
    </BlurredBarsContentLayout>
  )
}

enum TrackHomeScreenTab {
  Trending = 'Trending',
  Favorites = 'Favorites',
  Market = 'Market'
}

export default TrackHomeScreen

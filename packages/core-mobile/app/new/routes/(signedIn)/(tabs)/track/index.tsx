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
import { LayoutChangeEvent, LayoutRectangle, TextInput } from 'react-native'
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

const TrackHomeScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const { theme } = useTheme()
  const searchBarRef = useRef<TextInput>(null)
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
      [0, 50],
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
      [0, 50],
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
            ref={searchBarRef}
            setSearchBarFocused={setSearchBarFocused}
            onTextChanged={setSearchText}
            searchText={searchText}
            placeholder="Search"
            useDebounce={true}
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

  const handleSelectSegment = (index: number): void => {
    if (index !== selectedSegmentIndex) {
      tabViewRef.current?.setIndex(index)
    }
  }

  const handleChangeTab = (index: number): void => {
    setSearchText('')
    searchBarRef.current?.clear()
    searchBarRef.current?.blur()
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

  return (
    <BlurredBarsContentLayout>
      <CollapsibleTabs.Container
        ref={tabViewRef}
        renderHeader={renderHeader}
        renderTabBar={renderEmptyTabBar}
        onIndexChange={handleChangeTab}
        onScroll={onScroll}
        tabs={[
          {
            tabName: TrackHomeScreenTab.Trending,
            component: <TrendingScreen />
          },
          {
            tabName: TrackHomeScreenTab.Favorites,
            component: (
              <FavoriteScreen
                searchText={searchText}
                goToMarketDetail={handleGotoMarketDetail}
              />
            )
          },
          {
            tabName: TrackHomeScreenTab.Market,
            component: (
              <MarketScreen
                isSearchBarFocused={isSearchBarFocused}
                searchText={searchText}
                goToMarketDetail={handleGotoMarketDetail}
              />
            )
          }
        ]}
      />
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
    </BlurredBarsContentLayout>
  )
}

export enum TrackHomeScreenTab {
  Trending = 'Trending',
  Favorites = 'Favorites',
  Market = 'Market'
}

export default TrackHomeScreen

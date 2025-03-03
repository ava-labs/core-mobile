import React, { useCallback, useRef, useState } from 'react'
import {
  View,
  NavigationTitleHeader,
  useTheme,
  SegmentedControl,
  Text,
  SearchBar,
  Image
} from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { Dimensions, LayoutChangeEvent, LayoutRectangle } from 'react-native'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import {
  CollapsibleTabs,
  CollapsibleTabsRef
} from 'common/components/CollapsibleTabs'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { TrendingScreen } from 'features/track/trending/components/TrendingScreen'
import MarketScreen from 'features/track/market/components/MarketScreen'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { ErrorState } from 'common/components/ErrorState'

const TrackHomeScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const {
    favorites,
    topTokens,
    refetchTopTokens,
    isRefetchingTopTokens,
    isLoadingTopTokens
  } = useWatchlist()
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
    targetLayout: balanceHeaderLayout
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const renderHeader = (): JSX.Element => {
    return (
      <View
        style={{ backgroundColor: theme.colors.$surfacePrimary, padding: 16 }}>
        <View onLayout={handleBalanceHeaderLayout}>
          <Animated.View
            style={[
              {
                paddingBottom: 16,
                backgroundColor: theme.colors.$surfacePrimary
              },
              animatedHeaderStyle
            ]}>
            <Text variant="heading2">Track</Text>
          </Animated.View>
        </View>
        <SearchBar
          onTextChanged={setSearchText}
          searchText={searchText}
          placeholder="Search"
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
    setSelectedSegmentIndex(index)
  }

  const handleGotoMarketDetail = useCallback((): void => {
    // TODO: navigate to market detail
  }, [])

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
              <MarketScreen
                tokens={favorites}
                isRefetchingTopTokens={isRefetchingTopTokens}
                isLoadingTopTokens={isLoadingTopTokens}
                goToMarketDetail={handleGotoMarketDetail}
                searchText={searchText}
                errorState={
                  <ErrorState
                    sx={{ height: portfolioTabContentHeight }}
                    icon={
                      <Image
                        source={require('../../../../assets/icons/star_struck_emoji.png')}
                        sx={{ width: 42, height: 42 }}
                      />
                    }
                    title="No favorite tokens"
                    description="Star any token to add it to this screen"
                  />
                }
              />
            )
          },
          {
            tabName: TrackHomeScreenTab.Market,
            component: (
              <MarketScreen
                tokens={topTokens}
                isRefetchingTopTokens={isRefetchingTopTokens}
                isLoadingTopTokens={isLoadingTopTokens}
                goToMarketDetail={handleGotoMarketDetail}
                searchText={searchText}
                errorState={
                  <ErrorState
                    sx={{ height: portfolioTabContentHeight }}
                    button={{
                      title: 'Refresh',
                      onPress: refetchTopTokens
                    }}
                  />
                }
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

const portfolioTabContentHeight = Dimensions.get('window').height / 2

export default TrackHomeScreen

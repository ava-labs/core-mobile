import React, { FC, useEffect } from 'react'
import {
  FlatList,
  ListRenderItemInfo,
  StyleProp,
  StyleSheet,
  View
} from 'react-native'
import Avatar from 'components/Avatar'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { PortfolioScreenProps } from 'navigation/types'
import { useDispatch } from 'react-redux'
import { MarketToken, fetchWatchlist } from 'store/watchlist'
import { Text, useTheme } from '@avalabs/k2-mobile'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { PortfolioFavoritesLoader } from 'screens/portfolio/home/components/Loaders/PortfolioFavoritesLoader'
import PriceChangeIndicator from './PriceChangeIndicator'

interface Props {
  style?: StyleProp<View>
}

type NavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

const WatchlistCarousel: FC<Props> = () => {
  const {
    theme: { colors }
  } = useTheme()
  const { favorites: watchlistFavorites, isLoadingFavorites } = useWatchlist()
  const navigation = useNavigation<NavigationProp>()
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchWatchlist())
  }, [dispatch])

  const renderItem = (item: ListRenderItemInfo<MarketToken>): JSX.Element => {
    const token = item.item
    return (
      <CarouselItem
        testID={`watchlist_carousel__${token.symbol}`}
        token={token}
        onPress={() => {
          navigation.navigate(AppNavigation.Wallet.TokenDetail, {
            tokenId: token.id
          })
        }}
      />
    )
  }

  const goToWatchList = (): void => {
    navigation.navigate(AppNavigation.Tabs.Watchlist)
  }

  if (isLoadingFavorites) {
    return <PortfolioFavoritesLoader />
  }

  if (watchlistFavorites.length === 0) {
    return null
  }

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
        <Text variant="heading6" testID="favorites">
          Favorites
        </Text>
        <AvaButton.TextLink
          testID="viewAll"
          style={{ paddingRight: -16 }}
          textColor={colors.$blueMain}
          onPress={goToWatchList}>
          View All
        </AvaButton.TextLink>
      </View>
      <FlatList
        data={watchlistFavorites}
        renderItem={renderItem}
        horizontal
        bounces
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={Separator}
      />
    </View>
  )
}

const Separator = (): JSX.Element => <View style={{ margin: 4 }} />

interface CarouselItemProps {
  token: MarketToken
  onPress: () => void
  testID: string
}

const CarouselItem: FC<CarouselItemProps> = ({ token, onPress, testID }) => {
  const { theme } = useTheme()

  return (
    <AvaButton.Base
      key={token.id}
      onPress={onPress}
      style={[style.item, { backgroundColor: theme.colors.$neutral900 }]}>
      <Avatar.Token
        name={token.name}
        symbol={token.symbol}
        logoUri={token.logoUri}
        size={24}
      />
      <Space y={4} />
      <Text variant="buttonSmall" testID={testID}>
        {token?.symbol?.toUpperCase()}
      </Text>
      <Space y={8} />
      <PriceChangeIndicator
        price={token?.currentPrice ?? 0}
        percent={token?.priceChangePercentage24h ?? 0}
        isHorizontal={false}
      />
    </AvaButton.Base>
  )
}

const style = StyleSheet.create({
  item: {
    width: 72,
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 8
  }
})

export default WatchlistCarousel

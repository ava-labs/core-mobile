import React, { FC, useEffect, useMemo } from 'react'
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
import AddSVG from 'components/svg/AddSVG'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { PortfolioScreenProps } from 'navigation/types'
import { useDispatch } from 'react-redux'
import { MarketToken, fetchWatchlist } from 'store/watchlist'
import { Text, useTheme } from '@avalabs/k2-mobile'
import { useWatchlist } from 'hooks/useWatchlist'
import PriceChangeIndicator from './PriceChangeIndicator'

interface Props {
  style?: StyleProp<View>
}

type NavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

const WatchlistCarousel: FC<Props> = () => {
  const { theme } = useTheme()
  const { favorites: watchlistFavorites } = useWatchlist()
  const navigation = useNavigation<NavigationProp>()
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchWatchlist())
  }, [dispatch])

  function goToWatchlist(): void {
    navigation.navigate(AppNavigation.Tabs.Watchlist)
  }

  const EmptyItem = useMemo(
    () => (
      <AvaButton.Base
        onPress={goToWatchlist}
        style={[style.item, { backgroundColor: theme.colors.$neutral900 }]}>
        <Space y={14} />
        <AddSVG circleColor={'white'} size={24} />
        <Space y={4} />
        <Text
          variant="buttonSmall"
          sx={{
            textAlign: 'center',
            paddingVertical: 8
          }}>
          Add to Watchlist
        </Text>
        <Space y={16} />
      </AvaButton.Base>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const renderItem = (item: ListRenderItemInfo<MarketToken>): JSX.Element => {
    const token = item.item
    return (
      <CarouselItem
        token={token}
        onPress={() => {
          navigation.navigate(AppNavigation.Wallet.TokenDetail, {
            tokenId: token.id
          })
        }}
      />
    )
  }

  return (
    <View>
      <FlatList
        data={watchlistFavorites}
        renderItem={renderItem}
        horizontal
        bounces
        ListEmptyComponent={EmptyItem}
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
}

const CarouselItem: FC<CarouselItemProps> = ({ token, onPress }) => {
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
      <Text variant="buttonSmall">{token?.symbol?.toUpperCase()}</Text>
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

import React, { FC, useMemo } from 'react'
import {
  FlatList,
  ListRenderItemInfo,
  StyleProp,
  StyleSheet,
  View
} from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Avatar from 'components/Avatar'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import AddSVG from 'components/svg/AddSVG'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import MarketMovement from 'screens/watchlist/components/MarketMovement'
import { Opacity85 } from 'resources/Constants'
import { PortfolioScreenProps } from 'navigation/types'
import { useSelector } from 'react-redux'
import {
  MarketToken,
  selectWatchlistChart,
  selectWatchlistFavorites
} from 'store/watchlist'

interface Props {
  style?: StyleProp<View>
}

type NavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

const WatchlistCarrousel: FC<Props> = () => {
  const { theme } = useApplicationContext()
  const watchlistFavorites = useSelector(selectWatchlistFavorites)
  const navigation = useNavigation<NavigationProp>()

  function goToWatchlist() {
    navigation.navigate(AppNavigation.Tabs.Watchlist)
  }

  const EmptyItem = useMemo(
    () => (
      <AvaButton.Base
        onPress={goToWatchlist}
        style={[style.item, { backgroundColor: theme.colorBg2 + Opacity85 }]}>
        <Space y={14} />
        <AddSVG circleColor={'white'} size={24} />
        <Space y={4} />
        <AvaText.ButtonSmall
          textStyle={{
            color: theme.colorText1,
            textAlign: 'center',
            paddingVertical: 8
          }}>
          Add to Watchlist
        </AvaText.ButtonSmall>
        <Space y={16} />
      </AvaButton.Base>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const renderItem = (item: ListRenderItemInfo<MarketToken>) => {
    const token = item.item
    return (
      <CarrouselItem
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

const Separator = () => <View style={{ margin: 4 }} />

interface CarrouselItemProps {
  token: MarketToken
  onPress: () => void
}

const CarrouselItem: FC<CarrouselItemProps> = ({ token, onPress }) => {
  const { theme } = useApplicationContext()
  const chartData = useSelector(selectWatchlistChart(token.id))

  return (
    <AvaButton.Base
      key={token.id}
      onPress={onPress}
      style={[style.item, { backgroundColor: theme.colorBg2 }]}>
      <Avatar.Custom
        name={token.name}
        symbol={token.symbol}
        logoUri={token.logoUri}
      />
      <Space y={4} />
      <AvaText.ButtonSmall textStyle={{ color: theme.colorText1 }}>
        {token?.symbol?.toUpperCase()}
      </AvaText.ButtonSmall>
      <Space y={16} />
      <MarketMovement
        priceChange={chartData?.ranges?.diffValue ?? 0}
        percentChange={chartData?.ranges?.percentChange ?? 0}
        hideDifference
      />
    </AvaButton.Base>
  )
}

const style = StyleSheet.create({
  item: {
    height: 96,
    width: 72,
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 8
  }
})

export default WatchlistCarrousel

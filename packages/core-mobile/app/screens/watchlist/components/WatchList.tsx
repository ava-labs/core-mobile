import React from 'react'
import { Platform, StyleSheet, View, StyleProp, ViewStyle } from 'react-native'
import { ContentStyle } from '@shopify/flash-list'
import WatchListItem from 'screens/watchlist/components/WatchListItem'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { TabsScreenProps } from 'navigation/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Separator from 'components/Separator'
import ZeroState from 'components/ZeroState'
import { useDispatch } from 'react-redux'
import {
  Charts,
  defaultChartData,
  defaultPrice,
  fetchWatchlist,
  MarketToken,
  PriceData,
  Prices,
  reorderFavorites
} from 'store/watchlist'
import { DragEndParams } from 'components/draggableList/types'
import DraggableList from 'components/draggableList/DraggableList'
import BigList from 'components/BigList'
import FlashList from 'components/FlashList'
import { AppHook } from 'AppHook'
import { WatchListType } from '../types'

const getDisplayValue = ({
  price,
  currencyFormatter
}: {
  price: PriceData
  currencyFormatter: AppHook['tokenInCurrencyFormatter']
}): string => {
  const priceInCurrency = price.priceInCurrency
  return currencyFormatter(priceInCurrency)
}

interface Props {
  tokens: MarketToken[]
  prices: Prices
  charts: Charts
  type: WatchListType
  isSearching?: boolean
  onExploreAllTokens?: () => void
  testID?: string
  contentContainerStyle?: StyleProp<ViewStyle>
}

type NavigationProp = TabsScreenProps<
  typeof AppNavigation.Tabs.Watchlist
>['navigation']

const WatchList: React.FC<Props> = ({
  tokens,
  prices,
  charts,
  type,
  onExploreAllTokens,
  contentContainerStyle
}) => {
  const navigation = useNavigation<NavigationProp>()
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook
  const dispatch = useDispatch()

  const keyExtractor = (item: MarketToken): string => item.id

  function renderItem(token: MarketToken, index: number): React.JSX.Element {
    const chartData = charts[token.id] ?? defaultChartData
    const price = prices[token.id] ?? defaultPrice

    const displayValue = getDisplayValue({
      price,
      currencyFormatter: tokenInCurrencyFormatter
    })

    const isFirstItem = index === 0

    return (
      <View style={styles.item} key={token.id}>
        {!isFirstItem && <SeparatorComponent />}
        <WatchListItem
          index={index}
          token={token}
          type={type}
          chartData={chartData}
          value={displayValue}
          testID={`watchlist_item__${token.symbol}`}
          onPress={() => {
            navigation.navigate(AppNavigation.Wallet.TokenDetail, {
              tokenId: token.id
            })
          }}
        />
      </View>
    )
  }

  const EmptyComponent =
    type === WatchListType.FAVORITES ? (
      <ZeroState.NoWatchlistFavorites exploreAllTokens={onExploreAllTokens} />
    ) : type === WatchListType.SEARCH ? (
      <ZeroState.NoResultsTextual
        message={
          'There are no tokens that match your search. Please try again.'
        }
      />
    ) : (
      <View style={{ marginTop: '15%' }}>
        <ZeroState.SomethingWentWrong />
      </View>
    )

  if (type === WatchListType.FAVORITES) {
    return (
      <DraggableList
        data={tokens || []}
        keyExtractor={keyExtractor}
        renderItem={item => renderItem(item.item, item.index)}
        onDragEnd={(params: DragEndParams<MarketToken>) => {
          const favIds = params.newListOrder.map(item => item.id)
          dispatch(reorderFavorites(favIds))
        }}
        ListEmptyComponent={EmptyComponent}
      />
    )
  }

  if (Platform.OS === 'ios') {
    return (
      <FlashList
        data={tokens}
        renderItem={item => renderItem(item.item, item.index)}
        ListEmptyComponent={EmptyComponent}
        refreshing={false}
        onRefresh={() => dispatch(fetchWatchlist)}
        keyExtractor={keyExtractor}
        estimatedItemSize={64}
        contentContainerStyle={contentContainerStyle as ContentStyle}
      />
    )
  }

  return (
    <BigList
      data={tokens}
      renderItem={item => renderItem(item.item, item.index)}
      ListEmptyComponent={EmptyComponent}
      refreshing={false}
      onRefresh={() => dispatch(fetchWatchlist)}
      keyExtractor={keyExtractor}
      estimatedItemSize={64}
      contentContainerStyle={contentContainerStyle}
    />
  )
}

const SeparatorComponent = (): React.JSX.Element => (
  <Separator style={styles.separator} inset={8} />
)

const styles = StyleSheet.create({
  separator: { backgroundColor: '#323232', height: 0.5 },
  item: { flex: 1 }
})

export default React.memo(WatchList)

import React, { useCallback } from 'react'
import { StyleSheet } from 'react-native'
import { Separator } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { MarketToken } from 'store/watchlist'
import { selectTokenVisibility } from 'store/portfolio'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectBalanceTotalForAccount } from 'store/balance'
import { useRouter } from 'expo-router'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { AVAX_TOKEN_ID } from 'common/consts/swap'
import { TrendingTokenListItem } from './TrendingTokenListItem'

const numColumns = 1
const estimatedItemSize = 120

const TrendingTokensScreen = ({
  data,
  goToMarketDetail,
  emptyComponent
}: {
  data: MarketToken[]
  goToMarketDetail: (tokenId: string) => void
  emptyComponent: React.JSX.Element
}): JSX.Element => {
  const { navigate } = useRouter()
  const { navigateToSwap } = useNavigateToSwap()
  const activeAccount = useSelector(selectActiveAccount)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const balanceTotal = useSelector(
    selectBalanceTotalForAccount(activeAccount?.index ?? 0, tokenVisibility)
  )
  const isZeroBalance = balanceTotal === 0n

  const openBuy = useCallback(() => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/buy',
      params: { showAvaxWarning: 'true' }
    })
  }, [navigate])

  const onBuyPress = useCallback(
    (initialTokenIdTo?: string) => {
      if (isZeroBalance) {
        openBuy()
      } else {
        navigateToSwap(AVAX_TOKEN_ID, initialTokenIdTo)
      }
    },
    [isZeroBalance, openBuy, navigateToSwap]
  )

  const renderItem = useCallback(
    ({
      item,
      index
    }: {
      item: MarketToken
      index: number
    }): React.JSX.Element => {
      return (
        <TrendingTokenListItem
          token={item}
          index={index}
          onBuyPress={onBuyPress}
          onPress={() => goToMarketDetail(item.id)}
        />
      )
    },
    [goToMarketDetail, onBuyPress]
  )

  const renderSeparator = useCallback((): JSX.Element => {
    return <Separator sx={{ marginLeft: 68 }} />
  }, [])

  return (
    <CollapsibleTabs.FlashList
      contentContainerStyle={styles.container}
      data={data}
      numColumns={numColumns}
      renderItem={renderItem}
      ListEmptyComponent={emptyComponent}
      ItemSeparatorComponent={renderSeparator}
      showsVerticalScrollIndicator={false}
      key={'list'}
      keyExtractor={item => item.id}
      removeClippedSubviews={true}
      estimatedItemSize={estimatedItemSize}
    />
  )
}

const styles = StyleSheet.create({
  container: { paddingBottom: 16 },
  dropdownContainer: { paddingHorizontal: 16 },
  dropdown: { marginTop: 14, marginBottom: 16 },
  headerContainer: {
    marginTop: 8,
    marginBottom: 16,
    marginHorizontal: 16
  }
})

export default TrendingTokensScreen

import { Separator } from '@avalabs/k2-alpine'
import { AVAX_TOKEN_ID } from 'common/consts/swap'
import { useIsSwappable } from 'common/hooks/useIsSwapable'
import { useBuy } from 'features/meld/hooks/useBuy'
import { useBalanceTotalForAccount } from 'features/portfolio/hooks/useBalanceTotalForAccount'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { getTokenAddress, getTokenChainId } from 'features/track/utils/utils'
import React, { useCallback } from 'react'
import { StyleSheet, ViewStyle } from 'react-native'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsSwapBlocked } from 'store/posthog'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { MarketToken, MarketType } from 'store/watchlist'
import { CollapsibleTabList } from 'common/components/CollapsibleTabList'
import { TrendingTokenListItem } from './TrendingTokenListItem'

const TrendingTokensScreen = ({
  data,
  goToMarketDetail,
  emptyComponent,
  containerStyle
}: {
  data: MarketToken[]
  goToMarketDetail: (tokenId: string, marketType: MarketType) => void
  emptyComponent: React.JSX.Element
  containerStyle: ViewStyle
}): JSX.Element => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { navigateToSwap } = useNavigateToSwap()
  const activeAccount = useSelector(selectActiveAccount)
  const { isSwappable } = useIsSwappable()
  const isSwapBlocked = useSelector(selectIsSwapBlocked)
  const { navigateToBuy } = useBuy()

  const balanceTotal = useBalanceTotalForAccount(activeAccount)

  const isZeroBalance = balanceTotal === 0n

  const openBuy = useCallback(
    (initialTokenIdTo?: string) => {
      navigateToBuy({
        showAvaxWarning: true,
        address: initialTokenIdTo
      })
    },
    [navigateToBuy]
  )

  const onBuyPress = useCallback(
    (initialTokenIdTo?: string) => {
      if (isZeroBalance || isSwapBlocked) {
        openBuy(initialTokenIdTo)
      } else {
        navigateToSwap(AVAX_TOKEN_ID, initialTokenIdTo)
      }
    },
    [isZeroBalance, openBuy, navigateToSwap, isSwapBlocked]
  )

  const renderItem = useCallback(
    ({
      item,
      index
    }: {
      item: MarketToken
      index: number
    }): React.JSX.Element => {
      const tokenAddress = getTokenAddress(item)
      const chainId = getTokenChainId(item)
      const showBuyButton = isSwappable({ tokenAddress, chainId })

      return (
        <TrendingTokenListItem
          token={item}
          index={index}
          showBuyButton={showBuyButton}
          onBuyPress={() => onBuyPress(tokenAddress)}
          onPress={() => {
            goToMarketDetail(item.id, item.marketType)
          }}
        />
      )
    },
    [goToMarketDetail, onBuyPress, isSwappable]
  )

  const renderSeparator = useCallback((): JSX.Element => {
    return <Separator sx={{ marginLeft: 68 }} />
  }, [])

  const renderEmpty = useCallback(() => emptyComponent, [emptyComponent])

  const keyExtractor = useCallback((item: MarketToken) => item.id, [])

  return (
    <CollapsibleTabList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      containerStyle={containerStyle}
      renderEmpty={renderEmpty}
      renderSeparator={renderSeparator}
      extraData={isDeveloperMode}
      listKey="list"
      contentContainerStyle={styles.container}
    />
  )
}

const styles = StyleSheet.create({
  container: { paddingBottom: 16 }
})

export default TrendingTokensScreen

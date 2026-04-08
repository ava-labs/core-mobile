import { Separator } from '@avalabs/k2-alpine'
import { tokenIds } from 'consts/tokenIds'
import { useBuy } from 'features/meld/hooks/useBuy'
import { useBalanceTotalForAccount } from 'features/portfolio/hooks/useBalanceTotalForAccount'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { getTokenAddress } from 'features/track/utils/utils'
import React, { useCallback, useEffect, useRef } from 'react'
import { StyleSheet, ViewStyle } from 'react-native'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsFusionEnabled } from 'store/posthog'
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
  const isFusionEnabled = useSelector(selectIsFusionEnabled)
  const { navigateToBuy } = useBuy()

  const balanceTotal = useBalanceTotalForAccount(activeAccount)
  const isZeroBalance = balanceTotal === 0n

  const isZeroBalanceRef = useRef(isZeroBalance)
  useEffect(() => {
    isZeroBalanceRef.current = isZeroBalance
  }, [isZeroBalance])

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
    (item: MarketToken) => {
      const tokenAddress = getTokenAddress(item)
      if (isZeroBalanceRef.current) {
        openBuy(tokenAddress)
      } else {
        navigateToSwap({
          fromTokenId: tokenIds.AVAX,
          toTokenId: item.id
        })
      }
    },
    [openBuy, navigateToSwap]
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
      const showBuyButton = isFusionEnabled && !!tokenAddress

      return (
        <TrendingTokenListItem
          token={item}
          index={index}
          showBuyButton={showBuyButton}
          onBuyPress={() => onBuyPress(item)}
          onPress={() => {
            goToMarketDetail(item.id, item.marketType)
          }}
        />
      )
    },
    [goToMarketDetail, onBuyPress, isFusionEnabled]
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

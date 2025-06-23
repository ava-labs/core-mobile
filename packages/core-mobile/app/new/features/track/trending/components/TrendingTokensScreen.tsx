import React, { useCallback } from 'react'
import { StyleSheet, ViewStyle } from 'react-native'
import { Separator } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { MarketToken, MarketType } from 'store/watchlist'
import { selectTokenVisibility } from 'store/portfolio'
import { useSelector } from 'react-redux'
import { selectBalanceTotalForAccount } from 'store/balance'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { AVAX_TOKEN_ID } from 'common/consts/swap'
import { useIsSwappable } from 'common/hooks/useIsSwapable'
import { selectIsSwapBlocked } from 'store/posthog'
import { getTokenAddress, getTokenChainId } from 'features/track/utils/utils'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useBuy } from 'features/meldOnramp/hooks/useBuy'
import { useActiveAccount } from 'common/hooks/useActiveAccount'
import { TrendingTokenListItem } from './TrendingTokenListItem'

const numColumns = 1
const estimatedItemSize = 120

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
  const activeAccount = useActiveAccount()
  const { isSwappable } = useIsSwappable()
  const isSwapBlocked = useSelector(selectIsSwapBlocked)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const { navigateToBuy } = useBuy()

  const balanceTotal = useSelector(
    selectBalanceTotalForAccount(activeAccount.id, tokenVisibility)
  )
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
          onPress={() => goToMarketDetail(item.id, item.marketType)}
        />
      )
    },
    [goToMarketDetail, onBuyPress, isSwappable]
  )

  const renderSeparator = useCallback((): JSX.Element => {
    return <Separator sx={{ marginLeft: 68 }} />
  }, [])

  const overrideProps = {
    contentContainerStyle: {
      ...containerStyle
    }
  }

  return (
    <CollapsibleTabs.FlashList
      overrideProps={overrideProps}
      contentContainerStyle={styles.container}
      data={data}
      extraData={isDeveloperMode}
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

import React, { useCallback } from 'react'
import { StyleSheet } from 'react-native'
import { Separator } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { MarketToken, MarketType } from 'store/watchlist'
import { selectTokenVisibility } from 'store/portfolio'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectBalanceTotalForAccount } from 'store/balance'
import { useRouter } from 'expo-router'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { AVAX_TOKEN_ID } from 'common/consts/swap'
import { useIsSwappable } from 'common/hooks/useIsSwapable'
import {
  selectIsMeldIntegrationBlocked,
  selectIsSwapBlocked
} from 'store/posthog'
import { getTokenAddress, getTokenChainId } from 'features/track/utils/utils'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { TrendingTokenListItem } from './TrendingTokenListItem'

const numColumns = 1
const estimatedItemSize = 120

const TrendingTokensScreen = ({
  data,
  goToMarketDetail,
  emptyComponent
}: {
  data: MarketToken[]
  goToMarketDetail: (tokenId: string, marketType: MarketType) => void
  emptyComponent: React.JSX.Element
}): JSX.Element => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { navigate } = useRouter()
  const { navigateToSwap } = useNavigateToSwap()
  const activeAccount = useSelector(selectActiveAccount)
  const { isSwappable } = useIsSwappable()
  const isSwapBlocked = useSelector(selectIsSwapBlocked)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const balanceTotal = useSelector(
    selectBalanceTotalForAccount(activeAccount?.index ?? 0, tokenVisibility)
  )
  const isZeroBalance = balanceTotal === 0n
  const isMeldIntegrationBlocked = useSelector(selectIsMeldIntegrationBlocked)

  const openBuy = useCallback(() => {
    if (isMeldIntegrationBlocked) {
      // @ts-ignore TODO: make routes typesafe
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/buy',
        params: { showAvaxWarning: 'true' }
      })
      return
    }
    // @ts-ignore TODO: make routes typesafe
    navigate('/buyOnramp')
  }, [isMeldIntegrationBlocked, navigate])

  const onBuyPress = useCallback(
    (initialTokenIdTo?: string) => {
      if (isZeroBalance || isSwapBlocked) {
        openBuy()
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

  return (
    <CollapsibleTabs.FlashList
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

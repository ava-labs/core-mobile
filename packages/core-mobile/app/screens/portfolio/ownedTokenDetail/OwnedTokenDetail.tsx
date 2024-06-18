import { Space } from 'components/Space'
import React, { FC, useEffect, useState } from 'react'
import AvaListItem from 'components/AvaListItem'
import Avatar from 'components/Avatar'
import {
  useFocusEffect,
  useNavigation,
  useRoute
} from '@react-navigation/native'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import { Row } from 'components/Row'
import AppNavigation from 'navigation/AppNavigation'
import {
  BridgeTransactionStatusParams,
  WalletScreenProps
} from 'navigation/types'
import ActivityList from 'screens/shared/ActivityList/ActivityList'
import { TokenWithBalance } from 'store/balance'
import { Transaction } from 'store/transaction'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Text, View } from '@avalabs/k2-mobile'
import { useApplicationContext } from 'contexts/ApplicationContext'
import PriceChangeIndicator from 'screens/watchlist/components/PriceChangeIndicator'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import Separator from 'components/Separator'
import { useNetworks } from 'hooks/networks/useNetworks'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import useBridge from 'screens/bridge/hooks/useBridge'
import OwnedTokenActionButtons from './components/OwnedTokenActionButtons'

type ScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.OwnedTokenDetail
>

const OwnedTokenDetail: FC = () => {
  const { activeNetwork } = useNetworks()
  const { chainId, tokenId } = useRoute<ScreenProps['route']>().params
  const { navigate, pop } = useNavigation<ScreenProps['navigation']>()
  const { filteredTokenList } = useSearchableTokenList()
  const [token, setToken] = useState<TokenWithBalance>()
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const isSwapDisabled = useIsUIDisabled(UI.Swap)
  const isBridgeDisabled = useIsUIDisabled(UI.Bridge)
  const { assetsWithBalances } = useBridge()
  const isTokenBridgable = Boolean(
    assetsWithBalances &&
      assetsWithBalances.some(
        asset => (asset.symbolOnNetwork ?? asset.symbol) === token?.symbol
      )
  )

  useEffect(loadToken, [filteredTokenList, token, tokenId])

  useFocusEffect(() => {
    // This screen shouldn't be accessible if the active network is changed while on it
    if (activeNetwork.chainId !== chainId) {
      pop()
    }
  })

  const openTransactionDetails = (item: Transaction): void => {
    navigate(AppNavigation.Wallet.ActivityDetail, {
      tx: item
    })
  }

  const openTransactionStatus = (
    params: BridgeTransactionStatusParams
  ): void => {
    navigate(AppNavigation.Bridge.BridgeTransactionStatus, params)
  }

  function loadToken(): void {
    if (filteredTokenList && !token) {
      const result = filteredTokenList.filter(tk => tk.localId === tokenId)
      if (result.length > 0) {
        setToken(result[0])
      }
    }
  }

  const subtitle = (
    <Row style={{ alignItems: 'center' }}>
      <Text variant="body2">{token?.balanceDisplayValue ?? '0'}</Text>
      <Text variant="body2" sx={{ color: '$neutral400' }}>
        {' ' + token?.symbol}
      </Text>
    </Row>
  )

  const { getMarketToken } = useWatchlist()

  const renderMarketTrend = (balance: number, symbol: string): JSX.Element => {
    const marketToken = getMarketToken(symbol)
    const percentChange = marketToken?.priceChangePercentage24h ?? 0
    const priceChange = (balance * percentChange) / 100

    return (
      <PriceChangeIndicator
        price={priceChange}
        percent={percentChange}
        textVariant="buttonSmall"
      />
    )
  }

  const handleSend = (): void => {
    AnalyticsService.capture('TokenSendClicked', {
      chainId: activeNetwork.chainId
    })
    navigate(AppNavigation.Wallet.SendTokens, {
      screen: AppNavigation.Send.Send,
      params: { token: token }
    })
  }

  const handleReceive = (): void => {
    AnalyticsService.capture('TokenReceiveClicked', {
      chainId: activeNetwork.chainId
    })
    navigate(AppNavigation.Wallet.ReceiveTokens)
  }

  const handleSwap = (): void => {
    AnalyticsService.capture('TokenSwapClicked', {
      chainId: activeNetwork.chainId
    })
    navigate(AppNavigation.Wallet.Swap, {
      screen: AppNavigation.Swap.Swap,
      params: { initialTokenId: tokenId }
    })
  }

  const handleBridge = (): void => {
    AnalyticsService.capture('TokenBridgeClicked', {
      chainId: activeNetwork.chainId
    })
    navigate(AppNavigation.Wallet.Bridge, {
      screen: AppNavigation.Bridge.Bridge,
      params: token?.symbol ? { initialTokenSymbol: token.symbol } : undefined
    })
  }

  return (
    <View sx={{ paddingHorizontal: 16, flex: 1 }}>
      <Text variant="heading3">Token Details</Text>
      <Space y={8} />
      <View sx={{ marginHorizontal: -16 }}>
        <AvaListItem.Base
          title={<Text variant="heading5">{token?.name}</Text>}
          titleAlignment={'flex-start'}
          subtitle={subtitle}
          leftComponent={
            token && (
              <Avatar.Token
                name={token.name}
                symbol={token.symbol}
                logoUri={token.logoUri}
                size={48}
              />
            )
          }
          rightComponent={
            <View sx={{ alignItems: 'flex-end' }}>
              <Text variant="heading5" ellipsizeMode={'tail'}>
                {currencyFormatter(token?.balanceCurrencyDisplayValue ?? '0')}
              </Text>
              {token?.symbol && token?.balanceInCurrency
                ? renderMarketTrend(token.balanceInCurrency, token.symbol)
                : null}
            </View>
          }
        />
      </View>
      <Space y={16} />
      <OwnedTokenActionButtons
        showSwap={!isSwapDisabled}
        showBridge={!isBridgeDisabled && isTokenBridgable}
        onSend={handleSend}
        onReceive={handleReceive}
        onBridge={handleBridge}
        onSwap={handleSwap}
      />
      <Space y={24} />
      <Separator />
      <Space y={24} />
      <Text variant="heading5">Activity</Text>
      <View sx={{ marginHorizontal: -16, flex: 1 }}>
        <ActivityList
          tokenSymbolFilter={token?.symbol}
          openTransactionDetails={openTransactionDetails}
          openTransactionStatus={openTransactionStatus}
        />
      </View>
    </View>
  )
}

export default OwnedTokenDetail

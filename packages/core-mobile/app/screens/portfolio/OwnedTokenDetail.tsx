import { Space } from 'components/Space'
import React, { FC, useEffect, useState } from 'react'
import AvaListItem from 'components/AvaListItem'
import Avatar from 'components/Avatar'
import { useNavigation, useRoute } from '@react-navigation/native'
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
import { Icons, Text, View } from '@avalabs/k2-mobile'
import { useApplicationContext } from 'contexts/ApplicationContext'
import PriceChangeIndicator from 'screens/watchlist/components/PriceChangeIndicator'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import Separator from 'components/Separator'
import { useNetworks } from 'hooks/networks/useNetworks'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import useBridge from 'screens/bridge/hooks/useBridge'
import SwapIcon from 'assets/icons/swap.svg'
import { theme } from '@avalabs/k2-mobile/src/theme/theme'
import BridgeSVG from 'components/svg/BridgeSVG'
import ArrowOutward from 'assets/icons/arrow_outward.svg'

type ScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.OwnedTokenDetail
>

const OwnedTokenDetail: FC = () => {
  const { activeNetwork } = useNetworks()
  const { tokenId } = useRoute<ScreenProps['route']>().params
  const { navigate } = useNavigation<ScreenProps['navigation']>()
  const { filteredTokenList } = useSearchableTokenList()
  const [token, setToken] = useState<TokenWithBalance>()
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const isSwapDisabled = useIsUIDisabled(UI.Swap)
  const isBridgeDisabled = useIsUIDisabled(UI.Bridge)
  const { assetsWithBalances } = useBridge()
  const isTokenBridgable =
    assetsWithBalances &&
    assetsWithBalances.some(asset => asset.symbolOnNetwork === token?.symbol)

  useEffect(loadToken, [filteredTokenList, token, tokenId])

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
    navigate(AppNavigation.Wallet.Swap, {
      screen: AppNavigation.Swap.Swap,
      params: { initialTokenId: tokenId }
    })
  }

  const handleBridge = (): void => {
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
      <Row style={{ gap: 10 }}>
        {!isSwapDisabled && (
          <ActionButton
            icon={
              <SwapIcon color={theme.colors.$white} style={{ margin: 4 }} />
            }
            text="Swap"
            onPress={handleSwap}
          />
        )}
        {!isBridgeDisabled && isTokenBridgable && (
          <ActionButton
            icon={
              <View sx={{ padding: 3 }}>
                <BridgeSVG color={theme.colors.$white} size={18} />
              </View>
            }
            text="Bridge"
            onPress={handleBridge}
          />
        )}
        <ActionButton
          icon={<ArrowOutward />}
          text="Send"
          onPress={handleSend}
        />
        <ActionButton
          icon={
            <View sx={{ padding: 2 }}>
              <Icons.Communication.IconQRCode
                width={20}
                height={20}
                color={theme.colors.$white}
              />
            </View>
          }
          text="Receive"
          onPress={handleReceive}
        />
      </Row>
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

const ActionButton = ({
  text,
  icon,
  onPress
}: {
  text: string
  icon: JSX.Element
  onPress: () => void
}): JSX.Element => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View
        sx={{
          backgroundColor: '$neutral800',
          gap: 12,
          borderRadius: 16,
          width: 75,
          height: 75
        }}>
        <View sx={{ position: 'absolute', top: 10, left: 8 }}>{icon}</View>
        <Text
          sx={{
            fontSize: 13,
            lineHeight: 21,
            position: 'absolute',
            left: 13,
            bottom: 7
          }}>
          {text}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

export default OwnedTokenDetail

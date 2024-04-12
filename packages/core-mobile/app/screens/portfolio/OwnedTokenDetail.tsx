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
import { Button, Text, View } from '@avalabs/k2-mobile'
import { useApplicationContext } from 'contexts/ApplicationContext'
import PriceChangeIndicator from 'screens/watchlist/components/PriceChangeIndicator'
import { useGetMarketToken } from 'hooks/useGetMarketToken'
import Separator from 'components/Separator'
import { useNetworks } from 'hooks/useNetworks'

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

  const { getMarketToken } = useGetMarketToken()

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
      <Row>
        <View sx={{ flex: 1 }}>
          <Button
            type="secondary"
            size="large"
            onPress={() => {
              AnalyticsService.capture('TokenSendClicked', {
                chainId: activeNetwork.chainId
              })
              navigate(AppNavigation.Wallet.SendTokens, {
                screen: AppNavigation.Send.Send,
                params: { token: token }
              })
            }}>
            Send
          </Button>
        </View>
        <Space x={16} />
        <View sx={{ flex: 1 }}>
          <Button
            type="secondary"
            size="large"
            onPress={() => {
              AnalyticsService.capture('TokenReceiveClicked', {
                chainId: activeNetwork.chainId
              })
              navigate(AppNavigation.Wallet.ReceiveTokens)
            }}>
            Receive
          </Button>
        </View>
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

export default OwnedTokenDetail

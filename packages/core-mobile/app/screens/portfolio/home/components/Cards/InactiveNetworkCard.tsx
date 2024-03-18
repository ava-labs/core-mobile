import React, { FC } from 'react'
import { Network } from '@avalabs/chains-sdk'
import { Dimensions, Platform } from 'react-native'
import { View, alpha, useTheme, TouchableHighlight } from '@avalabs/k2-mobile'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import { PortfolioScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { setActive } from 'store/network'
import {
  selectBalanceTotalInCurrencyForNetworkAndAccount,
  selectTokensWithBalanceByNetwork
} from 'store/balance'
import { NetworkLogo } from 'screens/network/NetworkLogo'
import { selectActiveAccount } from 'store/account'
import usePendingBridgeTransactions from 'screens/bridge/hooks/usePendingBridgeTransactions'
import TopRightBadge from 'components/TopRightBadge'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Text } from '@avalabs/k2-mobile'
import PriceChangeIndicator from 'screens/watchlist/components/PriceChangeIndicator'
import { useTokenPortfolioPriceChange } from 'hooks/useTokenPortfolioPriceChange'

const windowWidth = Dimensions.get('window').width

type Props = {
  network: Network
}

type NavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

const InactiveNetworkCard: FC<Props> = ({ network }) => {
  const dispatch = useDispatch()

  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const { theme } = useTheme()
  const { navigate } = useNavigation<NavigationProp>()
  const account = useSelector(selectActiveAccount)
  const totalBalance = useSelector(
    selectBalanceTotalInCurrencyForNetworkAndAccount(
      network.chainId,
      account?.index
    )
  )

  const backgroundColor = theme.colors.$neutral900
  const pendingBridgeTxs = usePendingBridgeTransactions(network)

  const tokens = useSelector(selectTokensWithBalanceByNetwork(network))
  const { tokenPortfolioPriceChange } = useTokenPortfolioPriceChange(tokens)

  const navigateToNetworkTokens = (): void => {
    AnalyticsService.capture('PortfolioSecondaryNetworkClicked', {
      chainId: network.chainId
    })
    dispatch(setActive(network.chainId))
    setTimeout(
      () => {
        navigate(AppNavigation.Portfolio.NetworkTokens)
      },
      Platform.OS === 'ios' ? 700 : 0
    )
  }

  const renderContent = (): JSX.Element => {
    const balance = currencyFormatter(totalBalance)

    return (
      <View
        sx={{
          flexDirection: 'row'
        }}>
        <View>
          <NetworkLogo
            logoUri={network.logoUri}
            size={32}
            style={{ alignSelf: 'flex-start' }}
          />
          {pendingBridgeTxs.length > 0 && (
            <TopRightBadge
              text={pendingBridgeTxs.length.toString()}
              style={{
                borderColor: theme.colors.$neutral900,
                borderWidth: 2
              }}
              offset={{ x: 3, y: 3 }}
            />
          )}
        </View>
        <View sx={{ flex: 1, marginLeft: 8, alignItems: 'flex-end' }}>
          <Text
            variant="buttonSmall"
            sx={{ textAlign: 'right' }}
            ellipsizeMode={'tail'}
            numberOfLines={2}>
            {network.chainName}
          </Text>
          <Space y={5} />
          <Text variant="buttonSmall" ellipsizeMode={'tail'}>
            {balance}
          </Text>
          <PriceChangeIndicator
            priceChange={tokenPortfolioPriceChange}
            percentChange={(tokenPortfolioPriceChange / totalBalance) * 100}
          />
        </View>
      </View>
    )
  }

  return (
    <TouchableHighlight
      sx={{
        backgroundColor,
        width: (windowWidth - 16 * 2) / 2 - 8.5,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 10
      }}
      activeOpacity={1}
      underlayColor={alpha(backgroundColor, 0.7)}
      onPress={navigateToNetworkTokens}>
      {renderContent()}
    </TouchableHighlight>
  )
}

export default InactiveNetworkCard

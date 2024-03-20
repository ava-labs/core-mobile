import React from 'react'
import { useSelector } from 'react-redux'
import { selectBalanceTotalInCurrencyForNetworkAndAccount } from 'store/balance'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Separator from 'components/Separator'
import AppNavigation from 'navigation/AppNavigation'
import { PortfolioScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import { NetworkLogo } from 'screens/network/NetworkLogo'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'
import usePendingBridgeTransactions from 'screens/bridge/hooks/usePendingBridgeTransactions'
import TopRightBadge from 'components/TopRightBadge'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  Text,
  View,
  TouchableHighlight,
  useTheme,
  alpha
} from '@avalabs/k2-mobile'
import PriceChangeIndicator from 'screens/watchlist/components/PriceChangeIndicator'
import { useTokenPortfolioPriceChange } from 'hooks/useTokenPortfolioPriceChange'
import ZeroState from './ZeroState'
import Tokens from './Tokens'

type NavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

const ActiveNetworkCard = (): JSX.Element => {
  const { filteredTokenList: tokens } = useSearchableTokenList()

  const network = useSelector(selectActiveNetwork)
  const account = useSelector(selectActiveAccount)
  const totalBalanceInCurrency = useSelector(
    selectBalanceTotalInCurrencyForNetworkAndAccount(
      network.chainId,
      account?.index
    )
  )
  const { navigate } = useNavigation<NavigationProp>()
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const { theme } = useTheme()
  const backgroundColor = theme.colors.$neutral900
  const pendingBridgeTxs = usePendingBridgeTransactions(network)
  const { tokenPortfolioPriceChange } = useTokenPortfolioPriceChange(tokens)

  const navigateToNetworkTokens = (): void => {
    AnalyticsService.capture('PortfolioPrimaryNetworkClicked', {
      chainId: network.chainId
    })
    navigate(AppNavigation.Portfolio.NetworkTokens)
  }

  const renderHeader = (): JSX.Element => {
    const balance = currencyFormatter(totalBalanceInCurrency)

    return (
      <View
        sx={{
          flexDirection: 'row'
        }}>
        <View>
          <NetworkLogo logoUri={network.logoUri} size={32} />
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
        <View sx={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
          <View sx={{ flex: 1, marginHorizontal: 16 }}>
            <Text variant="heading6" ellipsizeMode="tail">
              {network.chainName}
            </Text>
            <View
              sx={{
                alignSelf: 'flex-start',
                paddingHorizontal: 8,
                borderRadius: 66,
                backgroundColor: '$neutral850'
              }}>
              <Text
                variant="overline"
                ellipsizeMode="tail"
                sx={{ color: '$white', fontWeight: '500' }}>
                Active Network
              </Text>
            </View>
          </View>
          <View sx={{ alignItems: 'flex-end' }}>
            <Text variant="buttonMedium">{balance}</Text>
            <PriceChangeIndicator
              price={tokenPortfolioPriceChange}
              percent={
                (tokenPortfolioPriceChange / totalBalanceInCurrency) * 100
              }
            />
          </View>
        </View>
      </View>
    )
  }

  const renderSeparator = (): JSX.Element => {
    return (
      <Separator
        style={{
          height: 0.5,
          marginVertical: 8,
          backgroundColor: theme.colors.$neutral800
        }}
      />
    )
  }

  const renderContent = (): JSX.Element => {
    if (tokens.length === 0) return <ZeroState />

    return <Tokens />
  }

  return (
    <TouchableHighlight
      sx={{ borderRadius: 10, backgroundColor, padding: 16 }}
      underlayColor={alpha(backgroundColor, 0.7)}
      onPress={navigateToNetworkTokens}>
      <View>
        {renderHeader()}
        {renderSeparator()}
        {renderContent()}
      </View>
    </TouchableHighlight>
  )
}

export default ActiveNetworkCard

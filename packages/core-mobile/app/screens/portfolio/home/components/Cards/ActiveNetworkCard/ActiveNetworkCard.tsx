import React from 'react'
import { useSelector } from 'react-redux'
import { selectBalanceTotalInCurrencyForNetworkAndAccount } from 'store/balance/slice'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Separator from 'components/Separator'
import AppNavigation from 'navigation/AppNavigation'
import { PortfolioScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import { NetworkLogo } from 'screens/network/NetworkLogo'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import { selectActiveAccount } from 'store/account'
import usePendingBridgeTransactions from 'screens/bridge/hooks/usePendingBridgeTransactions'
import TopRightBadge from 'components/TopRightBadge'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  Text,
  View,
  TouchableHighlight,
  useTheme,
  alpha,
  Icons
} from '@avalabs/k2-mobile'
import PriceChangeIndicator from 'screens/watchlist/components/PriceChangeIndicator'
import { useTokenPortfolioPriceChange } from 'hooks/balance/useTokenPortfolioPriceChange'
import { Space } from 'components/Space'
import { useNetworks } from 'hooks/networks/useNetworks'
import { isAvmNetwork, isPvmNetwork } from 'utils/network/isAvalancheNetwork'
import { selectTokenVisibility } from 'store/portfolio/slice'
import ZeroState from './ZeroState'
import Tokens from './Tokens'
import { PChainAssetList } from './PChainAssetList'
import { XChainAssetList } from './XChainAssetList'

type NavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

const ActiveNetworkCard = (): JSX.Element => {
  const { filteredTokenList: tokens } = useSearchableTokenList()
  const { activeNetwork } = useNetworks()
  const account = useSelector(selectActiveAccount)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const totalBalanceInCurrency = useSelector(
    selectBalanceTotalInCurrencyForNetworkAndAccount(
      activeNetwork.chainId,
      account?.index,
      tokenVisibility
    )
  )
  const { navigate } = useNavigation<NavigationProp>()
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const { theme } = useTheme()
  const backgroundColor = theme.colors.$neutral900
  const pendingBridgeTxs = usePendingBridgeTransactions(activeNetwork)
  const { tokenPortfolioPriceChange } = useTokenPortfolioPriceChange(tokens)

  const navigateToNetworkTokens = (): void => {
    AnalyticsService.capture('PortfolioPrimaryNetworkClicked', {
      chainId: activeNetwork.chainId
    })
    navigate(AppNavigation.Portfolio.NetworkTokens)
  }

  const renderHeader = (): JSX.Element => {
    const balance = currencyFormatter(totalBalanceInCurrency)

    return (
      <View>
        <View sx={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <NetworkLogo logoUri={activeNetwork.logoUri} size={32} />
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
          <View
            sx={{
              alignSelf: 'flex-start',
              paddingHorizontal: 8,
              borderRadius: 66,
              backgroundColor: '$neutral850',
              flexDirection: 'row',
              alignItems: 'center'
            }}>
            <Icons.Navigation.Check
              width={16}
              height={16}
              color={theme.colors.$successLight}
            />
            <Text
              variant="overline"
              ellipsizeMode="tail"
              sx={{ color: '$successLight', fontWeight: '500', marginLeft: 4 }}>
              Active
            </Text>
          </View>
        </View>
        <Space y={8} />
        <View
          testID="active_network"
          sx={{
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}>
          <View>
            <Text
              variant="heading5"
              ellipsizeMode="tail"
              testID={`active_network__${activeNetwork.chainName}`}>
              {activeNetwork.chainName}
            </Text>
          </View>
          <View sx={{ alignItems: 'flex-end' }}>
            <Text testID="active_network_balance" variant="heading6">
              {balance}
            </Text>
            <PriceChangeIndicator
              price={tokenPortfolioPriceChange}
              textVariant="buttonSmall"
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
          marginVertical: 16,
          backgroundColor: theme.colors.$neutral800
        }}
      />
    )
  }

  const renderContent = (): JSX.Element => {
    if (tokens.length === 0) return <ZeroState />

    if (isPvmNetwork(activeNetwork)) {
      return (
        <PChainAssetList
          scrollEnabled={false}
          ItemSeparator={ItemSeparator}
          limit={4}
        />
      )
    }
    if (isAvmNetwork(activeNetwork)) {
      return (
        <XChainAssetList scrollEnabled={false} ItemSeparator={ItemSeparator} />
      )
    }
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

const ItemSeparator = (): React.JSX.Element => {
  return <Space y={16} />
}

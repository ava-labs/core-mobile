import React, { FC } from 'react'
import { Network } from '@avalabs/core-chains-sdk'
import { Dimensions, LayoutChangeEvent } from 'react-native'
import { View, alpha, useTheme, TouchableHighlight } from '@avalabs/k2-mobile'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import { useSelector } from 'react-redux'
import {
  selectBalanceTotalInCurrencyForNetworkAndAccount,
  selectTokensWithBalanceByNetwork
} from 'store/balance/slice'
import { NetworkLogo } from 'screens/network/NetworkLogo'
import { selectActiveAccount } from 'store/account'
import usePendingBridgeTransactions from 'screens/bridge/hooks/usePendingBridgeTransactions'
import TopRightBadge from 'components/TopRightBadge'
import { Text } from '@avalabs/k2-mobile'
import PriceChangeIndicator from 'screens/watchlist/components/PriceChangeIndicator'
import { useTokenPortfolioPriceChange } from 'hooks/balance/useTokenPortfolioPriceChange'
import { selectTokenVisibility } from 'store/portfolio/slice'

const windowWidth = Dimensions.get('window').width

type Props = {
  network: Network
  onPress: (network: Network) => void
  onContentLayout?: (event: LayoutChangeEvent) => void
  height?: number
}

const InactiveNetworkCard: FC<Props> = ({
  network,
  onPress,
  onContentLayout,
  height
}) => {
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const { theme } = useTheme()
  const account = useSelector(selectActiveAccount)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const totalBalance = useSelector(
    selectBalanceTotalInCurrencyForNetworkAndAccount(
      network.chainId,
      account?.index,
      tokenVisibility
    )
  )

  const backgroundColor = theme.colors.$neutral900
  const pendingBridgeTxs = usePendingBridgeTransactions(network)

  const tokens = useSelector(selectTokensWithBalanceByNetwork(network))
  const { tokenPortfolioPriceChange } = useTokenPortfolioPriceChange(tokens)
  const renderContent = (): JSX.Element => {
    const balance = currencyFormatter(totalBalance)
    return (
      <View
        sx={{
          padding: 16
        }}
        onLayout={onContentLayout}>
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
        </View>
        <Space y={8} />
        <View>
          <Text
            testID={`inactive_network__${network.chainName}`}
            variant="buttonLarge"
            ellipsizeMode={'tail'}
            numberOfLines={2}
            sx={{ color: '$neutral400', marginBottom: -2 }}>
            {network.chainName}
          </Text>
          <Text variant="buttonLarge" ellipsizeMode={'tail'}>
            {balance}
          </Text>
          <Space y={4} />
          <PriceChangeIndicator
            price={tokenPortfolioPriceChange}
            textVariant="buttonMedium"
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
        borderRadius: 10,
        height
      }}
      activeOpacity={1}
      underlayColor={alpha(backgroundColor, 0.7)}
      onPress={() => onPress(network)}>
      {renderContent()}
    </TouchableHighlight>
  )
}

export default InactiveNetworkCard

import React, { FC } from 'react'
import { Network } from '@avalabs/chains-sdk'
import { View, StyleSheet, Dimensions, TouchableHighlight } from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Opacity70, Opacity85 } from 'resources/Constants'
import { Space } from 'components/Space'
import { PortfolioScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { setActive } from 'store/network'
import { selectBalanceTotalInCurrencyForNetwork } from 'store/balance'
import { NetworkLogo } from 'screens/network/NetworkLogo'

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
    appHook: { currencyFormatter },
    theme
  } = useApplicationContext()
  const { navigate } = useNavigation<NavigationProp>()
  const totalBalance = useSelector(
    selectBalanceTotalInCurrencyForNetwork(network.chainId)
  )

  const cardBgColor = theme.colorBg2 + Opacity85
  const highlighColor = theme.colorBg3 + Opacity70

  const navigateToNetworkTokens = () => {
    dispatch(setActive(network.chainId))
    navigate(AppNavigation.Portfolio.NetworkTokens)
  }

  const renderContent = () => {
    const textColor = theme.colorText3
    const balance = currencyFormatter(totalBalance)

    return (
      <View style={styles.headerContainer}>
        <NetworkLogo logoUri={network.logoUri} size={40} style={styles.icon} />
        <View style={styles.headerTextContainer}>
          <AvaText.TextLink
            ellipsizeMode={'tail'}
            numberOfLines={2}
            textStyle={{ color: textColor }}>
            {network.chainName}
          </AvaText.TextLink>
          <Space y={4} />
          <AvaText.Caption
            ellipsizeMode={'tail'}
            textStyle={{ color: textColor }}>
            {balance}
          </AvaText.Caption>
        </View>
      </View>
    )
  }

  return (
    <TouchableHighlight
      style={[styles.container, { backgroundColor: cardBgColor }]}
      activeOpacity={1}
      underlayColor={highlighColor}
      onPress={navigateToNetworkTokens}>
      {renderContent()}
    </TouchableHighlight>
  )
}

const styles = StyleSheet.create({
  container: {
    width: (windowWidth - 16 * 2) / 2 - 8.5,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 10
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 8
  },
  icon: {
    alignSelf: 'flex-start'
  }
})
export default InactiveNetworkCard

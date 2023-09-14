import React, { FC, useState } from 'react'
import { Network } from '@avalabs/chains-sdk'
import {
  Dimensions,
  LayoutRectangle,
  Platform,
  StyleSheet,
  TouchableHighlight,
  View
} from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Opacity85 } from 'resources/Constants'
import { Space } from 'components/Space'
import { PortfolioScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { setActive } from 'store/network'
import { selectBalanceTotalInCurrencyForNetworkAndAccount } from 'store/balance'
import { NetworkLogo } from 'screens/network/NetworkLogo'
import { selectActiveAccount } from 'store/account'
import { usePostCapture } from 'hooks/usePosthogCapture'
import { getCardHighLightColor } from 'utils/color/getCardHighLightColor'
import Badge from 'components/Badge'
import usePendingBridgeTransactions from 'screens/bridge/hooks/usePendingBridgeTransactions'

const windowWidth = Dimensions.get('window').width

type Props = {
  network: Network
}

type NavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

const InactiveNetworkCard: FC<Props> = ({ network }) => {
  const dispatch = useDispatch()
  const { capture } = usePostCapture()

  const {
    appHook: { currencyFormatter },
    theme
  } = useApplicationContext()
  const { navigate } = useNavigation<NavigationProp>()
  const account = useSelector(selectActiveAccount)
  const totalBalance = useSelector(
    selectBalanceTotalInCurrencyForNetworkAndAccount(
      network.chainId,
      account?.index
    )
  )

  const cardBgColor = theme.colorBg2 + Opacity85
  const highlighColor = getCardHighLightColor(theme)
  const pendingBridgeTxs = usePendingBridgeTransactions(network)
  const [activityTabBadgeLayout, setActivityTabBadgeLayout] =
    useState<LayoutRectangle>()

  const navigateToNetworkTokens = () => {
    capture('PortfolioSecondaryNetworkClicked', {
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

  const renderContent = () => {
    const textColor = theme.colorText3
    const balance = currencyFormatter(totalBalance)

    return (
      <View style={styles.headerContainer}>
        <View>
          <NetworkLogo
            logoUri={network.logoUri}
            size={40}
            style={styles.icon}
          />
          {pendingBridgeTxs.length > 0 && (
            <Badge
              text={pendingBridgeTxs.length.toString()}
              style={{
                position: 'absolute',
                top: activityTabBadgeLayout
                  ? -activityTabBadgeLayout.height / 2 + 3
                  : undefined,
                right: activityTabBadgeLayout
                  ? -activityTabBadgeLayout.width / 2 + 3
                  : undefined,
                borderColor: theme.colorBg2,
                borderWidth: 2
              }}
              onLayout={layout => {
                setActivityTabBadgeLayout(layout)
              }}
            />
          )}
        </View>
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

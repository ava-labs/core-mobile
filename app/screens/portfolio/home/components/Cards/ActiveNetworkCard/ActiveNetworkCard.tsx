import React from 'react'
import { useSelector } from 'react-redux'
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native'
import { selectBalanceTotalInCurrencyForNetworkAndAccount } from 'store/balance'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Opacity20, Opacity85 } from 'resources/Constants'
import Separator from 'components/Separator'
import { Space } from 'components/Space'
import AppNavigation from 'navigation/AppNavigation'
import { PortfolioScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import { NetworkLogo } from 'screens/network/NetworkLogo'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'
import { usePostCapture } from 'hooks/usePosthogCapture'
import { getCardHighLightColor } from 'utils/color/getCardHighLightColor'
import ZeroState from './ZeroState'
import Tokens from './Tokens'

type NavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

const ActiveNetworkCard = () => {
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
  const { capture } = usePostCapture()
  const {
    appHook: { currencyFormatter },
    theme
  } = useApplicationContext()
  const cardBgColor = theme.colorBg2 + Opacity85
  const highlighColor = getCardHighLightColor(theme)

  const navigateToNetworkTokens = () => {
    capture('PortfolioPrimaryNetworkClicked', {
      chainId: network.chainId
    })
    navigate(AppNavigation.Portfolio.NetworkTokens)
  }

  const renderHeader = () => {
    const balanceTextColor = theme.colorText3
    const tagTextColor = theme.colorBg2
    const tagBgColor = theme.colorText3
    const balance = currencyFormatter(totalBalanceInCurrency)

    return (
      <View style={styles.headerContainer}>
        <NetworkLogo
          logoUri={network.logoUri}
          size={40}
          style={styles.bigIcon}
        />
        <View style={styles.headerTextContainer}>
          <AvaText.Heading2 ellipsizeMode={'tail'} numberOfLines={2}>
            {network.chainName}
          </AvaText.Heading2>
          <Space y={4} />
          <AvaText.TextLink
            ellipsizeMode={'tail'}
            textStyle={{ color: balanceTextColor }}>
            {balance}
          </AvaText.TextLink>
        </View>
        <View style={[styles.tagContainer, { backgroundColor: tagBgColor }]}>
          <Text style={[styles.tagText, { color: tagTextColor }]}>Active</Text>
        </View>
      </View>
    )
  }

  const renderSeparator = () => {
    const separatorColor = theme.colorText3 + Opacity20
    return (
      <Separator
        style={[styles.separator, { backgroundColor: separatorColor }]}
      />
    )
  }

  const renderContent = () => {
    if (tokens.length === 0) return <ZeroState />

    return <Tokens />
  }

  return (
    <TouchableHighlight
      style={[styles.container, { backgroundColor: cardBgColor }]}
      activeOpacity={1}
      underlayColor={highlighColor}
      onPress={navigateToNetworkTokens}>
      <View>
        {renderHeader()}
        {renderSeparator()}
        {renderContent()}
      </View>
    </TouchableHighlight>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 10
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTextContainer: {
    flex: 1,
    marginHorizontal: 16
  },
  bigIcon: {
    alignSelf: 'flex-start'
  },
  separator: {
    height: 0.5,
    marginVertical: 16
  },
  tagContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    borderRadius: 66
  },
  tagText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    lineHeight: 16
  }
})

export default ActiveNetworkCard

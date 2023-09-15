import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { useSelector } from 'react-redux'
import {
  selectBalanceTotalInCurrencyForNetworkAndAccount,
  selectIsLoadingBalances,
  selectIsRefetchingBalances
} from 'store/balance'
import { ActivityIndicator } from 'components/ActivityIndicator'
import { NetworkLogo } from 'screens/network/NetworkLogo'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'

const NetworkTokensHeader = () => {
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const isLoadingBalance = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)
  const { chainName, logoUri, chainId } = useSelector(selectActiveNetwork)
  const account = useSelector(selectActiveAccount)
  const balanceTotal = useSelector(
    selectBalanceTotalInCurrencyForNetworkAndAccount(chainId, account?.index)
  )
  const formattedTotalBalance = currencyFormatter(balanceTotal)

  const isBalanceLoading = isLoadingBalance || isRefetchingBalance

  return (
    <View style={styles.container}>
      <View style={styles.networkContainer}>
        <NetworkLogo logoUri={logoUri} size={48} style={styles.logo} />
        <View style={styles.textContainer}>
          <AvaText.Heading1 ellipsizeMode="tail" numberOfLines={2}>
            {chainName}
          </AvaText.Heading1>
          <Space y={4} />
          {isBalanceLoading ? (
            <ActivityIndicator
              style={{ alignSelf: 'flex-start' }}
              size="small"
            />
          ) : (
            <AvaText.Body1 ellipsizeMode={'tail'}>
              {formattedTotalBalance}
            </AvaText.Body1>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16
  },
  networkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 25
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
    marginRight: 50
  },
  logo: {
    alignSelf: 'flex-start',
    marginTop: 3
  }
})

export default NetworkTokensHeader

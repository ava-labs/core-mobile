import React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { useSelector } from 'react-redux'
import {
  selectBalanceTotalInCurrencyForNetwork,
  selectIsLoadingBalances,
  selectIsRefetchingBalances
} from 'store/balance'
import { selectActiveNetwork } from 'store/network'
import { ActivityIndicator } from 'components/ActivityIndicator'

const NetworkTokensHeader = () => {
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const { chainName, logoUri, chainId } = useSelector(selectActiveNetwork)
  const isLoadingBalance = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)
  const balanceTotal = useSelector(
    selectBalanceTotalInCurrencyForNetwork(chainId)
  )
  const formattedTotalBalance = currencyFormatter(balanceTotal)

  const isBalanceLoading = isLoadingBalance || isRefetchingBalance

  return (
    <View style={styles.container}>
      <View style={styles.networkContainer}>
        <Image source={{ uri: logoUri }} style={styles.logo} />
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
    marginHorizontal: 16
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
    marginTop: 3,
    width: 48,
    height: 48,
    borderRadius: 48 / 2
  }
})

export default NetworkTokensHeader

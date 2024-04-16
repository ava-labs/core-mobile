import React from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import { useSelector } from 'react-redux'
import {
  selectBalanceTotalInCurrencyForNetworkAndAccount,
  selectIsLoadingBalances,
  selectIsRefetchingBalances
} from 'store/balance'
import { ActivityIndicator } from 'components/ActivityIndicator'
import { NetworkLogo } from 'screens/network/NetworkLogo'
import { selectActiveAccount } from 'store/account'
import { Text, View } from '@avalabs/k2-mobile'
import PriceChangeIndicator from 'screens/watchlist/components/PriceChangeIndicator'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import { useTokenPortfolioPriceChange } from 'hooks/networks/useTokenPortfolioPriceChange'
import { useNetworks } from 'hooks/networks/useNetworks'

const NetworkTokensHeader = (): JSX.Element => {
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const {
    activeNetwork: { chainName, logoUri, chainId }
  } = useNetworks()
  const isLoadingBalance = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)
  const account = useSelector(selectActiveAccount)
  const balanceTotal = useSelector(
    selectBalanceTotalInCurrencyForNetworkAndAccount(chainId, account?.index)
  )
  const formattedTotalBalance = currencyFormatter(balanceTotal)

  const isBalanceLoading = isLoadingBalance || isRefetchingBalance

  const { filteredTokenList: tokens } = useSearchableTokenList()
  const { tokenPortfolioPriceChange } = useTokenPortfolioPriceChange(tokens)

  return (
    <View
      sx={{
        paddingVertical: 8,
        paddingHorizontal: 16
      }}>
      <View
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row'
        }}>
        <NetworkLogo logoUri={logoUri} size={24} />
        <View sx={{ flex: 1, marginLeft: 8, marginRight: 50 }}>
          <Text variant="buttonLarge" ellipsizeMode="tail" numberOfLines={2}>
            {chainName}
          </Text>
        </View>
      </View>
      <Space y={4} />
      <View>
        {isBalanceLoading ? (
          <ActivityIndicator style={{ alignSelf: 'flex-start' }} size="small" />
        ) : (
          <Text variant="heading4" ellipsizeMode={'tail'}>
            {formattedTotalBalance}
          </Text>
        )}
        <PriceChangeIndicator
          price={tokenPortfolioPriceChange}
          percent={(tokenPortfolioPriceChange / balanceTotal) * 100}
        />
      </View>
    </View>
  )
}

export default NetworkTokensHeader

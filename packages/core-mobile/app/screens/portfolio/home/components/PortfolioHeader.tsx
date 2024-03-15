import React from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import { useSelector } from 'react-redux'
import {
  selectBalanceTotalInCurrencyForAccount,
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectTokensWithBalanceForAccount
} from 'store/balance'
import { selectActiveAccount } from 'store/account'
import { ActivityIndicator } from 'components/ActivityIndicator'
import MarketTrend from 'screens/watchlist/components/MarketTrend'
import { Text, View } from '@avalabs/k2-mobile'
import { useTokensPriceChange } from 'hooks/useTokensPriceChange'
import { PortfolioHeaderLoader } from './Loaders/PortfolioHeaderLoader'

function PortfolioHeader(): JSX.Element {
  const context = useApplicationContext()
  const activeAccount = useSelector(selectActiveAccount)
  const isBalanceLoading = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)
  const balanceTotalInCurrency = useSelector(
    selectBalanceTotalInCurrencyForAccount(activeAccount?.index ?? 0)
  )
  const { selectedCurrency, currencyFormatter } = context.appHook
  const currencyBalance = currencyFormatter(balanceTotalInCurrency)
  const tokens = useSelector(
    selectTokensWithBalanceForAccount(activeAccount?.index)
  )
  const { priceChange } = useTokensPriceChange(tokens)

  const renderContent = (): JSX.Element => {
    if (isBalanceLoading) return <PortfolioHeaderLoader />

    if (isRefetchingBalance)
      return <ActivityIndicator style={{ alignSelf: 'center' }} size="small" />

    return (
      <>
        <Text variant="heading3">
          {currencyBalance.replace(selectedCurrency, '')}
        </Text>
        <Text
          variant="body1"
          sx={{
            paddingBottom: 4,
            marginLeft: 4,
            color: '$neutral400'
          }}>
          {selectedCurrency}
        </Text>
      </>
    )
  }

  return (
    <View sx={{ alignItems: 'center' }} pointerEvents="box-none">
      <View
        sx={{
          alignItems: 'flex-end',
          justifyContent: 'center',
          flexDirection: 'row',
          height: 44,
          marginTop: 25
        }}>
        {renderContent()}
      </View>
      <MarketTrend
        priceChange={priceChange}
        percentChange={(priceChange / balanceTotalInCurrency) * 100}
        isVertical={false}
        textVariant="buttonSmall"
      />
      <Space y={18} />
    </View>
  )
}

export default PortfolioHeader

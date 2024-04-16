import React, { useState } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSelector } from 'react-redux'
import {
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectTokensWithBalanceForAccount
} from 'store/balance'
import { selectActiveAccount } from 'store/account'
import { ActivityIndicator } from 'components/ActivityIndicator'
import PriceChangeIndicator from 'screens/watchlist/components/PriceChangeIndicator'
import { Text, View } from '@avalabs/k2-mobile'
import { useTokenPortfolioPriceChange } from 'hooks/balance/useTokenPortfolioPriceChange'
import { useBalanceTotalInCurrencyForAccount } from 'hooks/balance/useBalanceTotalInCurrencyForAccount'
import { PortfolioHeaderLoader } from './Loaders/PortfolioHeaderLoader'

function PortfolioHeader(): JSX.Element {
  const context = useApplicationContext()
  const activeAccount = useSelector(selectActiveAccount)
  const isBalanceLoading = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)
  const balanceTotalInCurrency = useBalanceTotalInCurrencyForAccount(
    activeAccount?.index ?? 0
  )
  const { selectedCurrency, currencyFormatter } = context.appHook
  const currencyBalance = currencyFormatter(balanceTotalInCurrency)
  const tokens = useSelector(
    selectTokensWithBalanceForAccount(activeAccount?.index)
  )
  const { tokenPortfolioPriceChange } = useTokenPortfolioPriceChange(tokens)
  const [contentHeight, setContentHeight] = useState(0)

  const renderContent = (): JSX.Element => {
    if (isBalanceLoading) return <PortfolioHeaderLoader />

    if (isRefetchingBalance)
      return (
        <ActivityIndicator
          style={{ alignSelf: 'center', height: contentHeight }}
          size="small"
        />
      )

    return (
      <View
        sx={{ alignItems: 'center' }}
        onLayout={event => {
          setContentHeight(event.nativeEvent.layout.height)
        }}>
        <View
          sx={{
            alignItems: 'flex-end',
            justifyContent: 'center',
            flexDirection: 'row',
            height: 44
          }}>
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
        </View>
        <PriceChangeIndicator
          price={tokenPortfolioPriceChange}
          textVariant="buttonSmall"
        />
      </View>
    )
  }

  return (
    <View sx={{ paddingVertical: 8 }} pointerEvents="box-none">
      {renderContent()}
    </View>
  )
}

export default PortfolioHeader

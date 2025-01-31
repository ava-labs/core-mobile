import React, { useState } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSelector } from 'react-redux'
import {
  selectBalanceForAccountIsAccurate,
  selectBalanceTotalInCurrencyForAccount,
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectTokensWithBalanceForAccount
} from 'store/balance/slice'
import { selectActiveAccount } from 'store/account/slice'
import { ActivityIndicator } from 'components/ActivityIndicator'
import PriceChangeIndicator from 'screens/watchlist/components/PriceChangeIndicator'
import { Icons, Text, useTheme, View } from '@avalabs/k2-mobile'
import { useTokenPortfolioPriceChange } from 'hooks/balance/useTokenPortfolioPriceChange'
import { Tooltip } from 'components/Tooltip'
import { Space } from 'components/Space'
import { RootState } from 'store'
import { selectTokenVisibility } from 'store/portfolio/slice'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { PortfolioHeaderLoader } from './Loaders/PortfolioHeaderLoader'

function PortfolioHeader(): JSX.Element {
  const {
    theme: { colors }
  } = useTheme()
  const context = useApplicationContext()
  const activeAccount = useSelector(selectActiveAccount)
  const isBalanceLoading = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const balanceTotalInCurrency = useSelector(
    selectBalanceTotalInCurrencyForAccount(
      activeAccount?.index ?? 0,
      tokenVisibility
    )
  )
  const balanceAccurate = useSelector(
    selectBalanceForAccountIsAccurate(activeAccount?.index ?? 0)
  )
  const { selectedCurrency, currencyFormatter } = context.appHook
  const currencyBalance =
    !balanceAccurate && balanceTotalInCurrency === 0
      ? UNKNOWN_AMOUNT
      : currencyFormatter(balanceTotalInCurrency)

  const tokens = useSelector((state: RootState) =>
    selectTokensWithBalanceForAccount(state, activeAccount?.index)
  )
  const { tokenPortfolioPriceChange } = useTokenPortfolioPriceChange(tokens)
  const [contentHeight, setContentHeight] = useState(0)

  const renderContent = (): JSX.Element => {
    if (isBalanceLoading || !activeAccount) return <PortfolioHeaderLoader />

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
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            height: 44
          }}>
          {!balanceAccurate && (
            <>
              <Tooltip
                content={
                  'The prices of some tokens are missing. The balance might not be accurate currently.'
                }
                position={'top'}
                style={{ width: 250 }}
                isLabelPopable>
                <Icons.Alert.IconWarningAmber
                  color={colors.$warningLight}
                  width={24}
                  height={24}
                  style={{ alignSelf: 'center' }}
                />
              </Tooltip>
              <Space x={6} />
            </>
          )}
          <Text variant="heading3" testID="portfolio_balance__total">
            {currencyBalance.replace(selectedCurrency, '')}
          </Text>
          <Text
            variant="body1"
            sx={{
              paddingBottom: 4,
              marginLeft: 4,
              color: '$neutral400',
              alignSelf: 'flex-end'
            }}>
            {selectedCurrency}
          </Text>
        </View>
        {balanceAccurate && (
          <PriceChangeIndicator
            price={tokenPortfolioPriceChange}
            textVariant="buttonSmall"
          />
        )}
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

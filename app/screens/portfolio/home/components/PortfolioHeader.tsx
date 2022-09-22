import React, { FC, memo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { useSelector } from 'react-redux'
import {
  selectBalanceTotalInCurrencyForAccount,
  selectIsLoadingBalances,
  selectIsRefetchingBalances
} from 'store/balance'
import { selectActiveAccount } from 'store/account'
import { ActivityIndicator } from 'components/ActivityIndicator'
import { PortfolioHeaderLoader } from './Loaders/PortfolioHeaderLoader'

function PortfolioHeaderContainer() {
  const context = useApplicationContext()
  const activeAccount = useSelector(selectActiveAccount)
  const isLoadingBalance = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)
  const balanceTotalInCurrency = useSelector(
    selectBalanceTotalInCurrencyForAccount(activeAccount?.index ?? 0)
  )
  const { selectedCurrency, currencyFormatter } = context.appHook
  const currencyBalance = currencyFormatter(balanceTotalInCurrency)

  return (
    <PortfolioHeader
      balanceTotalInCurrency={currencyBalance}
      isBalanceLoading={isLoadingBalance}
      isBalanceRefreshing={isRefetchingBalance}
      currencyCode={selectedCurrency}
    />
  )
}

interface PortfolioHeaderProps {
  balanceTotalInCurrency: string
  isBalanceLoading: boolean
  isBalanceRefreshing: boolean
  currencyCode: string
}

const PortfolioHeader: FC<PortfolioHeaderProps> = memo(
  ({
    balanceTotalInCurrency = '0',
    isBalanceLoading = false,
    isBalanceRefreshing = false,
    currencyCode
  }) => {
    const { theme } = useApplicationContext()

    const renderContent = () => {
      if (isBalanceLoading) return <PortfolioHeaderLoader />

      if (isBalanceRefreshing)
        return (
          <ActivityIndicator style={{ alignSelf: 'center' }} size="small" />
        )

      return (
        <>
          <AvaText.LargeTitleBold>
            {balanceTotalInCurrency.replace(currencyCode, '')}
          </AvaText.LargeTitleBold>
          <AvaText.Heading3
            textStyle={{
              paddingBottom: 4,
              marginLeft: 4,
              color: theme.colorText2
            }}>
            {currencyCode}
          </AvaText.Heading3>
        </>
      )
    }

    return (
      <View pointerEvents="box-none">
        <View style={styles.balanceContainer}>{renderContent()}</View>
        <Space y={18} />
      </View>
    )
  }
)

const styles = StyleSheet.create({
  copyAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    width: 150,
    alignSelf: 'center'
  },
  balanceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexDirection: 'row',
    height: 44,
    marginTop: 25
  }
})

export default PortfolioHeaderContainer

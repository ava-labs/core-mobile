import React, {FC, memo} from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {useApplicationContext} from 'contexts/ApplicationContext'
import {usePortfolio} from 'screens/portfolio/usePortfolio'
import AvaText from 'components/AvaText'
import {Space} from 'components/Space'
import TokenAddress from 'components/TokenAddress'

// experimenting with container pattern and stable props to try to reduce re-renders
function PortfolioHeaderContainer() {
  const context = useApplicationContext()
  const {balanceTotalInUSD, isBalanceLoading, addressC} = usePortfolio()
  const {selectedCurrency, currencyFormatter} = context.appHook
  const currencyBalance = currencyFormatter(Number(balanceTotalInUSD))

  return (
    <PortfolioHeader
      balanceTotalUSD={currencyBalance}
      isBalanceLoading={isBalanceLoading}
      currencyCode={selectedCurrency}
      addressC={addressC}
    />
  )
}

interface PortfolioHeaderProps {
  balanceTotalUSD: string
  isBalanceLoading: boolean
  currencyCode: string
  addressC?: string
}

const PortfolioHeader: FC<PortfolioHeaderProps> = memo(
  ({addressC, balanceTotalUSD = 0, isBalanceLoading = false, currencyCode}) => {
    return (
      <View pointerEvents="box-none">
        <View style={styles.copyAddressContainer}>
          <TokenAddress address={addressC ?? ''} textType={'Body'} />
        </View>
        <View style={styles.balanceContainer}>
          {isBalanceLoading && (
            <ActivityIndicator style={{alignSelf: 'center'}} size="small" />
          )}
          <AvaText.LargeTitleBold>{balanceTotalUSD}</AvaText.LargeTitleBold>
          <AvaText.Heading3 textStyle={{paddingBottom: 4, marginLeft: 4}}>
            {currencyCode}
          </AvaText.Heading3>
        </View>
        <Space y={18} />
      </View>
    )
  }
)

const styles = StyleSheet.create({
  container: {
    alignItems: 'center'
  },
  copyAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    width: 150,
    alignSelf: 'center'
  },
  balanceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 25
  }
})

export default PortfolioHeaderContainer

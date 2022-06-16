import React, { FC, memo } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import TokenAddress from 'components/TokenAddress'
import { useSelector } from 'react-redux'
import {
  selectBalanceTotalInUSD,
  selectIsLoadingBalances,
  selectIsRefetchingBalances
} from 'store/balance'
import { NetworkVMType } from '@avalabs/chains-sdk'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'

function PortfolioHeaderContainer() {
  const context = useApplicationContext()
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const isLoadingBalance = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)
  const balanceTotalInUSD = useSelector(
    selectBalanceTotalInUSD(activeAccount?.index ?? 0)
  )
  const { selectedCurrency, currencyFormatter } = context.appHook
  const currencyBalance = currencyFormatter(balanceTotalInUSD)
  const address =
    activeNetwork.vmName === NetworkVMType.BITCOIN
      ? activeAccount?.addressBtc
      : activeAccount?.address

  return (
    <PortfolioHeader
      balanceTotalUSD={currencyBalance}
      isBalanceLoading={isLoadingBalance || isRefetchingBalance}
      currencyCode={selectedCurrency}
      address={address}
    />
  )
}

interface PortfolioHeaderProps {
  balanceTotalUSD: string
  isBalanceLoading: boolean
  currencyCode: string
  address?: string
}

const PortfolioHeader: FC<PortfolioHeaderProps> = memo(
  ({
    address,
    balanceTotalUSD = 0,
    isBalanceLoading = false,
    currencyCode
  }) => {
    return (
      <View pointerEvents="box-none">
        <View style={styles.copyAddressContainer}>
          <TokenAddress address={address ?? ''} textType={'Body'} />
        </View>
        <View style={styles.balanceContainer}>
          {isBalanceLoading ? (
            <ActivityIndicator style={{ alignSelf: 'center' }} size="small" />
          ) : (
            <>
              <AvaText.LargeTitleBold>{balanceTotalUSD}</AvaText.LargeTitleBold>
              <AvaText.Heading3 textStyle={{ paddingBottom: 4, marginLeft: 4 }}>
                {currencyCode}
              </AvaText.Heading3>
            </>
          )}
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
    height: 44,
    marginTop: 25
  }
})

export default PortfolioHeaderContainer

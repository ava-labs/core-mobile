import { BalanceHeader, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useLocalSearchParams } from 'expo-router'
import { AccountAddresses } from 'features/accountSettings/components/accountAddresses'
import { AccountButtons } from 'features/accountSettings/components/AccountButtons'
import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectAccountByIndex } from 'store/account'
import {
  selectBalanceForAccountIsAccurate,
  selectBalanceTotalInCurrencyForAccount,
  selectIsLoadingBalances,
  selectIsRefetchingBalances
} from 'store/balance'
import { selectTokenVisibility } from 'store/portfolio'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'

const AccountScreen = (): JSX.Element => {
  const { accountIndex } = useLocalSearchParams<{ accountIndex: string }>()
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)

  const accountIndexNumber = isNaN(Number(accountIndex))
    ? 0
    : Number(accountIndex)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const account = useSelector(selectAccountByIndex(accountIndexNumber))
  const isBalanceLoading = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const balanceTotalInCurrency = useSelector(
    selectBalanceTotalInCurrencyForAccount(account?.index ?? 0, tokenVisibility)
  )
  const isLoading = isBalanceLoading || isRefetchingBalance
  const balanceAccurate = useSelector(
    selectBalanceForAccountIsAccurate(account?.index ?? 0)
  )
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { formatCurrency } = useFormatCurrency()
  const formattedBalance = useMemo(() => {
    return !balanceAccurate || balanceTotalInCurrency === 0
      ? UNKNOWN_AMOUNT
      : formatCurrency({
          amount: balanceTotalInCurrency,
          withoutCurrencySuffix: true
        })
  }, [balanceAccurate, balanceTotalInCurrency, formatCurrency])

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <BalanceHeader
        accountName={account?.name ?? ''}
        formattedBalance={formattedBalance}
        currency={selectedCurrency}
        errorMessage={
          balanceAccurate ? undefined : 'Unable to load all balances'
        }
        isLoading={isLoading}
        isPrivacyModeEnabled={isPrivacyModeEnabled}
        isDeveloperModeEnabled={isDeveloperMode}
      />
    )
  }, [
    account?.name,
    formattedBalance,
    selectedCurrency,
    balanceAccurate,
    isLoading,
    isPrivacyModeEnabled,
    isDeveloperMode
  ])

  const renderFooter = useCallback(() => {
    return <AccountButtons accountIndex={account?.index ?? 0} />
  }, [account?.index])

  if (account === undefined) {
    return <></>
  }

  return (
    <ScrollScreen
      renderHeader={renderHeader}
      renderFooter={renderFooter}
      isModal
      navigationTitle={account?.name ?? ''}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ gap: 12, marginTop: 24 }}>
        <AccountAddresses account={account} />
        {/* <WalletInfo showPrivateKey={handleShowPrivateKey} /> */}
      </View>
    </ScrollScreen>
  )
}

export default AccountScreen

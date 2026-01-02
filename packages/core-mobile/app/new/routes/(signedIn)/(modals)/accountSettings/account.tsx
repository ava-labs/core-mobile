import { BalanceHeader, showAlert, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AccountAddresses } from 'features/accountSettings/components/accountAddresses'
import { AccountButtons } from 'features/accountSettings/components/AccountButtons'
import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectAccountById } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { WalletInfo } from 'features/accountSettings/components/WalletInfo'
import { selectWalletById } from 'store/wallet/slice'
import { CoreAccountType } from '@avalabs/types'
import { WalletType } from 'services/wallet/types'
import { useAccountBalanceSummary } from 'features/portfolio/hooks/useAccountBalanceSummary'

const AccountScreen = (): JSX.Element => {
  const router = useRouter()
  const { accountId } = useLocalSearchParams<{ accountId: string }>()
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const account = useSelector(selectAccountById(accountId ?? ''))
  const wallet = useSelector(selectWalletById(account?.walletId ?? ''))

  const {
    totalBalanceInCurrency: balanceTotalInCurrency,
    isBalanceLoaded,
    isLoading: isLoadingBalances,
    isRefetching: isRefetchingBalance,
    isAllBalancesInaccurate: allBalancesInaccurate
  } = useAccountBalanceSummary(account, { refetchInterval: false })

  const isLoading = isLoadingBalances || isRefetchingBalance || !isBalanceLoaded
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { formatCurrency } = useFormatCurrency()
  const formattedBalance = useMemo(() => {
    // CP-10570: Balances should never show $0.00
    return allBalancesInaccurate || balanceTotalInCurrency === 0
      ? UNKNOWN_AMOUNT
      : formatCurrency({
        amount: balanceTotalInCurrency,
        withoutCurrencySuffix: true
      })
  }, [allBalancesInaccurate, balanceTotalInCurrency, formatCurrency])

  const isPrivateKeyAvailable = useMemo(
    () =>
      account?.type === CoreAccountType.IMPORTED ||
      (account?.type === CoreAccountType.PRIMARY &&
        wallet?.type === WalletType.MNEMONIC),
    [account?.type, wallet?.type]
  )

  const handleErrorPress = useCallback(() => {
    showAlert({
      title: 'Unable to load balances',
      description:
        'This total may be incomplete since Core was unable to load all of the balances across each network.',
      buttons: [{ text: 'Dismiss' }]
    })
  }, [])

  const handleShowPrivateKey = (): void => {
    if (!account) {
      return
    }
    router.push({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/accountSettings/verifyPinForPrivateKey',
      params: {
        walletId: account.walletId,
        accountIndex: account.index.toString()
      }
    })
  }

  if (account === undefined || wallet === undefined) {
    return <></>
  }

  const renderHeader = (): JSX.Element => {
    return (
      <BalanceHeader
        testID="settings"
        accountName={account.name}
        formattedBalance={formattedBalance}
        currency={selectedCurrency}
        errorMessage={
          allBalancesInaccurate ? 'Unable to load all balances' : undefined
        }
        onErrorPress={handleErrorPress}
        isLoading={isLoading}
        isPrivacyModeEnabled={isPrivacyModeEnabled}
        isDeveloperModeEnabled={isDeveloperMode}
        hideExpand
      />
    )
  }

  const renderFooter = (): JSX.Element => {
    return <AccountButtons accountId={account.id} walletType={wallet.type} />
  }

  return (
    <ScrollScreen
      renderHeader={renderHeader}
      renderFooter={renderFooter}
      isModal
      navigationTitle={account?.name ?? ''}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ gap: 16, marginTop: 24 }}>
        <AccountAddresses account={account} />
        <WalletInfo
          onShowPrivateKey={
            isPrivateKeyAvailable ? handleShowPrivateKey : undefined
          }
          account={account}
          wallet={wallet}
        />
      </View>
    </ScrollScreen>
  )
}

export default AccountScreen

import { BalanceHeader, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useBalanceForAccount } from 'common/contexts/useBalanceForAccount'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { AccountAddresses } from 'features/accountSettings/components/accountAddresses'
import { AccountButtons } from 'features/accountSettings/components/AccountButtons'
import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectAccountById } from 'store/account'
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
import { WalletInfo } from 'features/accountSettings/components/WalletInfo'
import { selectWalletById } from 'store/wallet/slice'
import { CoreAccountType } from '@avalabs/types'
import { WalletType } from 'services/wallet/types'

const AccountScreen = (): JSX.Element => {
  const router = useRouter()
  const { accountId } = useLocalSearchParams<{ accountId: string }>()
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const account = useSelector(selectAccountById(accountId ?? ''))
  const wallet = useSelector(selectWalletById(account?.walletId ?? ''))
  const isBalanceLoading = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const balanceTotalInCurrency = useSelector(
    selectBalanceTotalInCurrencyForAccount(accountId, tokenVisibility)
  )
  const isLoading = isBalanceLoading || isRefetchingBalance
  const balanceAccurate = useSelector(
    selectBalanceForAccountIsAccurate(accountId)
  )
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { formatCurrency } = useFormatCurrency()
  const formattedBalance = useMemo(() => {
    // CP-10570: Balances should never show $0.00
    return !balanceAccurate || balanceTotalInCurrency === 0
      ? UNKNOWN_AMOUNT
      : formatCurrency({
          amount: balanceTotalInCurrency,
          withoutCurrencySuffix: true
        })
  }, [balanceAccurate, balanceTotalInCurrency, formatCurrency])

  const { fetchBalance } = useBalanceForAccount(account?.id ?? '')

  const isPrivateKeyAvailable = useMemo(
    () =>
      account?.type === CoreAccountType.IMPORTED ||
      (account?.type === CoreAccountType.PRIMARY &&
        wallet?.type === WalletType.MNEMONIC),
    [account?.type, wallet?.type]
  )

  useFocusEffect(
    useCallback(() => {
      fetchBalance()
    }, [fetchBalance])
  )

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
        accountName={account.name}
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

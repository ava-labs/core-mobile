import { useSelector } from 'react-redux'
import { selectAccountById } from 'store/account'
import { selectActiveWallet } from 'store/wallet/slice'
import { useWalletBalances } from './useWalletBalances'
import { useBalanceTotalInCurrencyForAccount } from './useBalanceTotalInCurrencyForAccount'

/**
 * Returns the total balance and loading state for a given account.
 *
 * Behavior:
 * - For the active account, this hook uses data from `useAccountBalances`,
 *   which fetches balance updates more frequently.
 * - For non-active accounts, it falls back to data from `useWalletBalances`,
 *   which loads once on mount and reuses cached wallet-level data.
 */
export const useBalanceInCurrencyForAccount = (
  accountId: string
): {
  isLoadingBalance: boolean
  balance: number
} => {
  const activeWallet = useSelector(selectActiveWallet)
  const account = useSelector(selectAccountById(accountId))

  const { data: walletBalances } = useWalletBalances(activeWallet)

  const balanceTotalInCurrency = useBalanceTotalInCurrencyForAccount({
    account,
    // TODO: fix type mismatch after fully migrating to the new backend balance types
    // @ts-ignore
    sourceData: walletBalances[accountId]
  })

  const isFetchingBalance = walletBalances?.[accountId] === undefined

  return {
    balance: balanceTotalInCurrency,
    isLoadingBalance: isFetchingBalance
  }
}

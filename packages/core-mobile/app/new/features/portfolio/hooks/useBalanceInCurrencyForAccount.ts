import { useSelector } from 'react-redux'
import { selectAccountById } from 'store/account'
import { useAllBalances } from './useAllBalances'
import { useBalanceTotalInCurrencyForAccount } from './useBalanceTotalInCurrencyForAccount'

/**
 * Returns the total balance and loading state for a given account.
 *
 * Behavior:
 * - For the active account, this hook uses data from `useAccountBalances`,
 *   which fetches balance updates more frequently.
 * - For non-active accounts, it falls back to data from `useAllBalances`,
 *   which loads once on mount and reuses cached wallet-level data.
 */
export const useBalanceInCurrencyForAccount = (
  accountId: string
): {
  isLoadingBalance: boolean
  balance: number
} => {
  const account = useSelector(selectAccountById(accountId))
  const { data: balances, isLoading } = useAllBalances()
  const balanceTotalInCurrency = useBalanceTotalInCurrencyForAccount({
    account,
    // TODO: fix type mismatch after fully migrating to the new backend balance types
    // @ts-ignore
    sourceData: balances[accountId]
  })

  return {
    balance: balanceTotalInCurrency,
    isLoadingBalance: isLoading
  }
}

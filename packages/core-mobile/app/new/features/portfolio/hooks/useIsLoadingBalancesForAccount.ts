import { Account } from 'store/account'
import { useAccountBalances } from './useAccountBalances'

/**
 * Returns true if balances are currently loading for the given account.
 */
export const useIsLoadingBalancesForAccount = (account?: Account): boolean => {
  const { isLoading } = useAccountBalances(account)

  return isLoading
}

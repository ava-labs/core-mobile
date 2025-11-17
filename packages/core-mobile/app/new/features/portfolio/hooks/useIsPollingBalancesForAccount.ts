import { Account } from 'store/account'
import { useAccountBalances } from './useAccountBalances'

/**
 * Returns true if balances are currently polling for the given account.
 */
export function useIsPollingBalancesForAccount(account?: Account): boolean {
  const { isFetching } = useAccountBalances(account)

  return isFetching
}

import { Account } from 'store/account'
import * as store from '../store'

/**
 * Returns true if any balance query is manually refetching
 * after having loaded successfully for the given account.
 */
export function useIsRefetchingBalancesForAccount(account?: Account): boolean {
  const [isRefetchingAccountBalances] = store.useIsRefetchingAccountBalances()
  return isRefetchingAccountBalances[account?.id ?? ''] ?? false
}

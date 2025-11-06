import { selectImportedAccounts } from 'store/account'
import { useSelector } from 'react-redux'
import * as store from '../store'

/**
 * Returns true if any balance query is manually refetching
 * after having loaded successfully for the imported accounts.
 */
export function useIsRefetchingBalancesForImportedAccounts(): boolean {
  const accounts = useSelector(selectImportedAccounts)
  const [isRefetchingBalances] = store.useIsRefetchingImportedAccountBalances()
  return accounts.some(account => isRefetchingBalances[account.id ?? ''])
}

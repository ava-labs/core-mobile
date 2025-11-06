import { IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID } from 'features/accountSettings/consts'
import * as store from '../store'

/**
 * Returns true if any XP balance query is manually refetching
 * after having loaded successfully for the imported accounts.
 */
export function useIsRefetchingXpBalancesForImportedAccounts(): boolean {
  const [isRefetchingBalances] =
    store.useIsRefetchingImportedAccountXpBalances()
  return isRefetchingBalances[IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID] ?? false
}

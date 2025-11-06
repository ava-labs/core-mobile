import { useIsRefetchingBalancesForImportedAccounts } from './useIsRefetchingBalancesForImportedAccounts'
import { useIsRefetchingXpBalancesForImportedAccounts } from './useIsRefetchingXpBalancesForImportedAccounts'

/**
 * Returns true if any balance query is manually refetching
 * after having loaded successfully for the imported wallets.
 */
export function useIsRefetchingBalancesForImportedWallet(): boolean {
  const isRefetchingBalances = useIsRefetchingBalancesForImportedAccounts()
  const isRefetchingXpBalances = useIsRefetchingXpBalancesForImportedAccounts()
  return isRefetchingBalances || isRefetchingXpBalances
}

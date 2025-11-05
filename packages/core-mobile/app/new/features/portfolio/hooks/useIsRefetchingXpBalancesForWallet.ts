import { Wallet } from 'store/wallet/types'
import * as store from '../store'

/**
 * Returns true if any XP balance query is manually refetching
 * after having loaded successfully for the given wallet.
 */
export function useIsRefetchingXpBalancesForWallet(wallet?: Wallet): boolean {
  const [isRefetchingWalletXpBalances] = store.useIsRefetchingWalletXpBalances()
  return isRefetchingWalletXpBalances[wallet?.id ?? ''] ?? false
}

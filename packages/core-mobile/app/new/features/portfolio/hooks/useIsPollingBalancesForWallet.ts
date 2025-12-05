import { Wallet } from 'store/wallet/types'
import { useWalletBalances } from './useWalletBalances'

/**
 * Returns true if balances are currently polling for the given wallet.
 */
export function useIsPollingBalancesForWallet(wallet?: Wallet): boolean {
  const { isFetching } = useWalletBalances(wallet)

  return isFetching
}

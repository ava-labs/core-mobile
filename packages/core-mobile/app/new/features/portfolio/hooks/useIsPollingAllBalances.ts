import { useAllBalances } from './useAllBalances'

/**
 * Returns true if balances are currently polling for the given wallet.
 */
export function useIsPollingAllBalances(): boolean {
  const { isFetching } = useAllBalances()

  return isFetching
}

import { Account } from 'store/account'
import { useAccountBalances } from './useAccountBalances'

/**
 * Returns true if balances are currently loading for the given account.
 * If a chainId is provided, it will return true if the balances are currently
 * loading for that network (no data yet for that network)
 */
export const useIsLoadingBalancesForAccount = (
  account?: Account,
  chainId?: number
): boolean => {
  const { data, isLoading } = useAccountBalances(account)

  if (!chainId) return isLoading

  const balanceForNetwork = data.find(balance => balance.chainId === chainId)

  return !balanceForNetwork
}

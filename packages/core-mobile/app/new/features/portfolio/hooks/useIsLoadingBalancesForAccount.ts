import { useMemo } from 'react'
import { Account } from 'store/account'
import { useAccountBalances } from './useAccountBalances'

/**
 * Returns true if balances are currently loading for the given account.
 */
export const useIsLoadingBalancesForAccount = (account?: Account): boolean => {
  const { results: accountResults } = useAccountBalances(account, {
    enabled: false
  })

  return useMemo(() => {
    return accountResults.some(r => r.isLoading)
  }, [accountResults])
}

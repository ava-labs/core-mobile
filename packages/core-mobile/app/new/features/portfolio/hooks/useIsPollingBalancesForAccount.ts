import { useMemo } from 'react'
import { Account } from 'store/account'
import { useAccountBalances } from './useAccountBalances'

/**
 * Returns true if any balance query (EVM/BTC/SOL/XP) is currently polling/fetching for the given account.
 */
export function useIsPollingBalancesForAccount(account?: Account): boolean {
  const { results: accountResults } = useAccountBalances(account, {
    enabled: false
  })

  return useMemo(() => {
    return accountResults.some(r => r.fetchStatus === 'fetching')
  }, [accountResults])
}

import { useMemo } from 'react'
import { Account } from 'store/account'
import { useAccountBalances } from './useAccountBalances'

/**
 * Returns true if at least one network balance has been loaded for the given account.
 */
export function useIsBalanceLoadedForAccount(account?: Account): boolean {
  const { results } = useAccountBalances(account, { enabled: false })

  return useMemo(() => {
    if (!account) return false

    // Any query that has successfully fetched data (even partial)
    return results.some(r => r.data !== undefined)
  }, [results, account])
}

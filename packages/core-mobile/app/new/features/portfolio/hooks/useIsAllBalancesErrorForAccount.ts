import { useMemo } from 'react'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'
import { Account } from 'store/account/types'

/**
 * Returns true if all balance queries for the account
 * ended with an error or have an error object.
 */
export function useIsAllBalancesErrorForAccount(account?: Account): boolean {
  const { results } = useAccountBalances(account, { enabled: false })

  return useMemo(() => {
    if (!account) return false
    if (results.length === 0) return false

    return results.every(r => r.error != null)
  }, [account, results])
}

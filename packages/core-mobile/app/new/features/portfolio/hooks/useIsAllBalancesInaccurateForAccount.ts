import { useMemo } from 'react'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'
import { Account } from 'store/account/types'

/**
 * Returns true if all queried network balances for the given account
 * are marked inaccurate (`dataAccurate === false`)
 */
export function useIsAllBalancesInaccurateForAccount(
  account?: Account
): boolean {
  const { results } = useAccountBalances(account, { enabled: false })

  return useMemo(() => {
    if (!account) return false

    if (results.length === 0) return false

    return results.every(r => r.data?.dataAccurate === false)
  }, [account, results])
}

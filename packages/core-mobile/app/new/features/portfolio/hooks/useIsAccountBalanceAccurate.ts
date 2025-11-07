import { useMemo } from 'react'
import { Account } from 'store/account'
import { useAccountBalances } from './useAccountBalances'

/**
 * Returns whether all balances for the given account are accurate (no errors).
 */
export function useIsAccountBalanceAccurate(account?: Account): boolean {
  const { results } = useAccountBalances(account, { enabled: false })

  return useMemo(() => {
    if (!account) return false

    // if no balances fetched yet → false
    if (results.length === 0) return false

    // if any network dataAccurate is false → false
    const anyInaccurate = results.some(r => r.data?.dataAccurate === false)
    return !anyInaccurate
  }, [account, results])
}

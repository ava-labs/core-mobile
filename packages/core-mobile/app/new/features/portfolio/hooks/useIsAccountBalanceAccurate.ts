import { useMemo } from 'react'
import { Account } from 'store/account'
import { useAccountBalances } from './useAccountBalances'

/**
 * Returns whether all balances for the given account are accurate (no errors).
 */
export function useIsAccountBalanceAccurate(account?: Account): boolean {
  const { data } = useAccountBalances(account, { enabled: false })

  return useMemo(() => {
    if (!account || data.length === 0) return false

    // if any network dataAccurate is false → false
    const anyInaccurate = data.some(balance => balance.dataAccurate === false)
    return !anyInaccurate
  }, [account, data])
}

import { useMemo } from 'react'
import { Account } from 'store/account'
import { useAccountBalances } from './useAccountBalances'

/**
 * Returns whether all balances for the given account are accurate
 */
export function useIsAccountBalanceAccurate(account?: Account): boolean {
  const { data } = useAccountBalances(account)

  return useMemo(() => {
    if (!account || data.length === 0) return false

    // check if every network dataAccurate → true
    return data.every(balance => balance.dataAccurate)
  }, [account, data])
}

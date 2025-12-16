import { useMemo } from 'react'
import { Account } from 'store/account'
import { useUserBalances } from './useUserBalances'

/**
 * Returns true if balance for every account is accurate (dataAccurate === true).
 */
export function useIsAccountBalanceAccurate(account: Account): boolean {
  const { data } = useUserBalances()

  return useMemo(() => {
    const accountBalances = data[account.id]
    if (!accountBalances || accountBalances.length === 0) return false

    // Check if every balance has dataAccurate → true
    return accountBalances.every(balance => balance.dataAccurate)
  }, [data, account])
}

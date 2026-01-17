import { useMemo } from 'react'
import { useAllBalances } from './useAllBalances'

/**
 * Returns true if balance for every account is accurate (dataAccurate === true).
 */
export function useIsAllBalancesAccurate(): boolean {
  const { data } = useAllBalances()

  return useMemo(() => {
    const accountsArray = Object.values(data).flat()
    if (accountsArray.length === 0) return false

    // Check if every balance has dataAccurate → true
    return accountsArray.every(balance => balance.dataAccurate)
  }, [data])
}

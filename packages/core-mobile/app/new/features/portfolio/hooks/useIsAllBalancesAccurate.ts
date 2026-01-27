import { useMemo } from 'react'
import { useAllBalances } from './useAllBalances'

/**
 * Returns true if balance for every account is accurate (dataAccurate === true).
 */
export function useIsAllBalancesAccurate(): boolean {
  const { data } = useAllBalances()

  return useMemo(() => {
    if (!data) return false
    const accountBalances = Object.values(data).flat()

    // Check if every balance has dataAccurate → true
    return accountBalances.every(balance => balance.dataAccurate)
  }, [data])
}

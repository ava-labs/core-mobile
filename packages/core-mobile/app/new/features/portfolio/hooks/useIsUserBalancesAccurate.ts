import { useMemo } from 'react'
import { useUserBalances } from './useUserBalances'

/**
 * Returns true if balance for every account is accurate (dataAccurate === true).
 */
export function useIsUserBalanceAccurate(): boolean {
  const { data } = useUserBalances()

  return useMemo(() => {
    const accountsArray = Object.values(data).flat()
    if (accountsArray.length === 0) return false

    // Check if every balance has dataAccurate → true
    return accountsArray.every(balance => balance.dataAccurate)
  }, [data])
}

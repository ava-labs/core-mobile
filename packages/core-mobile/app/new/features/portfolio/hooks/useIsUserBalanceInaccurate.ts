import { useMemo } from 'react'
import { useUserBalances } from './useUserBalances'

/**
 * Returns true if any balance for any account is inaccurate (dataAccurate === false).
 */
export function useIsUserBalanceInaccurate(): boolean {
  const { data } = useUserBalances()

  return useMemo(() => {
    const allBalances = Object.values(data).flat()

    if (allBalances.length === 0) return true

    // Check if any balance has dataAccurate === false
    return allBalances.some(balance => balance.dataAccurate === false)
  }, [data])
}

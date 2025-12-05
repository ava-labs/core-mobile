import { useMemo } from 'react'
import { useUserBalances } from './useUserBalances'

/**
 * Returns true if any balance for any account is inaccurate (dataAccurate === false).
 */
export function useIsUserBalanceInaccurate(): boolean {
  const { data } = useUserBalances()

  const accountsArray = useMemo(() => Object.keys(data), [data])

  return useMemo(() => {
    if (accountsArray.length === 0) return false
    if (!data) return false

    // Check if any account has any balance with dataAccurate === false
    return accountsArray.some(account => {
      const accountBalances = data[account]
      if (!accountBalances || accountBalances.length === 0) return false

      return accountBalances.some(balance => balance.dataAccurate === false)
    })
  }, [accountsArray, data])
}

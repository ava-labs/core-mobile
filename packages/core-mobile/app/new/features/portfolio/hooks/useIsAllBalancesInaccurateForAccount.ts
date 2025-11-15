import { useMemo } from 'react'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'
import { Account } from 'store/account/types'

/**
 * Returns true if all balances for the given account
 * are marked inaccurate (`dataAccurate === false`)
 */
export function useIsAllBalancesInaccurateForAccount(
  account?: Account
): boolean {
  const { data } = useAccountBalances(account)

  return useMemo(() => {
    if (!account || data.length === 0) return false

    return data.every(balance => balance.dataAccurate === false)
  }, [account, data])
}

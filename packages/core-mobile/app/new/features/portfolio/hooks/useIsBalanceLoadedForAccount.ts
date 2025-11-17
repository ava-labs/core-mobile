import { useMemo } from 'react'
import { Account } from 'store/account'
import { useAccountBalances } from './useAccountBalances'

/**
 * Returns true if at least one network balance has been loaded for the given account.
 */
export function useIsBalanceLoadedForAccount(account?: Account): boolean {
  const { data } = useAccountBalances(account)

  return useMemo(() => {
    if (!account || !data) return false

    return data.length > 0
  }, [data, account])
}

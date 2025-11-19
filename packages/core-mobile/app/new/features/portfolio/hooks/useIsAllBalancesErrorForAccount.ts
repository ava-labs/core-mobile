import { useMemo } from 'react'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'
import { Account } from 'store/account/types'

/**
 * Returns true if all balances for the account
 * ended with an error.
 */
export function useIsAllBalancesErrorForAccount(account?: Account): boolean {
  const { data } = useAccountBalances(account)

  return useMemo(() => {
    if (!account || data.length === 0) return false

    return data.every(balance => balance.error != null)
  }, [account, data])
}

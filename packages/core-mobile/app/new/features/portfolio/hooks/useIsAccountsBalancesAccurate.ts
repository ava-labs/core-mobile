import { useMemo } from 'react'
import { Account } from 'store/account'
import { useAccountsBalances } from './useAccountsBalances'

/**
 * Returns true if balance for every account is accurate (dataAccurate === true).
 */
export function useIsAccountsBalanceAccurate(accounts: Account[]): boolean {
  const { data } = useAccountsBalances(accounts)

  return useMemo(() => {
    const accountsArray = Object.values(data).flat()
    if (accountsArray.length === 0) return false

    // Check if every balance has dataAccurate → true
    return accountsArray.every(balance => balance.dataAccurate)
  }, [data])
}

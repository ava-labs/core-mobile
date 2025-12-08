import { useMemo } from 'react'
import { Account } from 'store/account'
import { useAccountsBalances } from './useAccountsBalances'

/**
 * Returns true if any balance for any account is inaccurate (dataAccurate === false).
 */
export function useIsAccountsBalanceInaccurate(accounts: Account[]): boolean {
  const { data } = useAccountsBalances(accounts)

  return useMemo(() => {
    if (accounts.length === 0) return true

    // Check if any balance has dataAccurate === false
    return accounts.some(account =>
      data[account.id]?.some(balance => balance.dataAccurate === false)
    )
  }, [data, accounts])
}

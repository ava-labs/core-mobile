import { QueryObserverResult } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { NormalizedBalancesForAccount } from 'services/balance/types'
import { selectAccounts } from 'store/account'
import { useAccountsBalances } from './useAccountsBalances'

type AccountId = string
/**
 * Returns whether all balances for all accounts are inaccurate (dataAccurate === false),
 * along with loading states, data, and refetch function.
 */
export function useUserBalances(): {
  data: Record<AccountId, NormalizedBalancesForAccount[]>
  isLoading: boolean
  isFetching: boolean
  refetch: () => Promise<
    QueryObserverResult<
      Record<AccountId, NormalizedBalancesForAccount[]>,
      Error
    >
  >
} {
  const allAccounts = useSelector(selectAccounts)

  return useAccountsBalances(Object.values(allAccounts))
}

import { QueryObserverResult } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { AdjustedNormalizedBalancesForAccount } from 'services/balance/types'
import { selectAccounts } from 'store/account'
import { useAccountsBalances } from './useAccountsBalances'

type AccountId = string
/**
 * Returns whether all balances for all accounts are inaccurate (dataAccurate === false),
 * along with loading states, data, and refetch function.
 */
export function useAllBalances(options?: {
  refetchInterval?: number | false
}): {
  data: Record<AccountId, AdjustedNormalizedBalancesForAccount[]>
  isLoading: boolean
  isFetching: boolean
  refetch: () => Promise<
    QueryObserverResult<
      Record<AccountId, AdjustedNormalizedBalancesForAccount[]>,
      Error
    >
  >
} {
  const allAccounts = useSelector(selectAccounts)

  return useAccountsBalances(Object.values(allAccounts), options)
}

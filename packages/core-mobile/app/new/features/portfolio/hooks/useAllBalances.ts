import { QueryObserverResult } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { AdjustedNormalizedBalancesForAccounts } from 'services/balance/types'
import { selectAccountsArray } from 'store/account'
import { useAccountsBalances } from './useAccountsBalances'

/**
 * Returns whether all balances for all accounts are inaccurate (dataAccurate === false),
 * along with loading states, data, and refetch function.
 */
export function useAllBalances(options?: {
  refetchInterval?: number | false
}): {
  data: AdjustedNormalizedBalancesForAccounts
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<
    QueryObserverResult<AdjustedNormalizedBalancesForAccounts, Error>
  >
} {
  // Use the memoized selector so the array reference is stable between
  // renders.  Object.values(selectAccounts) created a new array every render,
  // which made the useEffect in useAccountsBalances fire on every render,
  // flooding queryClient.setQueryData and causing a render storm / freeze.
  const allAccounts = useSelector(selectAccountsArray)

  return useAccountsBalances(allAccounts, options)
}

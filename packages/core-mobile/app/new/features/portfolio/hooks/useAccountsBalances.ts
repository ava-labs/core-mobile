import {
  QueryObserverResult,
  useQueries,
  UseQueryResult
} from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import BalanceService from 'services/balance/BalanceService'
import { AdjustedNormalizedBalancesForAccount } from 'services/balance/types'
import { Account } from 'store/account'
import { selectEnabledNetworks } from 'store/network/slice'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { balanceKey } from './useAccountBalances'

type AccountId = string

/**
 * Stale time in milliseconds
 */
const staleTime = 30_000

/**
 * Refetch interval in milliseconds:
 * - 30 seconds in dev mode
 * - 5 seconds in prod mode
 */
const refetchInterval = __DEV__ ? 30_000 : 5_000

/**
 * Returns whether all balances for all accounts are inaccurate (dataAccurate === false),
 * along with loading states, data, and refetch function.
 */
export function useAccountsBalances(
  accounts: Account[],
  options?: { refetchInterval?: number }
): {
  data: Record<AccountId, AdjustedNormalizedBalancesForAccount[]>
  isLoading: boolean
  isFetching: boolean
  refetch: () => Promise<
    QueryObserverResult<AdjustedNormalizedBalancesForAccount[], Error>[]
  >
} {
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const currency = useSelector(selectSelectedCurrency)

  const isNotReady = accounts.length === 0 || enabledNetworks.length === 0

  const queryConfigs = useMemo(() => {
    return accounts.map(account => ({
      // eslint-disable-next-line @tanstack/query/exhaustive-deps
      queryKey: balanceKey(account),
      enabled: !isNotReady,
      staleTime,
      refetchInterval: options?.refetchInterval ?? refetchInterval,
      queryFn: () =>
        BalanceService.getBalancesForAccount({
          networks: enabledNetworks,
          account,
          currency: currency.toLowerCase()
        })
    }))
  }, [
    accounts,
    isNotReady,
    options?.refetchInterval,
    enabledNetworks,
    currency
  ])

  const combine = useCallback(
    (
      results: UseQueryResult<AdjustedNormalizedBalancesForAccount[], Error>[]
    ) => {
      return {
        // create record of account id to balances for that account
        data: results.reduce((acc, result) => {
          if (result.isError || !result.data) return acc

          const accountId = result.data[0]?.accountId

          if (!accountId) return acc

          acc[accountId] = result.data
          return acc
        }, {} as Record<AccountId, AdjustedNormalizedBalancesForAccount[]>),
        isLoading: results.some(q => q.isLoading),
        isFetching: results.some(q => q.isFetching),
        refetch: () => Promise.all(results.map(q => q.refetch()))
      }
    },
    []
  )

  const { data, isLoading, isFetching, refetch } = useQueries({
    queries: queryConfigs,
    combine
  })

  return { data, isLoading, isFetching, refetch }
}

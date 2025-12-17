import {
  QueryObserverResult,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import BalanceService from 'services/balance/BalanceService'
import { AdjustedNormalizedBalancesForAccount } from 'services/balance/types'
import { Account } from 'store/account'
import { selectEnabledNetworks } from 'store/network/slice'
import { selectSelectedCurrency } from 'store/settings/currency/slice'

type AccountId = string

/**
 * Stale time in milliseconds
 */
const staleTime = 30_000

/**
 * Refetch interval in milliseconds:
 * - 30 seconds
 */
const refetchInterval = 5_000

export const balancesKey = (accounts: Account[] | undefined) =>
  [
    ReactQueryKeys.ACCOUNTS_BALANCES,
    accounts?.map(a => a.id).join(',')
  ] as const

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
    QueryObserverResult<
      Record<AccountId, AdjustedNormalizedBalancesForAccount[]>,
      Error
    >
  >
} {
  const queryClient = useQueryClient()
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const currency = useSelector(selectSelectedCurrency)

  const isNotReady = accounts.length === 0 || enabledNetworks.length === 0

  const { data, isFetching, refetch } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: balancesKey(accounts),
    enabled: !isNotReady,
    staleTime,
    initialData: () =>
      accounts.reduce((acc, account) => {
        acc[account.id] = []
        return acc
      }, {} as Record<AccountId, AdjustedNormalizedBalancesForAccount[]>),
    refetchInterval: options?.refetchInterval ?? refetchInterval,
    queryFn: () =>
      BalanceService.getBalancesForAccounts({
        networks: enabledNetworks,
        accounts,
        currency: currency.toLowerCase(),
        onBalanceLoaded: balance => {
          queryClient.setQueryData(
            balancesKey(accounts),
            (
              prev:
                | Record<AccountId, AdjustedNormalizedBalancesForAccount[]>
                | undefined
            ) => {
              const previous = prev ?? {}
              const prevForAccount = previous[balance.accountId] ?? []
              const filtered = prevForAccount.filter(
                p => p.chainId !== balance.chainId
              )

              return {
                ...previous,
                [balance.accountId]: [...filtered, balance]
              }
            }
          )
        }
      })
  })

  const isLoading = useMemo(() => {
    // still loading if:
    // - account missing, OR
    // - no data, OR
    // - fewer results than enabled networks
    return (
      accounts.length === 0 ||
      !data ||
      Object.values(data).flat().length === 0 ||
      Object.values(data).flat().length < enabledNetworks.length
    )
  }, [accounts, data, enabledNetworks.length])

  return { data, isLoading, isFetching, refetch }
}

import { QueryObserverResult, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import BalanceService from 'services/balance/BalanceService'
import { NormalizedBalancesForAccount } from 'services/balance/types'
import { Account } from 'store/account'
import { selectAllCustomTokens } from 'store/customToken'
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

/**
 * Returns whether all balances for all accounts are inaccurate (dataAccurate === false),
 * along with loading states, data, and refetch function.
 */
export function useAccountsBalances(
  accounts: Account[],
  options?: { refetchInterval?: number }
): {
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
  const customTokens = useSelector(selectAllCustomTokens)
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const currency = useSelector(selectSelectedCurrency)

  const isNotReady = accounts.length === 0 || enabledNetworks.length === 0

  const { data, isLoading, isFetching, refetch } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.ACCOUNTS_BALANCES,
      accounts.map(a => a.id).join(',')
    ],
    enabled: !isNotReady,
    staleTime,
    refetchInterval: options?.refetchInterval ?? refetchInterval,
    queryFn: () =>
      BalanceService.getBalancesForAccounts({
        networks: enabledNetworks,
        accounts,
        currency: currency.toLowerCase(),
        customTokens
      })
  })

  return { data: data ?? {}, isLoading, isFetching, refetch }
}

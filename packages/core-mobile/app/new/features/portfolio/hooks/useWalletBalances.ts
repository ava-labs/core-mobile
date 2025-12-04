import {
  QueryObserverResult,
  useQueries,
  UseQueryResult
} from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { selectEnabledNetworks } from 'store/network/slice'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { Wallet } from 'store/wallet/types'
import { selectAccountsByWalletId } from 'store/account'
import { RootState } from 'store/types'
import BalanceService from 'services/balance/BalanceService'
import { AdjustedNormalizedBalancesForAccount } from 'services/balance/types'
import { useCallback, useMemo } from 'react'
import { balanceKey } from './useAccountBalances'

type AccountId = string

/**
 * Stale time in milliseconds
 */
const staleTime = 30_000

/**
 * Fetches balances for all accounts within the specified wallet across all enabled networks
 * (C-Chain, X-Chain, P-Chain, EVMs, BTC, SOL, etc.).
 *
 * 🔁 Uses one React Query request per account.
 */
export const useWalletBalances = (
  wallet?: Wallet
): {
  data: Record<AccountId, AdjustedNormalizedBalancesForAccount[]>
  isLoading: boolean
  isFetching: boolean
  refetch: () => Promise<
    QueryObserverResult<AdjustedNormalizedBalancesForAccount[], Error>[]
  >
} => {
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const currency = useSelector(selectSelectedCurrency)

  const accounts = useSelector((state: RootState) =>
    selectAccountsByWalletId(state, wallet?.id ?? '')
  )

  const isNotReady =
    !wallet || accounts.length === 0 || enabledNetworks.length === 0

  const queryConfigs = useMemo(() => {
    return accounts.map(account => ({
      // eslint-disable-next-line @tanstack/query/exhaustive-deps
      queryKey: balanceKey(account),
      enabled: !isNotReady,
      staleTime,
      queryFn: () =>
        BalanceService.getBalancesForAccount({
          networks: enabledNetworks,
          account,
          currency: currency.toLowerCase()
        })
    }))
  }, [accounts, enabledNetworks, currency, isNotReady])

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

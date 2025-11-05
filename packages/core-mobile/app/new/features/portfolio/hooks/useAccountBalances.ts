import { useCallback, useMemo } from 'react'
import {
  QueryObserverResult,
  useQueries,
  useQueryClient
} from '@tanstack/react-query'
import BalanceService from 'services/balance/BalanceService'
import { Network } from '@avalabs/core-chains-sdk'
import { useSelector } from 'react-redux'
import { selectEnabledNetworks } from 'store/network/slice'
import { Account } from 'store/account/types'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { selectAllCustomTokens } from 'store/customToken'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { NormalizedBalancesForAccount } from 'services/balance/types'
import { useStable } from 'common/hooks/useStable'
import * as store from '../store'
import { getFetchingInterval, isXpNetwork } from './utils'

/**
 * Stale time in milliseconds
 */
const staleTime = 20_000

export const balanceKey = (account: Account, network: Network) =>
  [ReactQueryKeys.ACCOUNT_BALANCE, account.id, network.chainId] as const

/**
 * Fetches balances for all enabled non-XP networks (C-Chain, other EVMs, BTC, SOL, etc.)
 * belonging to the specified account.
 *
 * 🔁 Runs one query per network in parallel via React Query.
 * 🕒 Auto-refresh cadence:
 *   - C-Chain: every 15s
 *   - Other EVMs: every 30s
 *   - BTC/SOL: every 60s
 *
 * ⚙️ Supports lazy fetching:
 *   - By default, queries start automatically when the hook mounts.
 *   - Pass `{ enabled: false }` to prevent automatic fetching.
 *   - When disabled, use the returned `refetch()` method to manually trigger balance retrieval.
 */
export function useAccountBalances(
  account?: Account,
  options?: { enabled?: boolean }
): {
  results: QueryObserverResult<NormalizedBalancesForAccount, Error>[]
  refetch: () => Promise<void>
  isRefetching: boolean
  invalidate: () => Promise<void>
} {
  const queryClient = useQueryClient()
  const [isRefetching, setIsRefetching] = store.useIsRefetchingAccountBalances()
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const currency = useSelector(selectSelectedCurrency)
  const customTokens = useSelector(selectAllCustomTokens)

  const enabled = options?.enabled ?? true

  // Skip XP networks (PVM / AVM) - they are handled in the useWalletXpBalances hook
  const nonXpNetworks = useMemo(
    () => enabledNetworks.filter(n => !isXpNetwork(n)),
    [enabledNetworks]
  )

  const queries = useMemo(() => {
    if (!account || nonXpNetworks.length === 0) return []

    return nonXpNetworks.map((network: Network) => ({
      // eslint-disable-next-line @tanstack/query/exhaustive-deps
      queryKey: balanceKey(account, network),
      queryFn: () => {
        return BalanceService.getBalancesForAccount({
          network,
          account,
          currency: currency.toLowerCase(),
          customTokens: customTokens[network.chainId.toString()] ?? []
        })
      },
      refetchInterval: getFetchingInterval(network),
      staleTime,
      enabled
    }))
  }, [nonXpNetworks, account, currency, customTokens, enabled])

  const results = useQueries({
    queries
  })

  const refetchFns = useStable(results.map(r => r.refetch))

  /**
   * Manually refetch all enabled networks.
   * ✅ Works even when `enabled: false`, since it calls each query's refetch function directly.
   */
  const refetch = useCallback(async (): Promise<void> => {
    if (!account || nonXpNetworks.length === 0) return

    setIsRefetching(prev => ({ ...prev, [account.id]: true }))

    try {
      // Call each query’s own refetch function to force actual data fetching
      await Promise.allSettled(refetchFns.map(fn => fn()))
    } finally {
      setIsRefetching(prev => ({ ...prev, [account.id]: false }))
    }
  }, [refetchFns, nonXpNetworks.length, account, setIsRefetching])

  /** Invalidate all balances (causes auto refetch on focus/mount) */
  const invalidate = useCallback(async (): Promise<void> => {
    if (!account) return
    await Promise.allSettled(
      nonXpNetworks.map(network =>
        queryClient.invalidateQueries({
          queryKey: balanceKey(account, network)
        })
      )
    )
  }, [nonXpNetworks, account, queryClient])

  return {
    results,
    refetch,
    isRefetching: isRefetching[account?.id ?? ''] ?? false,
    invalidate
  }
}

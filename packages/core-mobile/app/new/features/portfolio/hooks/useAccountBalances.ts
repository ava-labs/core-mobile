import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import BalanceService from 'services/balance/BalanceService'
import { useSelector } from 'react-redux'
import { selectEnabledNetworks } from 'store/network/slice'
import { Account } from 'store/account/types'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { selectAllCustomTokens } from 'store/customToken'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { NormalizedBalancesForAccount } from 'services/balance/types'
import * as store from '../store'

/**
 * Stale time in milliseconds
 */
const staleTime = 20_000

/**
 * Refetch interval in milliseconds
 */
const refetchInterval = 5_000

export const balanceKey = (account: Account | undefined) =>
  [ReactQueryKeys.ACCOUNT_BALANCE, account?.id] as const

/**
 * Fetches balances for the specified account across all enabled networks (C-Chain, X-Chain, P-Chain, other EVMs, BTC, SOL, etc.)
 *
 * 🔁 Runs one query for all enabled networks via React Query.
 *
 * ⚙️ Supports lazy fetching:
 *   - Pass `{ enabled: false }` to defer fetching until `refetch()` is called.
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export function useAccountBalances(
  account?: Account,
  options?: { enabled?: boolean; refetchInterval?: number }
): {
  data: NormalizedBalancesForAccount[]
  isLoading: boolean
  isFetching: boolean
  isRefetching: boolean
  refetch: () => Promise<void>
} {
  const queryClient = useQueryClient()
  const [isRefetching, setIsRefetching] = store.useIsRefetchingAccountBalances()
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const currency = useSelector(selectSelectedCurrency)
  const customTokens = useSelector(selectAllCustomTokens)

  const isNotReady = !account || enabledNetworks.length === 0

  const enabled = isNotReady ? false : options?.enabled ?? true

  const {
    data,
    isFetching,
    refetch: refetchFn
  } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: balanceKey(account),
    enabled,
    refetchInterval: options?.refetchInterval ?? refetchInterval,
    staleTime,
    queryFn: async () => {
      if (isNotReady) return []

      const balances = await BalanceService.getBalancesForAccounts({
        networks: enabledNetworks,
        accounts: [account],
        currency: currency.toLowerCase(),
        customTokens,
        onBalanceLoaded: (chainId, partialMap) => {
          const partial = partialMap[account.id]
          if (!partial) return

          queryClient.setQueryData(
            balanceKey(account),
            (prev: NormalizedBalancesForAccount[] | undefined) => {
              if (!prev) return [partial]
              const filtered = prev.filter(p => p.chainId !== chainId)
              return [...filtered, partial]
            }
          )
        }
      })

      return balances[account.id] ?? []
    }
  })

  const refetch = useCallback(async (): Promise<void> => {
    if (isNotReady) return

    setIsRefetching(prev => ({ ...prev, [account.id]: true }))

    try {
      await refetchFn()
    } finally {
      setIsRefetching(prev => ({ ...prev, [account.id]: false }))
    }
  }, [isNotReady, account?.id, setIsRefetching, refetchFn])

  const isLoading = useMemo(() => {
    // still loading if:
    // - account missing, OR
    // - no data, OR
    // - fewer results than enabled networks
    return (
      !account ||
      !data ||
      data.length === 0 ||
      data.length < enabledNetworks.length
    )
  }, [account, data, enabledNetworks])

  return {
    data: data ?? [],
    isLoading,
    isFetching,
    isRefetching: isRefetching[account?.id ?? ''] ?? false,
    refetch
  }
}

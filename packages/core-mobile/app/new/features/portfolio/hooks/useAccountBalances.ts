import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import BalanceService from 'services/balance/BalanceService'
import { AdjustedNormalizedBalancesForAccount } from 'services/balance/types'
import { Account } from 'store/account/types'
import { selectEnabledNetworks } from 'store/network/slice'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { Network } from '@avalabs/core-chains-sdk'
import { useXPAddresses } from 'hooks/useXPAddresses/useXPAddresses'
import { selectWalletById } from 'store/wallet/slice'
import { getXpubXPIfAvailable } from 'utils/getAddressesFromXpubXP/getAddressesFromXpubXP'
import * as store from '../store'

/**
 * Stale time in milliseconds
 */
const staleTime = 20_000

/**
 * Refetch interval in milliseconds:
 * - 30 seconds in dev mode
 * - 5 seconds in prod mode
 */
const refetchInterval = __DEV__ ? 30_000 : 5_000

export const balanceKey = (account: Account | undefined, network?: Network[]) =>
  [
    ReactQueryKeys.ACCOUNT_BALANCE,
    account?.id,
    network
      ?.map(n => n.chainId)
      .sort()
      .join(',')
  ] as const

/**
 * Fetches balances for the specified account across all enabled networks (C-Chain, X-Chain, P-Chain, other EVMs, BTC, SOL, etc.)
 *
 * 🔁 Runs one query for all enabled networks via React Query.
 */
export function useAccountBalances(
  account?: Account,
  options?: {
    refetchInterval?: number | false
  }
): {
  data: AdjustedNormalizedBalancesForAccount[]
  isLoading: boolean
  isFetching: boolean
  isRefetching: boolean
  refetch: () => Promise<void>
} {
  const queryClient = useQueryClient()
  const [isRefetching, setIsRefetching] = store.useIsRefetchingAccountBalances()
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const currency = useSelector(selectSelectedCurrency)
  const { xpAddresses } = useXPAddresses(account)
  const wallet = useSelector(selectWalletById(account?.walletId ?? ''))

  const isNotReady = !account || enabledNetworks.length === 0 || !wallet

  const enabled = !isNotReady

  const {
    data,
    isFetching,
    isError,
    refetch: refetchFn
  } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: balanceKey(account, enabledNetworks),
    enabled,
    refetchInterval: options?.refetchInterval ?? refetchInterval,
    staleTime,
    queryFn: async () => {
      if (isNotReady) return []

      const xpub = await getXpubXPIfAvailable({
        walletId: wallet.id,
        walletType: wallet.type,
        accountIndex: account.index
      })

      return await BalanceService.getBalancesForAccount({
        networks: enabledNetworks,
        account,
        currency: currency.toLowerCase(),
        xpAddresses,
        xpub,
        onBalanceLoaded: balance => {
          queryClient.setQueryData(
            balanceKey(account, enabledNetworks),
            (prev: AdjustedNormalizedBalancesForAccount[] | undefined) => {
              if (!prev) return [balance]
              const filtered = prev.filter(p => p.chainId !== balance.chainId)
              return [...filtered, balance]
            }
          )
        }
      })
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
    if (isError) return false

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
  }, [account, data, enabledNetworks.length, isError])

  return {
    data: data ?? [],
    isLoading,
    isFetching,
    isRefetching: isRefetching[account?.id ?? ''] ?? false,
    refetch
  }
}

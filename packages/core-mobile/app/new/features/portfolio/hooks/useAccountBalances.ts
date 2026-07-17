import {
  type QueryClient,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
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
import { useOnlineStatus } from 'common/hooks/useOnlineStatus'
import { selectIsFilterSmallUtxosActive } from 'store/settings/advanced/filterSmallUtxosActive'
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

export const balanceKey = (
  account: Account | undefined,
  network: Network[] | undefined,
  filterOutDustUtxos: boolean
) =>
  [
    ReactQueryKeys.ACCOUNT_BALANCE,
    account?.id,
    network
      ?.map(n => n.chainId)
      .sort()
      .join(','),
    filterOutDustUtxos
  ] as const

/**
 * Cache read with flag fallback. When the small-UTXO filter setting (or its
 * PostHog gate) flips, `balanceKey` changes and the new key stays empty until
 * the next refetch lands. Cache-only readers (meld off-ramp,
 * wallet_getNetworkState) should serve the previous flag variant's data for
 * that window rather than nothing — momentarily stale dust totals beat an
 * empty token list. An exact-key hit (including a legitimately empty array
 * from a completed fetch) always wins; the fallback is read-only and never
 * written back.
 */
export const getCachedBalancesWithFlagFallback = ({
  client,
  account,
  networks,
  filterOutDustUtxos
}: {
  client: QueryClient
  account: Account | undefined
  networks: Network[] | undefined
  filterOutDustUtxos: boolean
}): AdjustedNormalizedBalancesForAccount[] | undefined => {
  const exact = client.getQueryData(
    balanceKey(account, networks, filterOutDustUtxos)
  ) as AdjustedNormalizedBalancesForAccount[] | undefined
  if (exact !== undefined) return exact

  return client.getQueryData(
    balanceKey(account, networks, !filterOutDustUtxos)
  ) as AdjustedNormalizedBalancesForAccount[] | undefined
}

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
  isError: boolean
  isPaused: boolean
  isOffline: boolean
  isRefetching: boolean
  refetch: () => Promise<void>
} {
  const queryClient = useQueryClient()
  const [isRefetching, setIsRefetching] = store.useIsRefetchingAccountBalances()
  const isOnline = useOnlineStatus()

  const enabledNetworks = useSelector(selectEnabledNetworks)
  const currency = useSelector(selectSelectedCurrency)
  const { xpAddresses } = useXPAddresses(account)
  const wallet = useSelector(selectWalletById(account?.walletId ?? ''))
  const filterOutDustUtxos = useSelector(selectIsFilterSmallUtxosActive)

  const isNotReady = !account || enabledNetworks.length === 0 || !wallet

  const enabled = !isNotReady

  const {
    data,
    isFetching,
    isError,
    isPaused,
    refetch: refetchFn
  } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: balanceKey(account, enabledNetworks, filterOutDustUtxos),
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
        filterOutDustUtxos,
        onBalanceLoaded: balance => {
          queryClient.setQueryData(
            balanceKey(account, enabledNetworks, filterOutDustUtxos),
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
      if (!isOnline) {
        // Yield to the event loop so the spinner renders before we clear it.
        // Without this, React 18 batches the true→false updates into one render.
        await new Promise<void>(resolve => setTimeout(resolve, 300))
        return
      }
      await refetchFn()
    } finally {
      setIsRefetching(prev => ({ ...prev, [account.id]: false }))
    }
  }, [isNotReady, isOnline, account?.id, setIsRefetching, refetchFn])

  const isLoading = useMemo(() => {
    if (isError || !isOnline) return false

    return (
      !account ||
      !data ||
      data.length === 0 ||
      data.length < enabledNetworks.length
    )
  }, [account, data, enabledNetworks.length, isError, isOnline])

  return {
    data: data ?? [],
    isLoading,
    isFetching,
    isError,
    isPaused,
    isOffline: !isOnline,
    isRefetching: isRefetching[account?.id ?? ''] ?? false,
    refetch
  }
}

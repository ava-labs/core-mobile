import {
  type QueryClient,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

/**
 * Flush window for progressive first-load balance updates. Chains that
 * resolve within the same window land in ONE cache write instead of one
 * write (and one re-render of every balance subscriber) per chain.
 */
const PROGRESSIVE_FLUSH_MS = 150

type BalanceBatcher = {
  add: (balance: AdjustedNormalizedBalancesForAccount) => void
  flushPending: () => void
  dispose: () => void
}

/**
 * Leading + trailing throttle: the first balance flushes immediately so the
 * cold-load UI paints as soon as any chain resolves; balances arriving within
 * the window after that are merged into a single trailing flush.
 */
export const createBalanceBatcher = (
  flush: (balances: AdjustedNormalizedBalancesForAccount[]) => void
): BalanceBatcher => {
  let buffer: AdjustedNormalizedBalancesForAccount[] = []
  let timer: ReturnType<typeof setTimeout> | null = null
  let disposed = false

  const flushBuffer = (): void => {
    if (buffer.length === 0) return
    const batch = buffer
    buffer = []
    flush(batch)
  }

  const onWindowEnd = (): void => {
    timer = null
    if (disposed) return
    if (buffer.length > 0) {
      flushBuffer()
      timer = setTimeout(onWindowEnd, PROGRESSIVE_FLUSH_MS)
    }
  }

  return {
    add: balance => {
      if (disposed) return
      buffer.push(balance)
      if (timer === null) {
        flushBuffer()
        timer = setTimeout(onWindowEnd, PROGRESSIVE_FLUSH_MS)
      }
    },
    flushPending: () => {
      if (disposed) return
      flushBuffer()
    },
    dispose: () => {
      disposed = true
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
      buffer = []
    }
  }
}

export const balanceKey = ({
  account,
  networks,
  filterOutDustUtxos,
  currency
}: {
  account: Account | undefined
  networks: Network[] | undefined
  filterOutDustUtxos: boolean
  currency: string
}) =>
  [
    ReactQueryKeys.ACCOUNT_BALANCE,
    account?.id,
    networks
      ?.map(n => n.chainId)
      .sort()
      .join(','),
    filterOutDustUtxos,
    currency.toLowerCase()
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
  filterOutDustUtxos,
  currency
}: {
  client: QueryClient
  account: Account | undefined
  networks: Network[] | undefined
  filterOutDustUtxos: boolean
  currency: string
}): AdjustedNormalizedBalancesForAccount[] | undefined => {
  const exact = client.getQueryData(
    balanceKey({ account, networks, filterOutDustUtxos, currency })
  ) as AdjustedNormalizedBalancesForAccount[] | undefined
  if (exact !== undefined) return exact

  return client.getQueryData(
    balanceKey({
      account,
      networks,
      filterOutDustUtxos: !filterOutDustUtxos,
      currency
    })
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

  // Identifies the exact set of networks this account is currently fetching
  // balances for. Mirrors the inputs of `balanceKey` (minus `filterOutDustUtxos`
  // and `currency`, tracked separately below) so the "has this fetch attempt
  // settled" latch below resets whenever react-query would hand us a genuinely
  // different query (new account, the enabled-network set changed, or the
  // selected currency changed) rather than a routine background refetch of the
  // same query.
  const networksKey = useMemo(
    () =>
      enabledNetworks
        .map(n => n.chainId)
        .sort()
        .join(','),
    [enabledNetworks]
  )

  const {
    data,
    isFetching,
    isError,
    isPaused,
    refetch: refetchFn
  } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: balanceKey({
      account,
      networks: enabledNetworks,
      filterOutDustUtxos,
      currency
    }),
    enabled,
    refetchInterval: options?.refetchInterval ?? refetchInterval,
    staleTime,
    queryFn: async () => {
      if (isNotReady) return []

      const queryKey = balanceKey({
        account,
        networks: enabledNetworks,
        filterOutDustUtxos,
        currency
      })

      // Progressive per-chain cache writes only matter on a cold load, where
      // the user is staring at an empty screen. On a background refetch the
      // cache already has data, so intermediate writes would just re-render
      // every balance subscriber once per chain (up to N times per poll) —
      // skip them and let the returned result apply one atomic update.
      const isColdLoad = queryClient.getQueryData(queryKey) === undefined
      const batcher = isColdLoad
        ? createBalanceBatcher(balances => {
            // Dedupe within the batch too (last write wins): the service can
            // report the same chain twice in one fetch (stream success, then
            // a vm-module retry sweep when another batch threw), and a
            // duplicate entry would briefly push data.length past
            // enabledNetworks.length and mis-settle the isLoading gate.
            const byChainId = new Map(balances.map(b => [b.chainId, b]))
            queryClient.setQueryData(
              queryKey,
              (prev: AdjustedNormalizedBalancesForAccount[] | undefined) => {
                const remaining =
                  prev?.filter(p => !byChainId.has(p.chainId)) ?? []
                return [...remaining, ...byChainId.values()]
              }
            )
          })
        : undefined

      const xpub = await getXpubXPIfAvailable({
        walletId: wallet.id,
        walletType: wallet.type,
        accountIndex: account.index
      })

      try {
        return await BalanceService.getBalancesForAccount({
          networks: enabledNetworks,
          account,
          currency: currency.toLowerCase(),
          xpAddresses,
          xpub,
          filterOutDustUtxos,
          onBalanceLoaded: batcher && (balance => batcher.add(balance))
        })
      } catch (error) {
        // On rejection there is no complete result coming — write whatever
        // streamed in so partial progress isn't lost (matches the old
        // per-chain-write behavior on the error path).
        batcher?.flushPending()
        throw error
      } finally {
        // On success the returned result IS the complete set (including
        // vm-module retries), so a pending trailing flush is redundant — and
        // letting it fire after the query settles would race react-query's
        // own write.
        batcher?.dispose()
      }
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

  // `hasSettledFetch` latches on `isFetching` flipping false -- prevents a
  // later background refetch of the same query from reopening the shimmer.
  // Resets only when account or enabled-network-set changes. CP-14918.
  const [hasSettledFetch, setHasSettledFetch] = useState(false)

  // `lastResetKeyRef` guards against react-freeze's thaw re-running this
  // effect from scratch -- only call `setHasSettledFetch(false)` when the
  // dep key actually changed, not on every thaw. CP-14918.
  const lastResetKeyRef = useRef<string | null>(null)
  useEffect(() => {
    const resetKey = `${
      account?.id ?? ''
    }|${networksKey}|${filterOutDustUtxos}|${currency}`
    if (lastResetKeyRef.current === resetKey) return
    lastResetKeyRef.current = resetKey
    setHasSettledFetch(false)
  }, [account?.id, networksKey, filterOutDustUtxos, currency])

  useEffect(() => {
    if (!isFetching && data !== undefined) {
      setHasSettledFetch(true)
    }
  }, [isFetching, data])

  const isLoading = useMemo(() => {
    if (isError || !isOnline) return false
    if (!account || !data) return true
    if (hasSettledFetch) return false

    return data.length === 0 || data.length < enabledNetworks.length
  }, [
    account,
    data,
    enabledNetworks.length,
    isError,
    isOnline,
    hasSettledFetch
  ])

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

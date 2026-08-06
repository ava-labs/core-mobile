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

// CP-14918 TEMP PROBE: module-level (not per-hook-instance) shimmer-gate
// snapshot + a SINGLE shared interval. The original version wrote a ref
// during render (a React Compiler bailout in the measured build — the very
// thing this branch is trying not to introduce) and started one
// `setInterval` per `useAccountBalances` call site (there are ~15+ across
// the app), so the "every 2s" cadence this probe relies on was actually N
// overlapping intervals. Every call site now writes into the same
// module-level snapshot from inside an effect (never during render) and only
// the first call site to mount starts the one shared interval that reads it.
// Logged line format is unchanged (`PERFPROBE balances.gate ...`) so past
// device logs stay comparable.
type BalanceGateProbeSnapshot = {
  dataChainIds: number[]
  enabledChainIds: number[]
  dataLength: number
  enabledLength: number
  isLoading: boolean
}

let balanceGateProbeSnapshot: BalanceGateProbeSnapshot = {
  dataChainIds: [],
  enabledChainIds: [],
  dataLength: 0,
  enabledLength: 0,
  isLoading: false
}

let balanceGateProbeTimer: ReturnType<typeof setInterval> | undefined
// Refcount of currently-mounted `useAccountBalances` call sites that have
// asked for the probe to be running. The interval is started when this goes
// 0 -> 1 and cleared when it goes 1 -> 0, so it never outlives every
// consumer (the bug a re-review caught: an unconditional `startBalanceGateProbe()`
// with no matching stop kept the interval — and its `console.log` calls —
// running forever, including after Jest tears the test environment down,
// which is exactly what hung `useAccountBalances.test.ts` post-run instead
// of letting the process exit).
let balanceGateProbeRefCount = 0

const startBalanceGateProbe = (): void => {
  balanceGateProbeRefCount += 1
  if (balanceGateProbeTimer) return
  balanceGateProbeTimer = setInterval(() => {
    const v = balanceGateProbeSnapshot
    const missing = v.enabledChainIds.filter(c => !v.dataChainIds.includes(c))
    // eslint-disable-next-line no-console
    console.log(
      `PERFPROBE balances.gate data=${v.dataLength} enabled=${
        v.enabledLength
      } isLoading=${v.isLoading} missingChainIds=${JSON.stringify(missing)}`
    )
  }, 2000)
}

const stopBalanceGateProbe = (): void => {
  balanceGateProbeRefCount = Math.max(0, balanceGateProbeRefCount - 1)
  if (balanceGateProbeRefCount > 0) return
  if (balanceGateProbeTimer) {
    clearInterval(balanceGateProbeTimer)
    balanceGateProbeTimer = undefined
  }
}

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

  // Identifies the exact set of networks this account is currently fetching
  // balances for. Mirrors the inputs of `balanceKey` (minus `filterOutDustUtxos`,
  // tracked separately below) so the "has this fetch attempt settled" latch
  // below resets whenever react-query would hand us a genuinely different
  // query (new account, or the enabled-network set changed) rather than a
  // routine background refetch of the same query.
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

  // `data.length < enabledNetworks.length` alone is a latent hazard: per
  // network, BalanceService reports either a success entry or an error entry
  // (both flow into `data`) once its internal retries are exhausted, but a
  // network can — in an edge case (a batch response that never resolves to
  // either a success or error partial for a given chain) — end up with no
  // entry in `data` at all. When that happens the length comparison never
  // catches up to `enabledNetworks.length` and `isLoading` sticks true
  // forever, running the header shimmer indefinitely.
  //
  // react-query's own `isFetching` already tells us, from real query state,
  // when BalanceService's promise (including all of its internal per-network
  // retries) has settled for the current account/network set — nothing more
  // is coming for this fetch attempt once that flips back to false. Latch
  // that "settled" fact per account/network-set so the gate can't be forced
  // back open by a later background refetch of the *same* query (which would
  // otherwise reopen the shimmer every `refetchInterval` tick); it resets
  // only when the account or the enabled-network set actually changes.
  const [hasSettledFetch, setHasSettledFetch] = useState(false)

  // First-run guard: react-freeze (Task S's iOS tabs flip) suspends and
  // later thaws this hook's owning screen, and thawing re-runs passive
  // effects from scratch — including this one — even though React's normal
  // dependency-diffing would not have re-run it, because nothing in
  // [account?.id, networksKey, filterOutDustUtxos] actually changed across
  // the freeze/thaw cycle. Without this guard, every thaw would force
  // `hasSettledFetch` back to `false` and reopen the shimmer for an account
  // that had already settled. Track the last dep combination this effect
  // actually reset for in a ref (which — unlike the deps array — is not
  // re-diffed by React, so it survives the thaw's fresh effect run with its
  // prior value intact) and only call `setHasSettledFetch(false)` when that
  // combined key genuinely changes, not merely re-evaluates to the same
  // value.
  const lastResetKeyRef = useRef<string | null>(null)
  useEffect(() => {
    const resetKey = `${account?.id ?? ''}|${networksKey}|${filterOutDustUtxos}`
    if (lastResetKeyRef.current === resetKey) return
    lastResetKeyRef.current = resetKey
    setHasSettledFetch(false)
  }, [account?.id, networksKey, filterOutDustUtxos])

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

  // CP-14918 TEMP PROBE: log the shimmer gate inputs every 2s at rest to
  // confirm/refute the "isLoading stuck true forever" hypothesis and name
  // any enabled network whose data never lands. See the module-level
  // `balanceGateProbeSnapshot`/`startBalanceGateProbe` above for why this is
  // an effect write (not a render-time ref write) into a shared snapshot
  // rather than a per-instance ref + per-instance interval.
  useEffect(() => {
    balanceGateProbeSnapshot = {
      dataChainIds: (data ?? []).map(d => d.chainId),
      enabledChainIds: enabledNetworks.map(n => n.chainId),
      dataLength: data?.length ?? 0,
      enabledLength: enabledNetworks.length,
      isLoading
    }
  }, [data, enabledNetworks, isLoading])
  // Refcounted mount/unmount: `startBalanceGateProbe` bumps the shared
  // refcount and (only for the first mounted call site) starts the shared
  // interval; the cleanup below decrements it and (only once the LAST call
  // site has unmounted) clears the interval — so the "single interval while
  // any consumer is mounted" property holds without ever leaking a timer
  // past the last consumer.
  useEffect(() => {
    startBalanceGateProbe()
    return () => stopBalanceGateProbe()
  }, [])

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

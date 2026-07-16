import {
  getAccountValueUsd,
  getWithdrawableUsd,
  parseClearinghouseWsPayload,
  parseSpotClearinghouseWsPayload,
  type AssetPosition,
  type ClearinghouseState,
  type SpotClearinghouseState,
  type UserAbstractionMode
} from '@avalabs/perps-sdk'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useEffect, useState } from 'react'
import { PERPS_ACCOUNT_STALE_TIME } from '../consts'
import { usePerps } from '../contexts/PerpsProvider'
import { getPerpsInfoClient } from '../services/perpsClients'

export type PerpsClearinghouse = {
  clearinghouse: ClearinghouseState | undefined
  spot: SpotClearinghouseState | undefined
  mode: UserAbstractionMode | undefined
  /** Total account equity in USD (perp + free spot for unified accounts). */
  accountValueUsd: number | undefined
  /** Amount withdrawable off Hyperliquid right now, in USD. */
  withdrawableUsd: number | undefined
  /** The authoritative withdrawable fallback is still being fetched. */
  isWithdrawableLoading: boolean
  /** Neither cached state nor the authoritative fallback produced a balance. */
  isWithdrawableUnavailable: boolean
  positions: readonly AssetPosition[]
  isLoading: boolean
  /**
   * `true` when the REST clearinghouse fetch has failed with no data to fall
   * back on. Balance-driven screens should distinguish this from a genuine zero
   * balance (a `?? 0` fallback otherwise renders an outage as "$0"), and offer a
   * retry via {@link refetch}. A live WS `clearinghouseState` snapshot, if one
   * arrived, still populates the figures and keeps this `false`.
   */
  isError: boolean
  refetch: () => void
}

/**
 * The active account's **main-dex** Hyperliquid clearinghouse state (perp +
 * spot + account abstraction mode), with derived account-value and withdrawable
 * figures.
 *
 * REST (via the shared `/info` client) seeds the first paint and re-seeds on the
 * shared `clearinghouseRefreshNonce` (bumped after deposits / trades);
 * `clearinghouseState` and `spotState` WebSocket channels then keep standard
 * and shared-balance account modes live. The streams matter most for changes
 * that are *not* a local user action — above all a **liquidation**, which is
 * price-driven. `wsResubscribeNonce` forces fresh subscriptions after reconnect.
 *
 * HIP-3 (builder-dex) isolated clearinghouses are fetched separately by
 * {@link useHip3Positions} and merged in {@link usePerpsPositions}.
 */
export const usePerpsClearinghouse = (): PerpsClearinghouse => {
  const {
    manager,
    userAddress,
    clearinghouseRefreshNonce,
    wsResubscribeNonce
  } = usePerps()

  const { data, isPending, isError, refetch } = useQuery({
    enabled: userAddress !== undefined,
    queryKey: [
      ReactQueryKeys.PERPS_CLEARINGHOUSE,
      userAddress,
      clearinghouseRefreshNonce
    ],
    queryFn: async () => {
      if (userAddress === undefined) {
        return undefined
      }
      const info = getPerpsInfoClient()
      const [clearinghouse, spot, mode] = await Promise.all([
        info.getClearinghouseState(userAddress),
        info.getSpotClearinghouseState(userAddress),
        info.getUserAbstraction(userAddress)
      ])
      return { clearinghouse, spot, mode }
    },
    staleTime: PERPS_ACCOUNT_STALE_TIME,
    // `clearinghouseRefreshNonce` is in the queryKey, so a refresh (after a
    // trade / reconnect) is a *new* key. Without this, `isPending` flips back to
    // `true` on every refresh and downstream `isLoading` gating (e.g. the
    // positions carousel) would blank out already-loaded data. Keeping the
    // previous result as placeholder means `isPending` is true only on the very
    // first load; refreshes stay `success` (with `isFetching`) instead.
    placeholderData: keepPreviousData
  })

  // Live perp clearinghouse override, streamed over WS. Seeded from each fresh
  // REST result (mount / account switch / refresh nonce) so a re-seed re-bases
  // the live view, then overwritten on every WS tick.
  const [liveClearinghouse, setLiveClearinghouse] = useState<
    ClearinghouseState | undefined
  >(undefined)

  useEffect(() => {
    setLiveClearinghouse(data?.clearinghouse)
  }, [data?.clearinghouse])

  useEffect(() => {
    if (manager === null || userAddress === undefined) {
      return
    }
    let cancelled = false
    const unsub = manager.ws.subscribe(
      { type: 'clearinghouseState', user: userAddress, dex: '' },
      payload => {
        if (cancelled) {
          return
        }
        const next = parseClearinghouseWsPayload(payload)
        if (next !== undefined) {
          setLiveClearinghouse(next)
        }
      }
    )
    return () => {
      cancelled = true
      unsub()
    }
  }, [manager, userAddress, wsResubscribeNonce])

  const clearinghouse = liveClearinghouse ?? data?.clearinghouse
  const [liveSpot, setLiveSpot] = useState<SpotClearinghouseState | undefined>(
    undefined
  )

  useEffect(() => {
    setLiveSpot(data?.spot)
  }, [data?.spot])

  useEffect(() => {
    if (manager === null || userAddress === undefined) {
      return
    }
    let cancelled = false
    const unsub = manager.ws.subscribe(
      {
        type: 'spotState',
        user: userAddress,
        isPortfolioMargin: data?.mode === 'portfolioMargin'
      },
      payload => {
        if (cancelled) {
          return
        }
        const next = parseSpotClearinghouseWsPayload(payload)
        if (next !== undefined) {
          setLiveSpot(next)
        }
      }
    )
    return () => {
      cancelled = true
      unsub()
    }
  }, [manager, userAddress, data?.mode, wsResubscribeNonce])

  const spot = liveSpot ?? data?.spot
  const cachedWithdrawableUsd = getWithdrawableUsd(
    clearinghouse,
    spot,
    data?.mode
  )
  const shouldFetchEffectiveWithdrawable =
    userAddress !== undefined &&
    !isPending &&
    cachedWithdrawableUsd === undefined
  const effectiveWithdrawableQuery = useQuery({
    queryKey: [
      ReactQueryKeys.PERPS_CLEARINGHOUSE,
      'effectiveWithdrawable',
      userAddress,
      clearinghouseRefreshNonce
    ],
    enabled: shouldFetchEffectiveWithdrawable,
    queryFn: async () => {
      if (userAddress === undefined) {
        throw new Error('User address missing')
      }
      return {
        value: await getPerpsInfoClient().getEffectiveWithdrawableUsd(
          userAddress
        )
      }
    },
    staleTime: PERPS_ACCOUNT_STALE_TIME
  })
  const fallbackWithdrawableUsd = effectiveWithdrawableQuery.data?.value
  const withdrawableUsd = cachedWithdrawableUsd ?? fallbackWithdrawableUsd
  const isWithdrawableLoading =
    shouldFetchEffectiveWithdrawable && effectiveWithdrawableQuery.isPending
  const isWithdrawableUnavailable =
    shouldFetchEffectiveWithdrawable &&
    !effectiveWithdrawableQuery.isPending &&
    (effectiveWithdrawableQuery.isError ||
      fallbackWithdrawableUsd === undefined)

  return {
    clearinghouse,
    spot,
    mode: data?.mode,
    // The SDK selects the authoritative ledger for the current abstraction
    // mode: aggregate perp margin for standard accounts, spot USDC for unified
    // and portfolio-margin accounts.
    accountValueUsd: getAccountValueUsd(clearinghouse, spot, data?.mode),
    withdrawableUsd,
    isWithdrawableLoading,
    isWithdrawableUnavailable,
    positions: clearinghouse?.assetPositions ?? [],
    isLoading: isPending,
    // Only surface an error when we have nothing to show — a WS snapshot or a
    // prior REST success (kept by react-query across refetches) means the
    // figures are still valid despite a transient fetch failure.
    isError: isError && clearinghouse === undefined,
    refetch: () => {
      void refetch()
      if (shouldFetchEffectiveWithdrawable) {
        void effectiveWithdrawableQuery.refetch()
      }
    }
  }
}

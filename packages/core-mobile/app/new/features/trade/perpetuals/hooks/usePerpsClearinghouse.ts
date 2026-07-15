import {
  getAccountValueUsd,
  getWithdrawableUsd,
  parseClearinghouseWsPayload,
  type AssetPosition,
  type ClearinghouseState,
  type SpotClearinghouseState,
  type UserAbstractionMode
} from '@avalabs/perps-sdk'
import { useQuery } from '@tanstack/react-query'
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
  positions: readonly AssetPosition[]
  isLoading: boolean
  refetch: () => void
}

/**
 * The active account's **main-dex** Hyperliquid clearinghouse state (perp +
 * spot + account abstraction mode), with derived account-value and withdrawable
 * figures.
 *
 * REST (via the shared `/info` client) seeds the first paint and re-seeds on the
 * shared `clearinghouseRefreshNonce` (bumped after deposits / trades); the
 * `clearinghouseState` WebSocket channel then keeps the perp clearinghouse live.
 * The WS stream matters most for changes that are *not* a local user action —
 * above all a **liquidation**, which is price-driven — so the affected position
 * and account value update on their own instead of lingering until a manual
 * refresh. `wsResubscribeNonce` forces a fresh subscribe after a reconnect.
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

  const { data, isPending, refetch } = useQuery({
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
    staleTime: PERPS_ACCOUNT_STALE_TIME
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

  return {
    clearinghouse,
    spot: data?.spot,
    mode: data?.mode,
    accountValueUsd: getAccountValueUsd(clearinghouse, data?.spot, data?.mode),
    withdrawableUsd: getWithdrawableUsd(clearinghouse, data?.spot, data?.mode),
    positions: clearinghouse?.assetPositions ?? [],
    isLoading: isPending,
    refetch: () => {
      void refetch()
    }
  }
}

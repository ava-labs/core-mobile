import { useMemo } from 'react'
import { usePerps } from '../contexts/PerpsProvider'
import type { Position } from '../types'
import {
  getCachedPerpsStickyTriggers,
  setCachedPerpsStickyTriggers
} from '../utils/clearPerpsSessionCaches'
import { toPosition } from '../utils/toPosition'
import { usePerpsAllOpenOrders } from './usePerpsAllOpenOrders'
import { usePerpsPositions } from './usePerpsPositions'

export type PerpsPositionsView = {
  /** Open positions with sticky TP/SL trigger prices for display. */
  readonly positions: readonly Position[]
  /** Raw (unmapped) `AssetPosition[]` for summary aggregation. */
  readonly rawPositions: ReturnType<typeof usePerpsPositions>['positions']
  /**
   * `true` until BOTH the main-dex and HIP-3 position feeds have responded, so
   * consumers can wait and render the merged set at once rather than showing
   * main-dex positions first and popping HIP-3 ones in a beat later.
   */
  readonly isLoading: boolean
}

/**
 * Last settled TP/SL per position, keyed by user and coin. Module-level so it
 * survives screen remounts and live WS/REST order refetches without exposing
 * one account's trigger values after an account switch.
 */
/**
 * Positions with display-ready, flicker-free TP/SL. Take-profit / stop-loss
 * live in the open-orders feed (not the clearinghouse position) and that feed
 * refetches on every WS push, so mapping it naively makes the values blink. We
 * only commit a coin's triggers to the sticky cache once the orders feed has
 * loaded, then read from the cache — so after the first load the UI changes
 * only when the actual result changes.
 */
export const usePerpsPositionsView = (): PerpsPositionsView => {
  const { userAddress } = usePerps()
  const { positions: rawPositions, isLoading } = usePerpsPositions()
  const { orders, isLoading: ordersLoading } = usePerpsAllOpenOrders()

  const positions = useMemo<Position[]>(() => {
    return rawPositions.map(assetPosition => {
      const base = toPosition(assetPosition, orders)
      const coin = assetPosition.position.coin
      const cacheKey =
        userAddress === undefined ? undefined : `${userAddress}|${coin}`

      // Only trust the computed triggers once the feed has settled; commit them
      // to the sticky cache as the source of truth for display.
      if (!ordersLoading && cacheKey !== undefined) {
        setCachedPerpsStickyTriggers(cacheKey, {
          takeProfit: base.takeProfit,
          stopLoss: base.stopLoss
        })
      }

      const cached =
        cacheKey === undefined
          ? undefined
          : getCachedPerpsStickyTriggers(cacheKey)
      if (cached === undefined) {
        // Never settled this session — show `-` until the first load completes.
        return { ...base, triggersPending: true }
      }
      return {
        ...base,
        takeProfit: cached.takeProfit,
        stopLoss: cached.stopLoss,
        triggersPending: false
      }
    })
  }, [rawPositions, orders, ordersLoading, userAddress])

  return { positions, rawPositions, isLoading }
}

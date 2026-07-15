import { useMemo } from 'react'
import type { Position } from '../types'
import { toPosition } from '../utils/toPosition'
import { usePerpsAllOpenOrders } from './usePerpsAllOpenOrders'
import { usePerpsPositions } from './usePerpsPositions'

export type PerpsPositionsView = {
  /** Open positions with sticky TP/SL trigger prices for display. */
  readonly positions: readonly Position[]
  /** Raw (unmapped) `AssetPosition[]` for summary aggregation. */
  readonly rawPositions: ReturnType<typeof usePerpsPositions>['positions']
}

/**
 * Last settled TP/SL per position, keyed by coin. Module-level so it survives
 * screen remounts and live WS/REST order refetches: once a coin's triggers have
 * settled (open orders finished their first load), we show the cached value and
 * only replace it when a *new settled* computation differs — never blinking
 * back to a `-` placeholder or a transient `None`.
 */
const stickyTriggers = new Map<
  string,
  { takeProfit: number; stopLoss: number }
>()

/**
 * Positions with display-ready, flicker-free TP/SL. Take-profit / stop-loss
 * live in the open-orders feed (not the clearinghouse position) and that feed
 * refetches on every WS push, so mapping it naively makes the values blink. We
 * only commit a coin's triggers to the sticky cache once the orders feed has
 * loaded, then read from the cache — so after the first load the UI changes
 * only when the actual result changes.
 */
export const usePerpsPositionsView = (): PerpsPositionsView => {
  const { positions: rawPositions } = usePerpsPositions()
  const { orders, isLoading: ordersLoading } = usePerpsAllOpenOrders()

  const positions = useMemo<Position[]>(() => {
    return rawPositions.map(assetPosition => {
      const base = toPosition(assetPosition, orders)
      const coin = assetPosition.position.coin

      // Only trust the computed triggers once the feed has settled; commit them
      // to the sticky cache as the source of truth for display.
      if (!ordersLoading) {
        stickyTriggers.set(coin, {
          takeProfit: base.takeProfit,
          stopLoss: base.stopLoss
        })
      }

      const cached = stickyTriggers.get(coin)
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
  }, [rawPositions, orders, ordersLoading])

  return { positions, rawPositions }
}

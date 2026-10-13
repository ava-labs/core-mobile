import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Position } from '../types'

export interface PositionActions {
  marketClose: (position: Position) => void
  limitClose: (position: Position) => void
  manage: (position: Position) => void
}

/**
 * Navigation to the close / manage flows for an open position. Shared by the
 * positions list and the positions search screen so the query-string building
 * (symbol encoding, `entryPrice ?? price` fallback, position size) lives in one
 * place and can't diverge between the two entry points.
 *
 * Routes use `position.id` (the full Hyperliquid coin id, e.g. `xyz:GOLD` for
 * HIP-3 markets) rather than `position.symbol` (the dex-stripped display
 * ticker). Routing a HIP-3 position by its bare ticker would target the
 * main-dex market of the same name — closing/managing the wrong position.
 */
export const usePositionActions = (): PositionActions => {
  const router = useRouter()

  return useMemo(() => {
    const close = (position: Position, kind: 'market' | 'limit'): void => {
      const coin = encodeURIComponent(position.id)
      const entry = position.entryPrice ?? position.price
      // Notional value of the position, so the close dial is sized to the real
      // position rather than the mock fallback.
      const value = position.size * position.price
      // Carry the real position size (base units) so the close screen can size
      // the order from it directly, rather than re-deriving value / price (which
      // adds float residue that floatToWire rejects and can floor away dust on a
      // 100% close).
      router.navigate(
        `/perpetualsClose?kind=${kind}&coin=${coin}&side=${position.side}&price=${position.price}&entry=${entry}&value=${value}&pnl=${position.pnl}&size=${position.size}`
      )
    }

    return {
      marketClose: position => close(position, 'market'),
      limitClose: position => close(position, 'limit'),
      manage: position => {
        const coin = encodeURIComponent(position.id)
        const entry = position.entryPrice ?? position.price
        router.navigate(
          `/perpetualsManage?coin=${coin}&side=${position.side}&entry=${entry}&leverage=${position.leverage}&size=${position.size}&pnl=${position.pnl}&tp=${position.takeProfit}&sl=${position.stopLoss}`
        )
      }
    }
  }, [router])
}

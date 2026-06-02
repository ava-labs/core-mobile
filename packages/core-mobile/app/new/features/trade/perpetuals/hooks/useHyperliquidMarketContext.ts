import {
  MAINNET_API_URL,
  MAINNET_WS_URL,
  createHyperliquidWsClient,
  createInfoClient,
  type PerpUniverseEntry,
  type PerpsAssetCtx
} from '@avalabs/perps-sdk'
import { useEffect, useState } from 'react'

// Hyperliquid perp prices are quoted with `MAX_PERP_DECIMALS - szDecimals`
// fractional digits.
const MAX_PERP_DECIMALS = 6

export interface HyperliquidMarketContext {
  /** Live mark/oracle/volume snapshot, refreshed over the WS `activeAssetCtx` channel. */
  assetCtx?: PerpsAssetCtx
  /** Per-coin metadata (max leverage, size precision). Static for the session. */
  universe?: PerpUniverseEntry
  /** Number of fractional digits to render for price values for this market. */
  pxDecimals?: number
}

const pxDecimalsFor = (
  entry: PerpUniverseEntry | undefined
): number | undefined =>
  entry === undefined
    ? undefined
    : Math.max(0, MAX_PERP_DECIMALS - entry.szDecimals)

interface ActiveAssetCtxPayload {
  coin: string
  ctx: PerpsAssetCtx
}

export const useHyperliquidMarketContext = (
  coin: string
): HyperliquidMarketContext => {
  const [state, setState] = useState<HyperliquidMarketContext>({})

  useEffect(() => {
    let cancelled = false
    const info = createInfoClient({ baseUrl: MAINNET_API_URL })
    const ws = createHyperliquidWsClient({ url: MAINNET_WS_URL })

    // Seed from REST so universe + assetCtx are populated before the first WS tick.
    info
      .getMetaAndAssetCtxs()
      .then(([meta, ctxs]) => {
        if (cancelled) return
        const idx = meta.universe.findIndex(u => u.name === coin)
        if (idx < 0) return
        const universe = meta.universe[idx]
        setState({
          universe,
          assetCtx: ctxs[idx],
          pxDecimals: pxDecimalsFor(universe)
        })
      })
      .catch(() => {
        // Silent — state stays empty so consumers render skeletons.
      })

    ws.connect()
    const unsubscribe = ws.subscribe({ type: 'activeAssetCtx', coin }, data => {
      if (cancelled) return
      const msg = data as ActiveAssetCtxPayload | undefined
      if (!msg || msg.coin !== coin || !msg.ctx) return
      setState(prev => ({ ...prev, assetCtx: msg.ctx }))
    })

    return () => {
      cancelled = true
      unsubscribe()
      ws.disconnect()
    }
  }, [coin])

  return state
}

import {
  MAINNET_API_URL,
  MAINNET_WS_URL,
  createHyperliquidWsClient,
  createInfoClient,
  type PerpUniverseEntry,
  type PerpsAssetCtx
} from '@avalabs/perps-sdk'
import { useEffect, useState } from 'react'

/**
 * Live market data for a single Hyperliquid perpetual.
 *
 * - `assetCtx` holds the real-time mark/oracle/volume snapshot. Seeded from the
 *   `info` REST endpoint on mount and refreshed over the `activeAssetCtx` WS
 *   channel.
 * - `universe` holds the per-coin metadata (max leverage, size precision). Comes
 *   from `getMetaAndAssetCtxs` once per mount — these values don't change
 *   intra-session.
 */
export interface HyperliquidMarketContext {
  assetCtx?: PerpsAssetCtx
  universe?: PerpUniverseEntry
}

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

    // Initial REST snapshot — gives us universe metadata + assetCtx until the
    // first WS tick lands.
    info
      .getMetaAndAssetCtxs()
      .then(([meta, ctxs]) => {
        if (cancelled) return
        const idx = meta.universe.findIndex(u => u.name === coin)
        if (idx < 0) return
        setState({ universe: meta.universe[idx], assetCtx: ctxs[idx] })
      })
      .catch(() => {
        /* surface via UI later if needed; for now silent */
      })

    ws.connect()
    const unsubscribe = ws.subscribe(
      { type: 'activeAssetCtx', coin },
      data => {
        if (cancelled) return
        const msg = data as ActiveAssetCtxPayload | undefined
        if (!msg || msg.coin !== coin || !msg.ctx) return
        setState(prev => ({ ...prev, assetCtx: msg.ctx }))
      }
    )

    return () => {
      cancelled = true
      unsubscribe()
      ws.disconnect()
    }
  }, [coin])

  return state
}

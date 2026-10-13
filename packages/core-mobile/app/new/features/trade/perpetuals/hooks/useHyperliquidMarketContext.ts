import { type PerpUniverseEntry, type PerpsAssetCtx } from '@avalabs/perps-sdk'
import { useEffect, useState } from 'react'
import {
  createPerpsWsClient,
  getPerpsInfoClient
} from '../services/perpsClients'
import { dexOfCoin, tickerOfCoin } from '../utils/coinDex'
import { pxDecimalsFor } from '../utils/format'

export interface HyperliquidMarketContext {
  /** Live mark/oracle/volume snapshot, refreshed over the WS `activeAssetCtx` channel. */
  assetCtx?: PerpsAssetCtx
  /** Per-coin metadata (max leverage, size precision). Static for the session. */
  universe?: PerpUniverseEntry
  /** Number of fractional digits to render for price values for this market. */
  pxDecimals?: number
}

interface ActiveAssetCtxPayload {
  coin: string
  ctx: PerpsAssetCtx
}

/**
 * Live market context for a single coin: seeds from REST `metaAndAssetCtxs`
 * (so universe + first snapshot are present before the first WS tick) then
 * keeps `assetCtx` fresh over the `activeAssetCtx` WebSocket channel.
 *
 * Resolves HIP-3 (builder-deployed) coins, which are namespaced as `dex:TICKER`
 * (e.g. `xyz:GOLD`): the builder dex's universe is fetched via `dexOfCoin(coin)`.
 * HIP-3 `meta.universe[].name` values are already namespaced (`xyz:GOLD`), while
 * main-dex names are bare tickers — match either the full coin id or the bare
 * ticker so both layouts resolve.
 */
const universeNameMatchesCoin = (name: string, coin: string): boolean =>
  name === coin || name === tickerOfCoin(coin)

const wsCoinMatches = (msgCoin: string, coin: string): boolean =>
  msgCoin === coin || msgCoin === tickerOfCoin(coin)

export const useHyperliquidMarketContext = (
  coin: string
): HyperliquidMarketContext => {
  const [state, setState] = useState<HyperliquidMarketContext>({})

  useEffect(() => {
    let cancelled = false
    setState({})

    getPerpsInfoClient()
      .getMetaAndAssetCtxs(dexOfCoin(coin))
      .then(([meta, ctxs]) => {
        if (cancelled) {
          return
        }
        const idx = meta.universe.findIndex(u =>
          universeNameMatchesCoin(u.name, coin)
        )
        if (idx < 0) {
          return
        }
        const universe = meta.universe[idx]
        setState({
          universe,
          assetCtx: ctxs[idx],
          pxDecimals:
            universe !== undefined
              ? pxDecimalsFor(universe.szDecimals)
              : undefined
        })
      })
      .catch(() => {
        // Silent — state stays empty so consumers render skeletons.
      })

    const ws = createPerpsWsClient()
    ws.connect()
    const unsubscribe = ws.subscribe({ type: 'activeAssetCtx', coin }, data => {
      if (cancelled) {
        return
      }
      const msg = data as ActiveAssetCtxPayload | undefined
      if (!msg || !msg.ctx || !wsCoinMatches(msg.coin, coin)) {
        return
      }
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

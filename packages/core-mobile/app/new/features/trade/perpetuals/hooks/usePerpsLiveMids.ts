import {
  midForCoin,
  namespacedCoin,
  parseAllMidsWsPayload,
  type HyperliquidWsClient,
  type InfoClient
} from '@avalabs/perps-sdk'
import { useEffect, useSyncExternalStore } from 'react'
import { usePerps } from '../contexts/PerpsProvider'
import {
  createPerpsWsClient,
  getPerpsInfoClient
} from '../services/perpsClients'

/**
 * Live mid-price store for the perps market list.
 *
 * A single WebSocket feed (`usePerpsLiveMidsFeed`) writes every `allMids` tick
 * here; individual rows read their own coin's mid via `useLiveMid`. Using an
 * external store (not component state) means a price tick only re-renders the
 * rows whose price actually changed — not the whole list on every message.
 */
let mids: Record<string, string> = {}
const listeners = new Set<() => void>()

/**
 * Best-effort WebSocket-health signal for the connection monitor. The mids feed
 * is the app's most frequent WS channel, so its tick timestamp doubles as a
 * liveness heartbeat. `activeFeeds` gates the monitor: with no feed mounted
 * there are no ticks, so staleness must not be read as a dropped connection.
 */
let lastMidsActivityAt = 0
let activeFeeds = 0

export const perpsMidsActivity = {
  getLastActivityAt: (): number => lastMidsActivityAt,
  isFeedActive: (): boolean => activeFeeds > 0
}

const setLiveMids = (next: Record<string, string>): void => {
  mids = { ...mids, ...next }
  lastMidsActivityAt = Date.now()
  listeners.forEach(listener => listener())
}

/**
 * Namespace a builder dex's mid map keys as `dex:TICKER` so they don't collide
 * with native tickers and match how HIP-3 coins are keyed everywhere else.
 */
const namespaceMids = (
  dex: string,
  raw: Record<string, string>
): Record<string, string> => {
  const namespaced: Record<string, string> = {}
  for (const key in raw) {
    const value = raw[key]
    if (value !== undefined) {
      namespaced[namespacedCoin(dex, key)] = value
    }
  }
  return namespaced
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Latest live mid price for a coin (native ticker like `BTC` or namespaced
 * `dex:TICKER`), or `undefined` until the first tick arrives. Only re-renders
 * the caller when this specific coin's mid changes.
 */
export const useLiveMid = (coin: string): number | undefined => {
  return useSyncExternalStore(subscribe, () => {
    const value = midForCoin(mids, coin)
    return value === undefined ? undefined : Number.parseFloat(value)
  })
}

type MidsFeedContext = {
  ws: HyperliquidWsClient
  client: InfoClient
  isCancelled: () => boolean
  unsubscribers: Array<() => void>
}

/**
 * Subscribe to one dex's `allMids` feed: seed from REST then stream over WS into
 * the live-mid store. `dex === ''` is the native (main) dex (bare tickers);
 * builder dexs have their keys namespaced (`dex:TICKER`). Pushes its unsubscribe
 * onto `ctx.unsubscribers`.
 */
const subscribeDexMids = (ctx: MidsFeedContext, dex: string): void => {
  const { ws, client, isCancelled, unsubscribers } = ctx
  const transform = (raw: Record<string, string>): Record<string, string> =>
    dex === '' ? raw : namespaceMids(dex, raw)
  const subscription =
    dex === ''
      ? ({ type: 'allMids' } as const)
      : ({ type: 'allMids', dex } as const)

  client
    .getAllMids(dex === '' ? undefined : dex)
    .then(initial => {
      if (!isCancelled()) {
        setLiveMids(transform(initial))
      }
    })
    .catch(() => {
      // Silent — WS will populate.
    })

  unsubscribers.push(
    ws.subscribe(subscription, data => {
      if (isCancelled()) {
        return
      }
      const next = parseAllMidsWsPayload(data)
      if (next !== undefined) {
        setLiveMids(transform(next))
      }
    })
  )
}

/** Names of the builder-deployed (HIP-3) dexs — index 0 (`null`) is native. */
const builderDexNames = (
  perpDexs: Awaited<ReturnType<InfoClient['getPerpDexs']>>
): string[] =>
  perpDexs
    .filter(
      (entry): entry is NonNullable<typeof entry> =>
        entry !== null && entry.name !== ''
    )
    .map(entry => entry.name)

/**
 * Opens the shared `allMids` feed for the lifetime of the mounting screen:
 * seeds from REST then streams updates over WebSocket into the live-mid store.
 * Covers the native (main) dex plus every builder-deployed HIP-3 dex — each
 * builder dex is a separate `allMids` subscription whose keys are namespaced
 * (`dex:TICKER`). Holds no React state, so ticks never re-render the host
 * screen — only the subscribed rows update.
 */
export const usePerpsLiveMidsFeed = (): void => {
  // Re-subscribing when the connection monitor bumps this nonce tears down and
  // re-creates the socket, forcing a fresh connect after a sustained stall.
  const { wsResubscribeNonce } = usePerps()

  useEffect(() => {
    let cancelled = false
    const isCancelled = (): boolean => cancelled
    const client = getPerpsInfoClient()
    const ws = createPerpsWsClient()
    activeFeeds += 1
    ws.connect()
    const unsubscribers: Array<() => void> = []
    const ctx: MidsFeedContext = { ws, client, isCancelled, unsubscribers }

    // Native (main) dex — keys are bare tickers.
    subscribeDexMids(ctx, '')

    // Builder (HIP-3) dexs — one `allMids` feed per dex, keys namespaced.
    client
      .getPerpDexs()
      .then(perpDexs => {
        if (cancelled) {
          return
        }
        for (const dex of builderDexNames(perpDexs)) {
          subscribeDexMids(ctx, dex)
        }
      })
      .catch(() => {
        // Silent — HIP-3 mids just won't stream if discovery fails.
      })

    return () => {
      cancelled = true
      activeFeeds = Math.max(0, activeFeeds - 1)
      unsubscribers.forEach(unsubscribe => unsubscribe())
      ws.disconnect()
    }
  }, [wsResubscribeNonce])
}

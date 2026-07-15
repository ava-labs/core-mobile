import { type Address, type OpenOrder } from '@avalabs/perps-sdk'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePerps } from '../contexts/PerpsProvider'
import {
  aggregateHip3Orders,
  hip3DexNames,
  seedHip3OpenOrders,
  startHip3OpenOrdersFeed
} from '../utils/hip3Feed'
import { useHip3Markets } from './useHip3Markets'

export type Hip3OpenOrdersAggregate = {
  /** Open resting orders across all HIP-3 dexs (coins namespaced `dex:TICKER`). */
  readonly orders: readonly OpenOrder[]
  /** `true` until the first REST seed across the HIP-3 dexs settles. */
  readonly isLoading: boolean
}

const EMPTY: Hip3OpenOrdersAggregate = { orders: [], isLoading: false }

/**
 * Module-level stale-while-revalidate cache keyed by `user|dexKey`, mirroring
 * the main-dex {@link usePerpsOpenOrders} cache. Lets a remount seed the last
 * per-dex orders immediately (no loading blink) and only flips out of the
 * loading state on the first seed per scope per app session.
 */
const hip3OrdersCache = new Map<string, Record<string, readonly OpenOrder[]>>()
const hip3SeededScopes = new Set<string>()

/** Last cached per-dex orders for a scope (empty when unseen). */
const initialOrdersFor = (
  scopeKey: string
): Record<string, readonly OpenOrder[]> =>
  scopeKey.length > 0 ? hip3OrdersCache.get(scopeKey) ?? {} : {}

/** Whether a scope has already completed its first REST seed this session. */
const isScopeSeeded = (scopeKey: string): boolean =>
  scopeKey.length > 0 && hip3SeededScopes.has(scopeKey)

/**
 * Aggregates a user's open orders on HIP-3 (builder-deployed) dexs by fanning
 * out `getOpenOrders(user, dex)` across every builder dex (there is no single
 * cross-dex orders endpoint, and `frontendOpenOrders` is main-dex only), seeded
 * once over REST and kept live by the per-dex `openOrders` WS channel.
 *
 * Unlike the main-dex {@link usePerpsOpenOrders} — which refetches the *rich*
 * `frontendOpenOrders` shape on each WS notification — the builder dexs only
 * expose the minimal `openOrders` payload, which the WS channel pushes directly
 * (full snapshot per dex). That payload omits trigger / TP-SL metadata, so
 * those legs render as plain limits; acceptable for builder markets today.
 *
 * `clearinghouseRefreshNonce` re-seeds over REST for immediacy after local
 * actions; `wsResubscribeNonce` forces a fresh WS subscribe after a reconnect.
 * Best-effort: a failing dex is skipped, and WS parse failures are ignored.
 */
export const useHip3OpenOrders = (
  user: Address | undefined
): Hip3OpenOrdersAggregate => {
  const { manager, ready, clearinghouseRefreshNonce, wsResubscribeNonce } =
    usePerps()
  const hip3Markets = useHip3Markets()

  const dexes = useMemo(() => hip3DexNames(hip3Markets), [hip3Markets])
  const dexKey = dexes.join(',')
  const enabled =
    ready && manager !== null && user !== undefined && dexes.length > 0
  const scopeKey =
    user !== undefined && dexes.length > 0 ? `${user}|${dexKey}` : ''

  /** Latest open orders per builder dex (seeded by REST, kept live by WS). */
  const [ordersByDex, setOrdersByDex] = useState<
    Record<string, readonly OpenOrder[]>
  >(() => initialOrdersFor(scopeKey))
  const [seeded, setSeeded] = useState(() => isScopeSeeded(scopeKey))
  /** `user|dexKey` of the cached orders — used to drop them on an account / dex switch. */
  const scopeRef = useRef('')

  // Keep the module cache warm so a remount starts from the last known orders
  // instead of an empty/loading state (avoids TP/SL-style blink on reload).
  useEffect(() => {
    if (scopeKey.length === 0) {
      return
    }
    hip3OrdersCache.set(scopeKey, ordersByDex)
    if (seeded) {
      hip3SeededScopes.add(scopeKey)
    }
  }, [scopeKey, ordersByDex, seeded])

  // Live per-dex WS subscriptions. `wsResubscribeNonce` forces a resubscribe
  // after a reconnect; `clearinghouseRefreshNonce` is intentionally NOT a dep
  // here (re-seeding is handled below without tearing down the sockets).
  useEffect(() => {
    if (!enabled || manager === null || user === undefined) {
      return
    }
    return startHip3OpenOrdersFeed({
      manager,
      user,
      dexes,
      scopeKey: `${user}|${dexKey}`,
      scopeRef,
      setState: setOrdersByDex,
      setSeeded
    })
  }, [enabled, manager, user, dexKey, dexes, wsResubscribeNonce])

  // REST seed (and re-seed after local trades via the refresh nonce), merged
  // into the same per-dex map without clearing it (no flicker).
  useEffect(() => {
    if (!enabled || manager === null || user === undefined) {
      return
    }
    return seedHip3OpenOrders({
      manager,
      user,
      dexes,
      setState: setOrdersByDex,
      setSeeded
    })
  }, [enabled, manager, user, dexKey, dexes, clearinghouseRefreshNonce])

  const aggregate = useMemo(
    () => aggregateHip3Orders(ordersByDex, dexes),
    [ordersByDex, dexes]
  )

  if (!enabled) {
    return EMPTY
  }
  return { orders: aggregate, isLoading: !seeded }
}

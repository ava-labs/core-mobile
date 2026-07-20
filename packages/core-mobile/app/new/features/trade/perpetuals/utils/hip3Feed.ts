import {
  parseClearinghouseWsPayload,
  parseOpenOrdersWsPayload,
  type Address,
  type AssetPosition,
  type ClearinghouseState,
  type OpenOrder,
  type PerpsManager
} from '@avalabs/perps-sdk'
import { type RefObject } from 'react'
import { PerpMarketData } from '../types'

/**
 * Shared building blocks for the HIP-3 (builder-dex) read paths. The per-dex WS
 * subscription setup, REST seed fan-out, and aggregation loops live here (as
 * module functions) so {@link useHip3Positions} and {@link useHip3OpenOrders}
 * stay flat — their effects just delegate to these and return the cleanup.
 */

type ClearinghouseMap = Record<string, ClearinghouseState>
type OrdersMap = Record<string, readonly OpenOrder[]>

type ClearinghouseSetter = (
  update: (prev: ClearinghouseMap) => ClearinghouseMap
) => void
type OrdersSetter = (update: (prev: OrdersMap) => OrdersMap) => void

/** Sorted, de-duplicated builder-dex names from the HIP-3 market list. */
export const hip3DexNames = (markets: readonly PerpMarketData[]): string[] => {
  const names = new Set<string>()
  for (const market of markets) {
    if (market.dex !== '') {
      names.add(market.dex)
    }
  }
  return [...names].sort()
}

/**
 * Reset the cached per-dex map (and seeded flag) when the `user|dexKey` scope
 * changes so one wallet's data can't leak into another while the new scope
 * seeds. No-op when the scope is unchanged (a reconnect resubscribe).
 */
const resetOnScopeChange = (
  scopeRef: RefObject<string>,
  scopeKey: string,
  clear: () => void,
  setSeeded: (seeded: boolean) => void
): void => {
  if (scopeRef.current !== scopeKey) {
    scopeRef.current = scopeKey
    clear()
    setSeeded(false)
  }
}

/**
 * Open the per-dex `clearinghouseState` WS subscriptions, folding each parsed
 * payload into the map. Returns the combined unsubscribe.
 */
export const startHip3ClearinghouseFeed = (params: {
  manager: PerpsManager
  user: Address
  dexes: readonly string[]
  scopeKey: string
  scopeRef: RefObject<string>
  setState: ClearinghouseSetter
  setSeeded: (seeded: boolean) => void
}): (() => void) => {
  const { manager, user, dexes, scopeKey, scopeRef, setState, setSeeded } =
    params
  resetOnScopeChange(scopeRef, scopeKey, () => setState(() => ({})), setSeeded)
  let cancelled = false
  const unsubs = dexes.map(dex =>
    manager.ws.subscribe({ type: 'clearinghouseState', user, dex }, data => {
      if (cancelled) {
        return
      }
      const next = parseClearinghouseWsPayload(data)
      if (next !== undefined) {
        setState(prev => ({ ...prev, [dex]: next }))
      }
    })
  )
  return () => {
    cancelled = true
    for (const unsub of unsubs) {
      unsub()
    }
  }
}

/**
 * REST-seed (or re-seed) every dex's clearinghouse into the map, marking the
 * feed seeded once all settle. Returns a cancel handle.
 */
export const seedHip3Clearinghouses = (params: {
  manager: PerpsManager
  user: Address
  dexes: readonly string[]
  setState: ClearinghouseSetter
  setSeeded: (seeded: boolean) => void
}): (() => void) => {
  const { manager, user, dexes, setState, setSeeded } = params
  let cancelled = false
  void Promise.allSettled(
    dexes.map(dex =>
      manager.info.getClearinghouseState(user, dex).then(ch => {
        if (cancelled) {
          return
        }
        setState(prev => ({
          ...prev,
          [dex]: {
            ...ch,
            assetPositions: Array.isArray(ch.assetPositions)
              ? ch.assetPositions
              : []
          }
        }))
      })
    )
  ).finally(() => {
    if (!cancelled) {
      setSeeded(true)
    }
  })
  return () => {
    cancelled = true
  }
}

/** Flatten the per-dex clearinghouse map into non-zero positions + summed value. */
export const aggregateHip3Positions = (
  statesByDex: ClearinghouseMap,
  dexes: readonly string[]
): { positions: AssetPosition[]; accountValueUsd: number } => {
  const positions: AssetPosition[] = []
  let accountValueUsd = 0
  for (const dex of dexes) {
    const ch = statesByDex[dex]
    if (ch === undefined) {
      continue
    }
    for (const assetPosition of ch.assetPositions ?? []) {
      if (Number.parseFloat(assetPosition.position.szi) !== 0) {
        positions.push(assetPosition)
      }
    }
    const value = Number.parseFloat(ch.marginSummary?.accountValue ?? '')
    if (Number.isFinite(value)) {
      accountValueUsd += value
    }
  }
  return { positions, accountValueUsd }
}

/**
 * Open the per-dex `openOrders` WS subscriptions, folding each parsed payload
 * into the map. Returns the combined unsubscribe.
 */
export const startHip3OpenOrdersFeed = (params: {
  manager: PerpsManager
  user: Address
  dexes: readonly string[]
  scopeKey: string
  scopeRef: RefObject<string>
  setState: OrdersSetter
  setSeeded: (seeded: boolean) => void
}): (() => void) => {
  const { manager, user, dexes, scopeKey, scopeRef, setState, setSeeded } =
    params
  resetOnScopeChange(scopeRef, scopeKey, () => setState(() => ({})), setSeeded)
  let cancelled = false
  const unsubs = dexes.map(dex =>
    manager.ws.subscribe({ type: 'openOrders', user, dex }, data => {
      if (cancelled) {
        return
      }
      const next = parseOpenOrdersWsPayload(data)
      if (next !== undefined) {
        setState(prev => ({ ...prev, [dex]: next }))
      }
    })
  )
  return () => {
    cancelled = true
    for (const unsub of unsubs) {
      unsub()
    }
  }
}

/**
 * REST-seed (or re-seed) every dex's open orders into the map, marking the feed
 * seeded once all settle. Returns a cancel handle.
 */
export const seedHip3OpenOrders = (params: {
  manager: PerpsManager
  user: Address
  dexes: readonly string[]
  setState: OrdersSetter
  setSeeded: (seeded: boolean) => void
}): (() => void) => {
  const { manager, user, dexes, setState, setSeeded } = params
  let cancelled = false
  void Promise.allSettled(
    dexes.map(dex =>
      manager.info.getOpenOrders(user, dex).then(list => {
        if (!cancelled) {
          setState(prev => ({ ...prev, [dex]: list }))
        }
      })
    )
  ).finally(() => {
    if (!cancelled) {
      setSeeded(true)
    }
  })
  return () => {
    cancelled = true
  }
}

/** Flatten the per-dex open-orders map into a single list. */
export const aggregateHip3Orders = (
  ordersByDex: OrdersMap,
  dexes: readonly string[]
): OpenOrder[] => {
  const orders: OpenOrder[] = []
  for (const dex of dexes) {
    const list = ordersByDex[dex]
    if (list !== undefined) {
      orders.push(...list)
    }
  }
  return orders
}

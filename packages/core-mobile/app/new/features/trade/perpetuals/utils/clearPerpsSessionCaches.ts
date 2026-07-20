import type {
  Address,
  ClearinghouseState,
  InfoOrderStatusWire,
  OpenOrder
} from '@avalabs/perps-sdk'

const perpsOpenOrdersCache = new Map<Address, readonly InfoOrderStatusWire[]>()
const perpsOpenOrdersLoadedUsers = new Set<Address>()
const perpsStickyTriggers = new Map<
  string,
  { takeProfit: number; stopLoss: number }
>()
const hip3OpenOrdersCache = new Map<
  string,
  Record<string, readonly OpenOrder[]>
>()
const hip3OpenOrdersSeededScopes = new Set<string>()
const hip3PositionsCache = new Map<string, Record<string, ClearinghouseState>>()
const hip3PositionsSeededScopes = new Set<string>()

let generation = 0

export const getPerpsSessionCacheGeneration = (): number => generation
export const getCachedPerpsOpenOrders = (
  user: Address
): readonly InfoOrderStatusWire[] | undefined => perpsOpenOrdersCache.get(user)
export const hasLoadedPerpsOpenOrders = (user: Address): boolean =>
  perpsOpenOrdersLoadedUsers.has(user)
export const setCachedPerpsOpenOrders = (
  user: Address,
  orders: readonly InfoOrderStatusWire[]
): void => {
  perpsOpenOrdersCache.set(user, orders)
  perpsOpenOrdersLoadedUsers.add(user)
}

type StickyTriggers = { takeProfit: number; stopLoss: number }

export const getCachedPerpsStickyTriggers = (
  key: string
): StickyTriggers | undefined => perpsStickyTriggers.get(key)
export const setCachedPerpsStickyTriggers = (
  key: string,
  triggers: StickyTriggers
): void => {
  perpsStickyTriggers.set(key, triggers)
}

export const getCachedHip3OpenOrders = (
  scopeKey: string
): Record<string, readonly OpenOrder[]> | undefined =>
  hip3OpenOrdersCache.get(scopeKey)
export const hasSeededHip3OpenOrders = (scopeKey: string): boolean =>
  hip3OpenOrdersSeededScopes.has(scopeKey)
export const setCachedHip3OpenOrders = (
  scopeKey: string,
  orders: Record<string, readonly OpenOrder[]>,
  seeded: boolean
): void => {
  hip3OpenOrdersCache.set(scopeKey, orders)
  if (seeded) {
    hip3OpenOrdersSeededScopes.add(scopeKey)
  }
}

export const getCachedHip3Positions = (
  scopeKey: string
): Record<string, ClearinghouseState> | undefined =>
  hip3PositionsCache.get(scopeKey)
export const hasSeededHip3Positions = (scopeKey: string): boolean =>
  hip3PositionsSeededScopes.has(scopeKey)
export const setCachedHip3Positions = (
  scopeKey: string,
  positions: Record<string, ClearinghouseState>,
  seeded: boolean
): void => {
  hip3PositionsCache.set(scopeKey, positions)
  if (seeded) {
    hip3PositionsSeededScopes.add(scopeKey)
  }
}

/**
 * Drops in-memory trading data that may outlive mounted perps screens.
 * Account switching remains warm through address-scoped caches; signing out
 * clears every scope so trading data cannot survive the wallet session.
 */
export const clearPerpsSessionCaches = (): void => {
  generation += 1
  perpsOpenOrdersCache.clear()
  perpsOpenOrdersLoadedUsers.clear()
  perpsStickyTriggers.clear()
  hip3OpenOrdersCache.clear()
  hip3OpenOrdersSeededScopes.clear()
  hip3PositionsCache.clear()
  hip3PositionsSeededScopes.clear()
}

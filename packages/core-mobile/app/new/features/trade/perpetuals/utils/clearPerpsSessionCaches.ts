import { clearHip3OpenOrdersCache } from '../hooks/useHip3OpenOrders'
import { clearHip3PositionsCache } from '../hooks/useHip3Positions'
import { clearPerpsOpenOrdersCache } from '../hooks/usePerpsOpenOrders'
import { clearPerpsStickyTriggers } from '../hooks/usePerpsPositionsView'

/**
 * Drops in-memory trading data that may outlive mounted perps screens.
 * Account switching remains warm through address-scoped caches; signing out
 * clears every scope so trading data cannot survive the wallet session.
 */
export const clearPerpsSessionCaches = (): void => {
  clearPerpsOpenOrdersCache()
  clearHip3OpenOrdersCache()
  clearHip3PositionsCache()
  clearPerpsStickyTriggers()
}

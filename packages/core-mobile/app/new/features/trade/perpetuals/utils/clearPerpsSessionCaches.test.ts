import type { Address } from '@avalabs/perps-sdk'
import {
  clearPerpsSessionCaches,
  getCachedHip3OpenOrders,
  getCachedHip3Positions,
  getCachedPerpsOpenOrders,
  getCachedPerpsStickyTriggers,
  getPerpsSessionCacheGeneration,
  hasLoadedPerpsOpenOrders,
  hasSeededHip3OpenOrders,
  hasSeededHip3Positions,
  setCachedHip3OpenOrders,
  setCachedHip3Positions,
  setCachedPerpsOpenOrders,
  setCachedPerpsStickyTriggers
} from './clearPerpsSessionCaches'

describe('clearPerpsSessionCaches', () => {
  beforeEach(clearPerpsSessionCaches)

  it('clears every address-scoped perps cache', () => {
    const address = '0x0000000000000000000000000000000000000001' as Address
    const scopeKey = `${address}|dex`
    const triggerKey = `${address}|BTC`
    setCachedPerpsOpenOrders(address, [])
    setCachedPerpsStickyTriggers(triggerKey, {
      takeProfit: 100,
      stopLoss: 50
    })
    setCachedHip3OpenOrders(scopeKey, {}, true)
    setCachedHip3Positions(scopeKey, {}, true)
    const generation = getPerpsSessionCacheGeneration()

    clearPerpsSessionCaches()

    expect(getCachedPerpsOpenOrders(address)).toBeUndefined()
    expect(hasLoadedPerpsOpenOrders(address)).toBe(false)
    expect(getCachedPerpsStickyTriggers(triggerKey)).toBeUndefined()
    expect(getCachedHip3OpenOrders(scopeKey)).toBeUndefined()
    expect(hasSeededHip3OpenOrders(scopeKey)).toBe(false)
    expect(getCachedHip3Positions(scopeKey)).toBeUndefined()
    expect(hasSeededHip3Positions(scopeKey)).toBe(false)
    expect(getPerpsSessionCacheGeneration()).toBe(generation + 1)
  })
})

import { clearHip3OpenOrdersCache } from '../hooks/useHip3OpenOrders'
import { clearHip3PositionsCache } from '../hooks/useHip3Positions'
import { clearPerpsOpenOrdersCache } from '../hooks/usePerpsOpenOrders'
import { clearPerpsStickyTriggers } from '../hooks/usePerpsPositionsView'
import { clearPerpsSessionCaches } from './clearPerpsSessionCaches'

jest.mock('../hooks/useHip3OpenOrders', () => ({
  clearHip3OpenOrdersCache: jest.fn()
}))
jest.mock('../hooks/useHip3Positions', () => ({
  clearHip3PositionsCache: jest.fn()
}))
jest.mock('../hooks/usePerpsOpenOrders', () => ({
  clearPerpsOpenOrdersCache: jest.fn()
}))
jest.mock('../hooks/usePerpsPositionsView', () => ({
  clearPerpsStickyTriggers: jest.fn()
}))

describe('clearPerpsSessionCaches', () => {
  it('clears every address-scoped perps cache', () => {
    clearPerpsSessionCaches()

    expect(clearPerpsOpenOrdersCache).toHaveBeenCalledTimes(1)
    expect(clearHip3OpenOrdersCache).toHaveBeenCalledTimes(1)
    expect(clearHip3PositionsCache).toHaveBeenCalledTimes(1)
    expect(clearPerpsStickyTriggers).toHaveBeenCalledTimes(1)
  })
})

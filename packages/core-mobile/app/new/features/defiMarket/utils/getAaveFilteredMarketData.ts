import type { AaveReserveData } from '../types'

export const getAaveFilteredMarketData = (
  marketData: readonly AaveReserveData[]
): AaveReserveData[] => {
  if (!marketData?.length) {
    return []
  }

  return marketData.filter(market => !market.isPaused && !market.isFrozen)
}

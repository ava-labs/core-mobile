import { MarketToken } from 'store/watchlist'

export const compareTokenPriceChangePercentage24h = (
  token1: MarketToken,
  token2: MarketToken
): number => {
  const percentChange1 = token1.priceChangePercentage24h ?? 0
  const percentChange2 = token2.priceChangePercentage24h ?? 0

  return percentChange1 - percentChange2
}

const zeroThreshold = 0.000001

export const isEffectivelyZero = (value: number): boolean => {
  return Math.abs(value) < zeroThreshold
}

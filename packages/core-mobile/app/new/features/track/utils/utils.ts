import { SUPPORTED_PLATFORM_ID } from 'common/consts/swap'
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

export const getTokenAddress = (
  token: MarketToken | undefined
): string | undefined => {
  if (!token) return undefined

  return 'platforms' in token
    ? token.platforms[SUPPORTED_PLATFORM_ID]
    : undefined
}

export const getTokenChainId = (
  token: MarketToken | undefined
): number | undefined => {
  return token &&
    'platforms' in token &&
    token.platforms &&
    token.platforms[SUPPORTED_PLATFORM_ID] &&
    token.platforms[SUPPORTED_PLATFORM_ID].length > 0
    ? Number(SUPPORTED_PLATFORM_ID.split(':')[1])
    : undefined
}

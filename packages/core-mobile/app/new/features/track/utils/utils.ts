import { caip2ChainIds } from 'consts/caip2ChainIds'
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
    ? token.platforms[caip2ChainIds.C_CHAIN]
    : undefined
}

export const getTokenChainId = (
  token: MarketToken | undefined
): number | undefined => {
  return token &&
    'platforms' in token &&
    token.platforms &&
    (token.platforms[caip2ChainIds.C_CHAIN]?.length ?? 0) > 0
    ? Number(caip2ChainIds.C_CHAIN.split(':')[1])
    : undefined
}

import { dexOfCoin, namespacedCoin, tickerOfCoin } from '@avalabs/perps-sdk'

export { dexOfCoin, namespacedCoin, tickerOfCoin }

/**
 * A HIP-3 (builder-deployed) coin is namespaced as `dex:TICKER` (e.g. `xyz:GOLD`),
 * whereas native Hyperliquid perps are bare tickers (e.g. `BTC`).
 */
export const isHip3Coin = (coin: string): boolean => coin.includes(':')

export type ParsedCoin = {
  /** Builder dex name, or `''` for main-dex coins. */
  readonly dex: string
  /** Asset ticker without the dex prefix. */
  readonly ticker: string
}

/** Split a coin id into its dex prefix and display ticker. */
export const parseCoin = (coin: string): ParsedCoin => ({
  dex: dexOfCoin(coin),
  ticker: tickerOfCoin(coin)
})

/** Decode a route/query coin param (`xyz%3AGOLD` → `xyz:GOLD`). */
export const decodePerpCoinParam = (param: string): string => {
  try {
    return decodeURIComponent(param)
  } catch {
    return param
  }
}

/**
 * Normalize a deep-link / query coin param to its canonical Hyperliquid id.
 *
 * Main perps are upper-cased (`btc` → `BTC`). HIP-3 coins are namespaced
 * (`xyz:gold` → `xyz:GOLD`): the dex prefix is case-significant and must be
 * preserved; only the ticker is upper-cased. Blind `.toUpperCase()` on the
 * whole string breaks HIP-3 lookups (`XYZ:CL` → wrong dex).
 */
export const normalizePerpCoinParam = (param: string): string => {
  const decoded = decodePerpCoinParam(param)
  if (isHip3Coin(decoded)) {
    const { dex, ticker } = parseCoin(decoded)
    return `${dex}:${ticker.toUpperCase()}`
  }
  return decoded.toUpperCase()
}

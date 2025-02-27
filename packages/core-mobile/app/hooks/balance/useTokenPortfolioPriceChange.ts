import { LocalTokenWithBalance } from 'store/balance/types'
import { MarketToken } from 'store/watchlist/types'
import { useWatchlist } from '../watchlist/useWatchlist'

export const useTokenPortfolioPriceChange = (
  tokens: LocalTokenWithBalance[]
): { tokenPortfolioPriceChange: number } => {
  const { getMarketTokenBySymbol } = useWatchlist()

  const tokensWithPrices = tokens
    .map(token => {
      const tokenInWatchlist = getMarketTokenBySymbol(token.symbol)

      if (tokenInWatchlist) {
        return { ...token, ...tokenInWatchlist }
      } else {
        return undefined
      }
    })
    .filter((x): x is LocalTokenWithBalance & MarketToken => x !== undefined)

  const tokenPortfolioPriceChange = tokensWithPrices.reduce((acc, token) => {
    const priceDiff =
      (token.balanceInCurrency ?? 0 * (token.priceChangePercentage24h ?? 0)) /
      100
    return acc + priceDiff
  }, 0)

  return { tokenPortfolioPriceChange }
}

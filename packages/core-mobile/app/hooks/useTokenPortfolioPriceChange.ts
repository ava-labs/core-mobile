import { LocalTokenWithBalance } from 'store/balance'
import { MarketToken } from 'store/watchlist'
import { useGetMarketToken } from './useGetMarketToken'

export const useTokenPortfolioPriceChange = (
  tokens: LocalTokenWithBalance[]
): { tokenPortfolioPriceChange: number } => {
  const { getMarketToken } = useGetMarketToken()

  const tokensWithPrices = tokens
    .map(token => {
      const tokenInWatchlist = getMarketToken(token.symbol)

      if (tokenInWatchlist) {
        return { ...token, ...tokenInWatchlist }
      } else {
        return undefined
      }
    })
    .filter((x): x is LocalTokenWithBalance & MarketToken => x !== undefined)

  const tokenPortfolioPriceChange = tokensWithPrices.reduce((acc, token) => {
    const priceDiff =
      (token.balanceInCurrency * (token.priceChangePercentage24h ?? 0)) / 100
    return acc + priceDiff
  }, 0)

  return { tokenPortfolioPriceChange }
}

import { LocalTokenWithBalance } from 'store/balance'
import { MarketToken, selectWatchlistTokens } from 'store/watchlist'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'

export const useTokensPriceChange = (
  tokens: LocalTokenWithBalance[]
): { priceChange: number } => {
  const watchlistTokenDictionary = useFocusedSelector(selectWatchlistTokens)
  const watchlistTokens = Object.values(watchlistTokenDictionary)

  const tokensWithPrices = tokens
    .map(token => {
      const tokenInWatchlist = watchlistTokens.find(
        t2 => t2.symbol === token.symbol.toLowerCase()
      )

      if (tokenInWatchlist) {
        return { ...token, ...tokenInWatchlist }
      } else {
        return undefined
      }
    })
    .filter((x): x is LocalTokenWithBalance & MarketToken => x !== undefined)

  const priceChange = tokensWithPrices.reduce((acc, token) => {
    const diff =
      (token.balanceInCurrency * (token.priceChangePercentage24h ?? 0)) / 100
    return acc + diff
  }, 0)

  return { priceChange }
}

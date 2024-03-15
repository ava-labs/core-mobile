import { LocalTokenWithBalance } from 'store/balance'
import { selectWatchlistCharts, selectWatchlistTokens } from 'store/watchlist'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'

export const useTokensPriceChange = (
  tokens: LocalTokenWithBalance[]
): { priceChange: number } => {
  const watchlistTokens = useFocusedSelector(selectWatchlistTokens)
  const charts = useFocusedSelector(selectWatchlistCharts)

  const tokensWithPrices = tokens
    .map(t => {
      const tokenInWatchlist = watchlistTokens.find(
        t2 => t2.symbol === t.symbol.toLowerCase()
      )

      if (tokenInWatchlist) {
        return { ...t, id: tokenInWatchlist.id }
      } else {
        return undefined
      }
    })
    .filter((x): x is LocalTokenWithBalance & { id: string } => x !== undefined)

  const priceChange = tokensWithPrices.reduce((acc, token) => {
    const chart = charts[token.id]
    if (!chart) return acc
    const diff =
      (token.balanceInCurrency *
        (chart.ranges.diffValue > 0
          ? +chart.ranges.percentChange
          : -chart.ranges.percentChange)) /
      100
    return acc + diff
  }, 0)

  return { priceChange }
}

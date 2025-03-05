import { Charts, MarketToken, Prices } from 'store/watchlist'
import watchlistService from 'services/watchlist/WatchlistService'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useQuery, UseQueryResult } from '@tanstack/react-query'

const EMPTY_DATA = { tokens: [], prices: {}, charts: {} }

type Props = {
  isFetchingTokens: boolean
  items: MarketToken[]
  searchText: string | undefined
}

export function useTokenSearch({
  isFetchingTokens,
  items,
  searchText
}: Props): UseQueryResult<
  { tokens: MarketToken[]; prices: Prices; charts: Charts },
  Error
> {
  const currency = useFocusedSelector(selectSelectedCurrency).toLowerCase()

  return useQuery({
    queryKey: [
      ReactQueryKeys.WATCHLIST_TOKEN_SEARCH,
      currency,
      searchText,
      isFetchingTokens
    ],
    queryFn: () => {
      if (isFetchingTokens) return

      if (searchText && searchText.length > 0) {
        const tokens = items.filter(
          i =>
            i.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            i.symbol?.toLowerCase().includes(searchText.toLowerCase())
        )

        if (tokens.length > 0) {
          // we already have these tokens in the list
          // no need to search for prices and charts
          // it will reuse the existing prices and charts data in the screen
          return { tokens, prices: {}, charts: {} }
        }

        return watchlistService.tokenSearch(searchText, currency) ?? EMPTY_DATA
      }
      return EMPTY_DATA
    }
  })
}

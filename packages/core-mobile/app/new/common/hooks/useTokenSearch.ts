import { Charts, MarketToken, Prices } from 'store/watchlist'
import watchlistService from 'services/watchlist/WatchlistService'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useQuery, UseQueryResult } from '@tanstack/react-query'

type TokenSearchType = {
  tokens: MarketToken[] | undefined
  charts: Charts | undefined
  prices: Prices | undefined
}

const EMPTY_DATA: TokenSearchType = {
  tokens: [],
  prices: undefined,
  charts: undefined
}

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
  { tokens: MarketToken[]; prices?: Prices; charts?: Charts },
  Error
> {
  const currency = useFocusedSelector(selectSelectedCurrency).toLowerCase()

  return useQuery({
    enabled: searchText !== undefined && searchText.length > 0,
    queryKey: [
      ReactQueryKeys.WATCHLIST_TOKEN_SEARCH,
      currency,
      searchText,
      isFetchingTokens
    ],
    queryFn: async () => {
      if (
        isFetchingTokens ||
        searchText === undefined ||
        searchText.length === 0
      )
        return EMPTY_DATA

      const tokens = items.filter(i => {
        const lowerCaseSearchText = searchText.toLowerCase()
        return (
          i.name.toLowerCase().includes(lowerCaseSearchText) ||
          i.symbol.toLowerCase().includes(lowerCaseSearchText) ||
          i.id.toLowerCase().includes(lowerCaseSearchText)
        )
      })

      if (tokens.length > 0) {
        // we already have these tokens in the list
        // no need to search for prices and charts
        // it will reuse the existing prices and charts data in the screen
        return { tokens, prices: undefined, charts: undefined }
      }

      try {
        const result = await watchlistService.tokenSearch(searchText, currency)
        return result ?? EMPTY_DATA
      } catch {
        return EMPTY_DATA
      }
    }
  })
}

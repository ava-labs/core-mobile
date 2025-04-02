import { Charts, MarketToken, Prices } from 'store/watchlist'
import watchlistService from 'services/watchlist/WatchlistService'
import { useCallback, useEffect, useState } from 'react'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { selectSelectedCurrency } from 'store/settings/currency'

type TokenSearchType = {
  tokens: MarketToken[] | undefined
  charts: Charts | undefined
  prices: Prices | undefined
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
}: Props): {
  isSearchingTokens: boolean
  searchResults: TokenSearchType | undefined
} {
  const currency = useFocusedSelector(selectSelectedCurrency).toLowerCase()
  const [isSearchingTokens, setIsSearchingTokens] = useState(false)
  const [searchResults, setSearchResults] = useState<TokenSearchType>()

  const searchAsync = useCallback(async (): Promise<void> => {
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
        setSearchResults({ tokens, prices: undefined, charts: undefined })
        return
      }

      setIsSearchingTokens(true)

      const searchResult = await queryClient.fetchQuery({
        queryKey: [ReactQueryKeys.WATCHLIST_TOKEN_SEARCH, currency, searchText],
        queryFn: () => watchlistService.tokenSearch(searchText, currency)
      })

      if (searchResult) {
        setSearchResults(searchResult)
      }
      setIsSearchingTokens(false)
    } else {
      setSearchResults(undefined)
    }
  }, [currency, isFetchingTokens, items, searchText])

  useEffect(() => {
    searchAsync()
  }, [searchAsync])

  return {
    isSearchingTokens,
    searchResults
  }
}

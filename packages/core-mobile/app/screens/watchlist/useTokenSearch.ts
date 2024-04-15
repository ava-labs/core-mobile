import { MarketToken } from 'store/watchlist'
import watchlistService from 'services/watchlist/WatchlistService'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'

type Props = {
  isFetchingTokens: boolean
  items: MarketToken[]
  searchText: string | undefined
  currency: string
}

export function useTokenSearch({
  isFetchingTokens,
  items,
  searchText,
  currency
}: Props): {
  isSearchingTokens: boolean
  searchResults: MarketToken[] | undefined
} {
  const dispatch = useDispatch()
  const [isSearchingTokens, setIsSearchingTokens] = useState(false)
  const [searchResults, setSearchResults] = useState<MarketToken[]>()

  useEffect(() => {
    async function searchAsync(): Promise<void> {
      if (isFetchingTokens) return

      if (searchText && searchText.length > 0) {
        let filteredItems = items.filter(
          i =>
            i.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            i.symbol?.toLowerCase().includes(searchText.toLowerCase())
        )

        if (filteredItems.length === 0) {
          setIsSearchingTokens(true)

          const searchResult = await queryClient.fetchQuery({
            queryKey: [
              ReactQueryKeys.WATCHLIST_TOKEN_SEARCH,
              currency,
              searchText
            ],
            queryFn: () => watchlistService.tokenSearch(searchText, currency)
          })

          if (searchResult) {
            filteredItems = searchResult.tokens
          }
          setIsSearchingTokens(false)
        }
        setSearchResults(filteredItems)
      } else {
        setSearchResults(undefined)
      }
    }

    searchAsync()
  }, [isFetchingTokens, items, searchText, currency, dispatch])

  return {
    isSearchingTokens,
    searchResults
  }
}

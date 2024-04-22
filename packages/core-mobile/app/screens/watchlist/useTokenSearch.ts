import { Charts, MarketToken, Prices } from 'store/watchlist'
import watchlistService from 'services/watchlist/WatchlistService'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'

type TokenSearchType = {
  tokens: MarketToken[] | undefined
  charts: Charts | undefined
  prices: Prices | undefined
}

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
  searchResults: TokenSearchType | undefined
} {
  const dispatch = useDispatch()
  const [isSearchingTokens, setIsSearchingTokens] = useState(false)
  const [searchResults, setSearchResults] = useState<TokenSearchType>()

  useEffect(() => {
    async function searchAsync(): Promise<void> {
      if (isFetchingTokens) return

      if (searchText && searchText.length > 0) {
        const tokens = items.filter(
          i =>
            i.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            i.symbol?.toLowerCase().includes(searchText.toLowerCase())
        )

        if (tokens.length > 0) {
          setSearchResults({ tokens, prices: {}, charts: {} })
          return
        }

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
          setSearchResults(searchResult)
        }
        setIsSearchingTokens(false)
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

import {
  appendTokens,
  MarketToken,
  setCharts,
  setPrices
} from 'store/watchlist'
import watchlistService from 'services/watchlist/WatchlistService'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

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
}: Props) {
  const dispatch = useDispatch()
  const [isSearchingTokens, setIsSearchingTokens] = useState(false)
  const [searchResults, setSearchResults] = useState<MarketToken[] | undefined>(
    undefined
  )

  useEffect(() => {
    async function searchAsync() {
      if (isFetchingTokens) return

      if (searchText && searchText.length > 0) {
        let filteredItems = items.filter(
          i =>
            i.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            i.symbol?.toLowerCase().includes(searchText.toLowerCase())
        )

        if (filteredItems.length === 0) {
          setIsSearchingTokens(true)

          const searchResult = await watchlistService.tokenSearch(
            searchText,
            currency
          )

          if (searchResult) {
            filteredItems = searchResult.tokens
            // save results to the list
            dispatch(appendTokens(searchResult.tokens))

            // also save prices and charts data so we can reuse them in the Favorites tab
            dispatch(setPrices(searchResult.prices))
            dispatch(setCharts(searchResult.charts))
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

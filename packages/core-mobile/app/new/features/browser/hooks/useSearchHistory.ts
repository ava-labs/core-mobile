import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { History } from 'store/browser'
import { selectAllHistories } from 'store/browser/slices/globalHistory'

interface ReturnProps {
  searchText: string
  setSearchText: (text: string) => void
  trimmedSearchText: string
  filterHistories: History[]
  hasHistory: boolean
}

export const useSearchHistory = (): ReturnProps => {
  const histories = useSelector(selectAllHistories)

  const [searchText, setSearchText] = useState('')
  const hasHistory = histories.length > 0

  const trimmedSearchText = useMemo(() => searchText.trim(), [searchText])

  const filterHistories = useMemo((): History[] => {
    const sortedHistories = [...histories].sort(
      (a, b) => b.lastVisited - a.lastVisited
    )
    if (!trimmedSearchText.length) return sortedHistories

    const query = trimmedSearchText.toLowerCase()
    return sortedHistories.filter(h => h.title.toLowerCase().includes(query))
  }, [histories, trimmedSearchText])

  return {
    searchText,
    setSearchText,
    trimmedSearchText,
    filterHistories,
    hasHistory
  }
}

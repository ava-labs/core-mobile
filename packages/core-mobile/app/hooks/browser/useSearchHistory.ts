import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { History } from 'store/browser'
import { selectAllHistories } from 'store/browser/slices/globalHistory'

interface ReturnProps {
  searchText: string
  setSearchText: (text: string) => void
  trimmedSearchText: string
  filteredHistory: History[]
  hasHistory: boolean
}

export const useSearchHistory = (): ReturnProps => {
  const history = useSelector(selectAllHistories)

  const [searchText, setSearchText] = useState('')
  const hasHistory = history.length > 0

  const trimmedSearchText = useMemo(() => {
    return searchText.trim()
  }, [searchText])

  const filteredHistory = useMemo((): History[] => {
    const sortedHistory = [...history].sort(
      (a, b) => b.lastVisited - a.lastVisited
    )
    if (!trimmedSearchText.length) return sortedHistory

    const query = trimmedSearchText.toLowerCase()
    return sortedHistory.filter(h => h.title.toLowerCase().includes(query))
  }, [history, trimmedSearchText])

  return {
    searchText,
    setSearchText,
    trimmedSearchText,
    filteredHistory,
    hasHistory
  }
}

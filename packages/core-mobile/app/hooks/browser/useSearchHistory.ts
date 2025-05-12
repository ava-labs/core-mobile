import { useEffect, useMemo, useState } from 'react'
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
  const [filteredHistory, setFilteredHistory] = useState(history)
  const hasHistory = history.length > 0

  const trimmedSearchText = useMemo(() => {
    return searchText.trim()
  }, [searchText])

  useEffect(() => {
    const sortedHistory = [...history].sort(
      (a, b) => b.lastVisited - a.lastVisited
    )
    if (trimmedSearchText.length > 0 && sortedHistory.length > 0) {
      const newHistory = sortedHistory.filter(history => {
        return history.title
          .toLowerCase()
          .includes(trimmedSearchText.toLowerCase())
      })
      setFilteredHistory(newHistory)
      return
    }
    setFilteredHistory(sortedHistory)
  }, [history, trimmedSearchText])

  return {
    searchText,
    setSearchText,
    trimmedSearchText,
    filteredHistory,
    hasHistory
  }
}

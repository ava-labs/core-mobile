import { useEffect, useMemo, useState } from 'react'
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
  const [filterHistories, setFilterHistories] = useState(histories)
  const hasHistory = histories.length > 0

  const trimmedSearchText = useMemo(() => searchText.trim(), [searchText])

  useEffect(() => {
    const sortedHistories = [...histories].sort(
      (a, b) => b.lastVisited - a.lastVisited
    )
    if (trimmedSearchText.length > 0 && sortedHistories.length > 0) {
      const filteredHistories = sortedHistories.filter(history => {
        return history.title
          .toLowerCase()
          .includes(trimmedSearchText.toLowerCase())
      })
      setFilterHistories(filteredHistories)
      return
    }
    setFilterHistories(sortedHistories)
  }, [histories, trimmedSearchText])

  return {
    searchText,
    setSearchText,
    trimmedSearchText,
    filterHistories,
    hasHistory
  }
}

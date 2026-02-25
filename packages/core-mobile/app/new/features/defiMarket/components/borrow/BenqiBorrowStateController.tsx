import { useEffect } from 'react'
import { useBenqiBorrowPositionsSummary } from '../../hooks/benqi/useBenqiBorrowPositionsSummary'
import type { BorrowContentState } from './BorrowTabContent'

export const BenqiBorrowStateController = ({
  onStateChange
}: {
  onStateChange: (state: BorrowContentState) => void
}): null => {
  const { positions, summary, isLoading, isFetching, isRefreshing, refresh } =
    useBenqiBorrowPositionsSummary()

  useEffect(() => {
    onStateChange({
      positions,
      summary,
      isLoading,
      isFetching,
      isRefreshing,
      refresh
    })
  }, [
    positions,
    summary,
    isLoading,
    isFetching,
    isRefreshing,
    refresh,
    onStateChange
  ])

  return null
}

import { useEffect } from 'react'
import { useAaveBorrowPositionsSummary } from '../../hooks/aave/useAaveBorrowPositionsSummary'
import type { BorrowContentState } from './BorrowTabContent'

export const AaveBorrowStateController = ({
  onStateChange
}: {
  onStateChange: (state: BorrowContentState) => void
}): null => {
  const { positions, summary, isLoading, isRefreshing, refresh } =
    useAaveBorrowPositionsSummary()

  useEffect(() => {
    onStateChange({
      positions,
      summary,
      isLoading,
      isRefreshing,
      refresh
    })
  }, [positions, summary, isLoading, isRefreshing, refresh, onStateChange])

  return null
}

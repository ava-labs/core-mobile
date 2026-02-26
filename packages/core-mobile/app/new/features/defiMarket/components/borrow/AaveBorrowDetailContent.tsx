import React, { useMemo } from 'react'
import { useAaveBorrowPositionsSummary } from '../../hooks/aave/useAaveBorrowPositionsSummary'
import { MarketNames } from '../../types'
import { BorrowDetailContent } from './BorrowDetailContent'

interface AaveBorrowDetailContentProps {
  marketId: string | undefined
}

export function AaveBorrowDetailContent({
  marketId
}: AaveBorrowDetailContentProps): JSX.Element {
  const { positions, isLoading } = useAaveBorrowPositionsSummary()

  const borrowPosition = useMemo(() => {
    return positions.find(p => p.market.uniqueMarketId === marketId)
  }, [positions, marketId])

  return (
    <BorrowDetailContent
      borrowPosition={borrowPosition}
      isLoading={isLoading}
      protocol={MarketNames.aave}
    />
  )
}

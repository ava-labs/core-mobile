import React, { useMemo } from 'react'
import { useBenqiBorrowPositionsSummary } from '../../hooks/benqi/useBenqiBorrowPositionsSummary'
import { BorrowDetailContent } from './BorrowDetailContent'

interface BenqiBorrowDetailContentProps {
  marketId: string | undefined
}

export function BenqiBorrowDetailContent({
  marketId
}: BenqiBorrowDetailContentProps): JSX.Element {
  const { positions, isLoading } = useBenqiBorrowPositionsSummary()

  const borrowPosition = useMemo(() => {
    return positions.find(p => p.market.uniqueMarketId === marketId)
  }, [positions, marketId])

  return (
    <BorrowDetailContent
      borrowPosition={borrowPosition}
      isLoading={isLoading}
    />
  )
}

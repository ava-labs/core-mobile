import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { ErrorState } from 'common/components/ErrorState'
import { AaveBorrowDetailContent } from '../components/borrow/AaveBorrowDetailContent'
import { BenqiBorrowDetailContent } from '../components/borrow/BenqiBorrowDetailContent'
import { MarketNames } from '../types'

export function BorrowDetailScreen(): JSX.Element {
  const { marketId, protocol } = useLocalSearchParams<{
    marketId: string
    protocol: string
  }>()

  if (protocol === MarketNames.aave) {
    return <AaveBorrowDetailContent marketId={marketId} />
  }

  if (protocol === MarketNames.benqi) {
    return <BenqiBorrowDetailContent marketId={marketId} />
  }

  return (
    <BlurredBarsContentLayout>
      <ErrorState
        sx={{ flex: 1 }}
        title="Unknown protocol"
        description="Unable to load borrow details"
      />
    </BlurredBarsContentLayout>
  )
}

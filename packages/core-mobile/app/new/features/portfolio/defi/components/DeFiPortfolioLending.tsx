import React from 'react'
import { DeFiLendingItem } from 'services/defi/types'
import { Card, Separator } from '@avalabs/k2-alpine'
import { DeFiLendingSection } from './DeFiLendingSection'

export const DeFiPortfolioLending = ({
  items
}: {
  items: DeFiLendingItem[]
}): JSX.Element => {
  return (
    <>
      {items.map(({ supplyTokens, borrowTokens, rewardTokens }, index) => (
        <Card
          key={`defi-lending-${index}`}
          sx={{
            alignItems: 'stretch',
            padding: 0
          }}>
          {supplyTokens && supplyTokens?.length > 0 && (
            <DeFiLendingSection header={'Supplied'} tokens={supplyTokens} />
          )}
          {borrowTokens && borrowTokens?.length > 0 && (
            <>
              <Separator sx={{ marginHorizontal: 16 }} />
              <DeFiLendingSection header={'Borrowed'} tokens={borrowTokens} />
            </>
          )}
          {rewardTokens && rewardTokens?.length > 0 && (
            <>
              <Separator sx={{ marginHorizontal: 16 }} />
              <DeFiLendingSection header={'Rewards'} tokens={rewardTokens} />
            </>
          )}
        </Card>
      ))}
    </>
  )
}

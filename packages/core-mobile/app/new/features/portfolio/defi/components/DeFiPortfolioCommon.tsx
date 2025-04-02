import React from 'react'
import { DeFiCommonItem } from 'services/defi/types'
import { Card, Separator, View } from '@avalabs/k2-alpine'
import { DeFiCommonRow } from './DeFiCommonRow'

export const DeFiPortfolioCommon = ({
  items,
  header
}: {
  header: string
  items: DeFiCommonItem[]
}): JSX.Element => {
  return (
    <View sx={{ gap: 10 }}>
      {items.map(({ supplyTokens = [], rewardTokens = [] }, index) => (
        <Card sx={{ alignItems: 'stretch', padding: 0 }} key={index}>
          {supplyTokens && supplyTokens?.length > 0 && (
            <DeFiCommonRow tokens={supplyTokens} header={header} />
          )}
          {rewardTokens && rewardTokens?.length > 0 && (
            <>
              <Separator sx={{ marginHorizontal: 16 }} />
              <DeFiCommonRow tokens={rewardTokens} header="Rewards" />
            </>
          )}
        </Card>
      ))}
    </View>
  )
}

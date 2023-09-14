import React from 'react'
import { View } from 'react-native'
import { DefiLendingItem } from 'services/defi/types'
import { DeFiLendingSection } from './DeFiLendingSection'

type Props = {
  items: DefiLendingItem[]
}

export const DeFiPortfolioLending = ({ items }: Props) => {
  return (
    <>
      {items.map(({ supplyTokens, borrowTokens, rewardTokens }, index) => (
        <View key={`defi-lending-${index}`}>
          {supplyTokens && supplyTokens?.length > 0 && (
            <DeFiLendingSection
              headers={['Supplied', 'Value']}
              tokens={supplyTokens}
            />
          )}
          {borrowTokens && borrowTokens?.length > 0 && (
            <DeFiLendingSection headers={['Borrowed']} tokens={borrowTokens} />
          )}
          {rewardTokens && rewardTokens?.length > 0 && (
            <DeFiLendingSection headers={['Rewards']} tokens={rewardTokens} />
          )}
        </View>
      ))}
    </>
  )
}

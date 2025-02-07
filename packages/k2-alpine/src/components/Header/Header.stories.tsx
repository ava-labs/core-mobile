import React from 'react'
import { ScrollView, View } from '../Primitives'
import { BalanceHeader } from './BalanceHeader'
import { NavigationTitleHeader } from './NavigationTitleHeader'

export default {
  title: 'Headers'
}

export const All = (): JSX.Element => {
  return (
    <ScrollView
      style={{
        width: '100%'
      }}
      contentContainerStyle={{ padding: 16 }}>
      <View style={{ marginTop: 0, gap: 12 }}>
        <BalanceHeader
          accountName="Account 1"
          formattedBalance="$7,377.37"
          currency="USD"
          priceChange={{
            formattedPrice: '$12.7',
            status: 'up',
            formattedPercent: '3.7%'
          }}
        />
        <BalanceHeader
          accountName="Account 1"
          formattedBalance="$7,377.37"
          currency="USD"
          priceChange={{
            formattedPrice: '$12.7',
            status: 'down',
            formattedPercent: '3.7%'
          }}
        />
        <BalanceHeader
          accountName="Account 1"
          formattedBalance="$7,377.37"
          errorMessage="Unable to load all balances"
          currency="USD"
          priceChange={{
            formattedPrice: '$12.7',
            status: 'up',
            formattedPercent: '3.7%'
          }}
        />
        <NavigationTitleHeader title="Account 1" subtitle="$51.72 USD" />
      </View>
    </ScrollView>
  )
}

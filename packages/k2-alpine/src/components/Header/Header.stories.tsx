import React, { useEffect, useState } from 'react'
import { ScrollView, View } from '../Primitives'
import { BalanceHeader } from './BalanceHeader'
import { NavigationTitleHeader } from './NavigationTitleHeader'

export default {
  title: 'Headers'
}

export const All = (): JSX.Element => {
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => prev + 1.23)
    }, 2000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const formattedBalance = `$${(7377.37 + counter).toFixed(2)}`
  const formattedPrice = `$${12.7 + counter}`

  return (
    <ScrollView
      style={{
        width: '100%'
      }}
      contentContainerStyle={{ padding: 16 }}>
      <View style={{ marginTop: 0, gap: 12 }}>
        <BalanceHeader
          accountName="Account 1"
          formattedBalance={formattedBalance}
          currency="USD"
          priceChange={{
            formattedPrice: formattedPrice,
            status: 'up',
            formattedPercent: '3.7%'
          }}
        />
        <BalanceHeader
          accountName="Account 1"
          formattedBalance={formattedBalance}
          currency="USD"
          priceChange={{
            formattedPrice: formattedPrice,
            status: 'down',
            formattedPercent: '3.7%'
          }}
        />
        <BalanceHeader
          accountName="Account 1"
          formattedBalance={formattedBalance}
          errorMessage="Unable to load all balances"
          currency="USD"
          priceChange={{
            formattedPrice: formattedPrice,
            status: 'up',
            formattedPercent: '3.7%'
          }}
        />
        <NavigationTitleHeader title="Account 1" subtitle="$51.72 USD" />
      </View>
    </ScrollView>
  )
}

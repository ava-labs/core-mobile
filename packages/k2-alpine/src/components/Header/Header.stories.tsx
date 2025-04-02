import React, { useEffect, useState } from 'react'
import { ScrollView, View } from '../Primitives'
import { PriceChangeStatus } from '../PriceChangeIndicator/types'
import { BalanceHeader } from './BalanceHeader'
import { NavigationTitleHeader } from './NavigationTitleHeader'

export default {
  title: 'Headers'
}

export const All = (): JSX.Element => {
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => prev + 1.25)
    }, 2000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const formattedBalance = `$${(7377.25 + counter).toFixed(2)}`
  const formattedPrice = `$${12.5 + counter}`

  return (
    <ScrollView
      style={{
        width: '100%'
      }}
      contentContainerStyle={{ padding: 16 }}>
      <View style={{ marginTop: 0, gap: 12 }}>
        <BalanceHeader
          accountName="Account 1"
          formattedBalance={'7337.25'}
          currency="USD"
          priceChange={{
            formattedPrice: '$12.5',
            status: PriceChangeStatus.Up,
            formattedPercent: '3.7%'
          }}
        />
        <BalanceHeader
          accountName="Account 1"
          formattedBalance={formattedBalance}
          currency="USD"
          priceChange={{
            formattedPrice: formattedPrice,
            status: PriceChangeStatus.Up,
            formattedPercent: '3.7%'
          }}
        />
        <BalanceHeader
          accountName="Account 1"
          formattedBalance={formattedBalance}
          currency="USD"
          priceChange={{
            formattedPrice: formattedPrice,
            status: PriceChangeStatus.Down,
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
            status: PriceChangeStatus.Up,
            formattedPercent: '3.7%'
          }}
        />
        <NavigationTitleHeader title="Account 1" subtitle="$51.72 USD" />
      </View>
    </ScrollView>
  )
}

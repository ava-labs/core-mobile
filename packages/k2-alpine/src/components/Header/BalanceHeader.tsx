import React from 'react'
import { LayoutChangeEvent } from 'react-native'
import { Text, View } from '../Primitives'
import { PriceChangeIndicator } from '../PriceChangeIndicator/PriceChangeIndicator'

export const BalanceHeader = ({
  accountName,
  formattedBalance,
  currency,
  onLayout
}: {
  accountName: string
  formattedBalance: string
  currency: string
  onLayout?: (event: LayoutChangeEvent) => void
}): JSX.Element => {
  return (
    <View sx={{ gap: 5 }} onLayout={onLayout}>
      <View>
        <Text
          variant="heading2"
          sx={{ color: '$textSecondary', lineHeight: 38 }}>
          {accountName}
        </Text>
        <View sx={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text variant="heading2" sx={{ lineHeight: 38 }}>
            {formattedBalance}
          </Text>
          <Text
            sx={{ fontFamily: 'Aeonik-Medium', fontSize: 18, lineHeight: 28 }}>
            {currency}
          </Text>
        </View>
      </View>
      <PriceChangeIndicator
        formattedPrice="$12.7"
        status="up"
        formattedPercent="3.7%"
        textVariant="buttonMedium"
      />
    </View>
  )
}

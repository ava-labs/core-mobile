import { alpha, Text, useTheme, View } from '@avalabs/k2-alpine'
import { MarketBase } from '@avalabs/prediction-market-sdk'
import React from 'react'

export const EventCardOption = ({
  market
}: {
  market: MarketBase
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View
      style={{
        height: 24,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: alpha(theme.colors.$textPrimary, 0.1)
      }}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${Math.round(parseFloat(market?.lastPrice) * 100)}%`,
          backgroundColor: alpha(theme.colors.$textPrimary, 0.2)
        }}
      />
      <View
        style={{
          paddingRight: 8,
          flexDirection: 'row',
          alignItems: 'center',
          height: '100%',
          gap: 4
        }}>
        <Text
          variant="caption"
          style={{ flex: 1, fontFamily: 'Inter-Medium' }}
          numberOfLines={1}>
          {market?.yesSubTitle}
        </Text>
        <Text variant="buttonSmall">
          {Math.round(parseFloat(market?.lastPrice) * 100)}%
        </Text>
      </View>
    </View>
  )
}

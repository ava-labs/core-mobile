import React from 'react'
import { ScrollView, View } from '../Primitives'
import { PriceChangeIndicator } from './PriceChangeIndicator'
import { PriceChangeStatus } from './types'

export default {
  title: 'PriceChangeIndicator'
}

export const All = (): JSX.Element => {
  return (
    <ScrollView
      sx={{
        width: '100%'
      }}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ marginTop: 0, gap: 30 }}>
        <View sx={{ gap: 8 }}>
          <PriceChangeIndicator
            formattedPrice="$12.7"
            status={PriceChangeStatus.Up}
            formattedPercent="3.7%"
            textVariant="buttonMedium"
          />
          <PriceChangeIndicator
            formattedPrice="$12.7"
            status={PriceChangeStatus.Down}
            formattedPercent="3.7%"
            textVariant="buttonMedium"
          />
          <PriceChangeIndicator
            formattedPrice="$0.0"
            status={PriceChangeStatus.Neutral}
            formattedPercent="0%"
            textVariant="buttonMedium"
          />
        </View>
        <View sx={{ gap: 8 }}>
          <PriceChangeIndicator
            formattedPrice="$12.7"
            status={PriceChangeStatus.Up}
          />
          <PriceChangeIndicator
            formattedPrice="$12.7"
            status={PriceChangeStatus.Down}
          />
          <PriceChangeIndicator
            formattedPrice="$0.0"
            status={PriceChangeStatus.Neutral}
          />
        </View>
      </View>
    </ScrollView>
  )
}

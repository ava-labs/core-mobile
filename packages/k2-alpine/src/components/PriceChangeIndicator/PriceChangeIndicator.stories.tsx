import React from 'react'
import { ScrollView, View } from '../Primitives'
import { PriceChangeIndicator } from './PriceChangeIndicator'

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
            status="up"
            formattedPercent="3.7%"
            textVariant="buttonMedium"
          />
          <PriceChangeIndicator
            formattedPrice="$12.7"
            status="down"
            formattedPercent="3.7%"
            textVariant="buttonMedium"
          />
          <PriceChangeIndicator
            formattedPrice="$0.0"
            status="equal"
            formattedPercent="0%"
            textVariant="buttonMedium"
          />
        </View>
        <View sx={{ gap: 8 }}>
          <PriceChangeIndicator formattedPrice="$12.7" status="up" />
          <PriceChangeIndicator formattedPrice="$12.7" status="down" />
          <PriceChangeIndicator formattedPrice="$0.0" status="equal" />
        </View>
      </View>
    </ScrollView>
  )
}

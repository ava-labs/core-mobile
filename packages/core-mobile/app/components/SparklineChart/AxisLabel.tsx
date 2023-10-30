import React from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { View } from 'react-native'
import AvaText from 'components/AvaText'

// this component displays the min/max y values of the graph
export const AxisLabel = ({ x, value }: { x: number; value: number }) => {
  const theme = useApplicationContext().theme
  return (
    <View
      style={{
        transform: [{ translateX: Math.max(x - 40, 5) }]
      }}>
      <AvaText.Caption tokenInCurrency textStyle={{ color: theme.colorText1 }}>
        {value}
      </AvaText.Caption>
    </View>
  )
}

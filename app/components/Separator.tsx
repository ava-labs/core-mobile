import React from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'

const Separator = ({
  style,
  inset,
  color,
  vertical,
  thickness = 1
}: {
  style?: StyleProp<ViewStyle>
  inset?: number
  color?: string
  vertical?: boolean
  thickness?: number
}) => {
  const { theme } = useApplicationContext()
  return (
    <View
      style={[
        {
          height: !vertical ? thickness : undefined,
          width: vertical ? thickness : undefined,
          backgroundColor: color ?? theme.colorStroke,
          marginHorizontal: inset ?? 0
        },
        style
      ]}
    />
  )
}

export default Separator

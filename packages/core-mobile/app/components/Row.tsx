import { View } from '@avalabs/k2-mobile'
import React, { FC } from 'react'
import { ViewProps } from 'react-native'

export const Row: FC<ViewProps> = ({ style, children, testID }) => {
  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection: 'row'
        },
        style
      ]}>
      {children}
    </View>
  )
}

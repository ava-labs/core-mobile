import React, { FC } from 'react'
import { View } from '@avalabs/k2-alpine'
import { ViewProps } from 'react-native'

export const DeFiRowItem: FC<ViewProps> = ({ style, children, testID }) => {
  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 13,
          minHeight: 48,
          alignItems: 'center',
          justifyContent: 'space-between'
        },
        style
      ]}>
      {children}
    </View>
  )
}

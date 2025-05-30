import { alpha, useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import { View } from 'react-native'

const Grabber = (): JSX.Element => {
  const { theme } = useTheme()
  return (
    <View
      testID="grabber"
      style={{
        height: 5,
        width: 50,
        borderRadius: 10,
        backgroundColor: alpha('#D8D8D8', theme.isDark ? 0.3 : 1),
        position: 'absolute',
        alignSelf: 'center',
        top: 9
      }}
    />
  )
}

export default Grabber

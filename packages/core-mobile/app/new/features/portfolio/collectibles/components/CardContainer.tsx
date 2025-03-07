import React from 'react'
import { alpha, useTheme, View } from '@avalabs/k2-alpine'
import { ReactNode } from 'react'
import { ViewStyle } from 'react-native'

export const CardContainer = ({
  style,
  children
}: {
  style: ViewStyle
  children?: ReactNode
}): JSX.Element => {
  const {
    theme: { isDark }
  } = useTheme()
  return (
    <View
      style={{
        height: 220,
        backgroundColor: alpha(isDark ? '#3F3F42' : '#F6F6F6', 0.8),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: alpha(isDark ? '#fff' : '#000', 0.1),
        borderRadius: 18,
        overflow: 'hidden',
        ...style
      }}>
      {children}
    </View>
  )
}

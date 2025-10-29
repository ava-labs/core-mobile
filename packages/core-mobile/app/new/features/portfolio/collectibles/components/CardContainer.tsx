import { useTheme } from '@avalabs/k2-alpine'
import React, { ReactNode } from 'react'
import { ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'

export const CardContainer = ({
  style,
  children,
  testID
}: {
  style: ViewStyle | ViewStyle[]
  children?: ReactNode
  testID?: string
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <Animated.View
      testID={testID}
      style={[
        {
          height: 220,
          backgroundColor: colors.$surfaceSecondary,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.$borderPrimary,
          borderRadius: 18,
          overflow: 'hidden'
        },
        style
      ]}>
      {children}
    </Animated.View>
  )
}

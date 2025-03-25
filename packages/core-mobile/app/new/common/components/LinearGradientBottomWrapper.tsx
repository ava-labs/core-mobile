import { alpha, useTheme } from '@avalabs/k2-alpine'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { View } from 'react-native'
import { BlurViewWithFallback } from './BlurViewWithFallback'

export const LinearGradientBottomWrapper = ({
  children
}: {
  children?: React.ReactNode
}): React.JSX.Element => {
  const { theme } = useTheme()

  return (
    <View
      style={{
        marginBottom: -1
      }}>
      <LinearGradient
        colors={[
          alpha(theme.colors.$surfacePrimary, 0),
          alpha(theme.colors.$surfacePrimary, 0.9)
        ]}
        style={{
          position: 'absolute',
          top: -44,
          left: 0,
          right: 0,
          height: 60
        }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        pointerEvents="none"
      />
      <BlurViewWithFallback>{children}</BlurViewWithFallback>
    </View>
  )
}

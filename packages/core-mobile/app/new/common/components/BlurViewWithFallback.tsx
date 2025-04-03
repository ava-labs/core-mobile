import { BlurView } from 'expo-blur'
import React, { useMemo } from 'react'
import { ViewStyle, Platform } from 'react-native'
import { alpha, useTheme, View } from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { selectSelectedColorScheme } from 'store/settings/appearance'

export const BlurViewWithFallback = ({
  children,
  style
}: {
  children?: React.ReactNode
  style?: ViewStyle
}): JSX.Element => {
  const { theme } = useTheme()
  const colorScheme = useSelector(selectSelectedColorScheme)

  const iosContainerStyle = useMemo(
    () => [
      {
        // alpha('#afafd0', 0.1) is a color value found through experimentation
        // to make the blur effect appear the same as $surfacePrimary(neutral-850) in dark mode.
        backgroundColor:
          colorScheme === 'dark' ? alpha('#afafd0', 0.1) : undefined
      },
      style
    ],
    [colorScheme, style]
  )

  const androidContainerStyle = useMemo(
    () => [{ backgroundColor: theme.colors.$surfacePrimary }, style],
    [style, theme.colors.$surfacePrimary]
  )

  return Platform.OS === 'ios' ? (
    <BlurView
      style={iosContainerStyle}
      intensity={75}
      tint={colorScheme === 'dark' ? 'dark' : 'light'}>
      {children}
    </BlurView>
  ) : (
    <View style={androidContainerStyle}>{children}</View>
  )
}

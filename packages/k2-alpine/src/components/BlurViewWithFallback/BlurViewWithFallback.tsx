import { BlurView } from 'expo-blur'
import React, { useEffect, useMemo, useState } from 'react'
import { Platform, ViewStyle } from 'react-native'
import { useTheme } from '../../hooks'
import { alpha } from '../../utils'
import { View } from '../Primitives'

export const BlurViewWithFallback = ({
  children,
  intensity = 75,
  shouldDelayBlurOniOS = false,
  backgroundColor,
  style
}: {
  children?: React.ReactNode
  intensity?: number
  /*
   * use this prop to add a short delay to ensure BlurView renders
   * after dynamic content (like FlatList) has mounted.
   *
   * without this, the blur effect may not apply correctly,
   * especially when used as a background in React Navigation headers.
   *
   * reference: https://docs.expo.dev/versions/latest/sdk/blur-view/#known-issues
   */
  shouldDelayBlurOniOS?: boolean
  backgroundColor?: string
  style?: ViewStyle
}): JSX.Element | null => {
  const [ready, setReady] = useState(
    Platform.OS === 'android' ? true : !shouldDelayBlurOniOS
  )

  useEffect(() => {
    if (shouldDelayBlurOniOS && Platform.OS === 'ios') {
      const timer = setTimeout(() => setReady(true), 500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [shouldDelayBlurOniOS])

  const { theme } = useTheme()

  const iosContainerStyle = useMemo(
    () => [
      {
        backgroundColor: backgroundColor
          ? alpha(backgroundColor, 0.1)
          : // alpha('#afafd0', 0.1) is a color value found through experimentation
          // to make the blur effect appear the same as $surfacePrimary(neutral-850) in dark mode.
          theme.isDark
          ? alpha('#afafd0', 0.1)
          : undefined
      },
      style
    ],
    [backgroundColor, theme.isDark, style]
  )

  const androidContainerStyle = useMemo(
    () => [
      { backgroundColor: backgroundColor ?? theme.colors.$surfacePrimary },
      style
    ],
    [backgroundColor, style, theme.colors.$surfacePrimary]
  )

  if (!ready || Platform.OS === 'android') {
    return <View style={androidContainerStyle}>{children}</View>
  }

  return (
    <BlurView
      style={iosContainerStyle}
      intensity={intensity}
      tint={theme.isDark ? 'dark' : 'light'}>
      {children}
    </BlurView>
  )
}

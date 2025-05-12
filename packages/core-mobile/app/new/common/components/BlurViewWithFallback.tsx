import { BlurView } from 'expo-blur'
import React, { useEffect, useMemo, useState } from 'react'
import { ViewStyle, Platform } from 'react-native'
import { alpha, useTheme, View } from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { selectSelectedColorScheme } from 'store/settings/appearance'

export const BlurViewWithFallback = ({
  children,
  intensity = 75,
  shouldDelayBlurOniOS = false,
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
  style?: ViewStyle
}): JSX.Element | null => {
  const [ready, setReady] = useState(
    Platform.OS === 'android' ? true : !shouldDelayBlurOniOS
  )

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (shouldDelayBlurOniOS && Platform.OS === 'ios') {
      timer = setTimeout(() => setReady(true), 500)
    }
    return () => timer && clearTimeout(timer)
  }, [shouldDelayBlurOniOS])

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

  if (!ready || Platform.OS === 'android') {
    return <View style={androidContainerStyle}>{children}</View>
  }

  return (
    <BlurView
      style={iosContainerStyle}
      intensity={intensity}
      tint={colorScheme}>
      {children}
    </BlurView>
  )
}

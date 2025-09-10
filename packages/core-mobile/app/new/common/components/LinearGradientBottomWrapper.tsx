import { alpha, useTheme } from '@avalabs/k2-alpine'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useMemo } from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import { BlurViewWithFallback } from './BlurViewWithFallback'

const start = { x: 0.5, y: 0 }
const end = { x: 0.5, y: 0.5 }
export const LinearGradientBottomWrapper = ({
  children,
  shouldDelayBlurOniOS = false,
  enabled = true
}: {
  children?: React.ReactNode
  shouldDelayBlurOniOS?: boolean
  enabled?: boolean
}): React.JSX.Element => {
  const { theme } = useTheme()

  const colors: [string, string, ...string[]] = useMemo(
    () => [
      alpha(theme.colors.$surfacePrimary, 0),
      alpha(theme.colors.$surfacePrimary, Platform.OS === 'ios' ? 0.96 : 1)
    ],
    [theme.colors.$surfacePrimary]
  )

  return (
    <View style={styles.container}>
      {enabled && (
        <LinearGradient
          pointerEvents="none"
          colors={colors}
          style={styles.gradient}
          start={start}
          end={end}
        />
      )}
      <BlurViewWithFallback shouldDelayBlurOniOS={shouldDelayBlurOniOS}>
        {children}
      </BlurViewWithFallback>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: -1
  },
  gradient: {
    position: 'absolute',
    top: -44,
    left: 0,
    right: 0,
    height: 60
  }
})

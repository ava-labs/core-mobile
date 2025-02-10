import React from 'react'
import { alpha, Separator, useTheme, View } from '@avalabs/k2-alpine'
import { Platform } from 'react-native'
import { BlurView } from 'expo-blur'

const BlurredBackgroundView = ({
  separator
}: {
  separator?: {
    opacity: number
    position: 'top' | 'bottom'
  }
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View style={{ flex: 1 }}>
      {separator?.position === 'top' && (
        <Separator sx={{ opacity: separator.opacity }} />
      )}
      {Platform.OS === 'ios' ? (
        <BlurView
          style={{
            flex: 1,
            // alpha('#afafd0', 0.1) is a color value found through experimentation
            // to make the blur effect appear the same as $surfacePrimary(neutral-850) in dark mode.
            backgroundColor: theme.isDark ? alpha('#afafd0', 0.1) : undefined
          }}
          intensity={75}
        />
      ) : (
        <View sx={{ flex: 1, backgroundColor: '$surfacePrimary' }} />
      )}
      {separator?.position === 'bottom' && (
        <Separator sx={{ opacity: separator.opacity }} />
      )}
    </View>
  )
}

export default BlurredBackgroundView

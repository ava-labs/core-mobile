import { View } from '@avalabs/k2-alpine'
import { Platform, StyleSheet } from 'react-native'
import React, { FC } from 'react'
import { BlurView, BlurTint } from 'expo-blur'

interface Props {
  opacity: number
  backgroundColor: string
  borderRadius: number
  tint?: BlurTint
  reducedTransparencyFallbackColor?: string
}

export const BlurBackground: FC<Props> = ({
  opacity,
  backgroundColor,
  borderRadius,
  tint = 'dark'
}): JSX.Element => {
  const iosOpacity = 1 - opacity

  if (Platform.OS === 'android') {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor, opacity, borderRadius }
        ]}
      />
    )
  }

  return (
    <>
      <BlurView
        style={[StyleSheet.absoluteFill, { borderRadius }]}
        tint={tint}
        intensity={75}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor,
            opacity: iosOpacity,
            borderRadius
          }
        ]}
      />
    </>
  )
}

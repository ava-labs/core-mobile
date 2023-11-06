import { View } from '@avalabs/k2-mobile'
import { Platform, StyleSheet } from 'react-native'
import React, { FC } from 'react'
import { BlurView, BlurViewProperties } from '@react-native-community/blur'

interface Props {
  opacity: number
  backgroundColor: string
  borderRadius: number
  iosBlurType?: BlurViewProperties['blurType']
  reducedTransparencyFallbackColor?: string
}

export const BlurBackground: FC<Props> = ({
  opacity,
  backgroundColor,
  borderRadius,
  iosBlurType = 'dark',
  reducedTransparencyFallbackColor = 'black'
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
        blurType={iosBlurType}
        blurAmount={10}
        reducedTransparencyFallbackColor={reducedTransparencyFallbackColor}
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

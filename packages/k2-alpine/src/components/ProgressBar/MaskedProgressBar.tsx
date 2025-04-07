import MaskedView from '@react-native-masked-view/masked-view'
import React, { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useTheme } from '../../hooks'
import { ANIMATED } from '../../utils'

export const MaskedProgressBar = ({
  progress,
  children
}: {
  progress: SharedValue<number>
  children: JSX.Element
}): ReactNode => {
  const { theme } = useTheme()
  const opacity = useSharedValue(1)

  const endProgress = (): void => {
    if (progress.value === 1) {
      opacity.value = withTiming(
        0,
        { ...ANIMATED.TIMING_CONFIG, duration: 1000 },
        () => {
          progress.value = 0
        }
      )
    } else {
      opacity.value = 1
    }
  }

  const progressStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      width: withTiming(
        `${progress.value * 100}%`,
        ANIMATED.TIMING_CONFIG,
        () => {
          runOnJS(endProgress)()
        }
      )
    }
  })

  return (
    <>
      <View
        style={{
          flex: 1,
          borderRadius: 200,
          height: '100%',
          overflow: 'hidden'
        }}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            progressStyle,
            {
              backgroundColor: theme.colors.$textPrimary,
              borderRadius: 200,
              pointerEvents: 'none'
            }
          ]}
        />
        <MaskedView
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: 'center',
              zIndex: 100,
              position: 'absolute'
            }
          ]}
          maskElement={children}>
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: theme.colors.$textPrimary,
                pointerEvents: 'none'
              }
            ]}
          />

          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              progressStyle,
              {
                backgroundColor: theme.colors.$surfacePrimary,
                borderRadius: 200,
                pointerEvents: 'none'
              }
            ]}
          />
        </MaskedView>
      </View>
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          opacity: 0.02
        }}>
        {children}
      </View>
    </>
  )
}

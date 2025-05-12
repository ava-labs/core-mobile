import React, { ReactNode } from 'react'
import { View, ViewStyle } from 'react-native'
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useTheme } from '../../hooks'
import { ANIMATED } from '../../utils'

export const ProgressBar = ({
  progress,
  progressBarStyle,
  color
}: {
  progress: SharedValue<number>
  progressBarStyle?: ViewStyle
  color?: string
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
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%'
      }}>
      <Animated.View
        style={[
          progressStyle,
          progressBarStyle,
          {
            height: '100%',
            backgroundColor: color ?? theme.colors.$textPrimary
          }
        ]}
      />
    </View>
  )
}

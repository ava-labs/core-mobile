import React, { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing
} from 'react-native-reanimated'
import { Icons, useTheme } from '@avalabs/k2-alpine'

interface ScanningAnimationProps {
  size?: number
  iconSize?: number
}

export const ScanningAnimation: React.FC<ScanningAnimationProps> = ({
  size = 200,
  iconSize = 32
}) => {
  const {
    theme: { colors }
  } = useTheme()
  const animationValue = useSharedValue(0)

  useEffect(() => {
    animationValue.value = withRepeat(
      withTiming(1, {
        duration: 2000,
        easing: Easing.out(Easing.quad)
      }),
      -1,
      false
    )
  }, [animationValue])

  // Create animated styles for each circle
  const createCircleStyle = (delay: number, maxScale: number) => {
    return useAnimatedStyle(() => {
      const progress = (animationValue.value + delay) % 1
      const scale = interpolate(progress, [0, 1], [0.3, maxScale])
      const opacity = interpolate(progress, [0, 0.7, 1], [0.8, 0.3, 0])

      return {
        transform: [{ scale }],
        opacity
      }
    })
  }

  const circle1Style = createCircleStyle(0, 1.0)
  const circle2Style = createCircleStyle(0.3, 1.3)
  const circle3Style = createCircleStyle(0.6, 1.6)

  const circleSize = size
  const borderWidth = 2

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      {/* Outermost circle */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            borderWidth,
            borderColor: colors.$textSecondary
          },
          circle3Style
        ]}
      />

      {/* Middle circle */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: circleSize * 0.8,
            height: circleSize * 0.8,
            borderRadius: (circleSize * 0.8) / 2,
            borderWidth,
            borderColor: colors.$textSecondary
          },
          circle2Style
        ]}
      />

      {/* Inner circle */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: circleSize * 0.6,
            height: circleSize * 0.6,
            borderRadius: (circleSize * 0.6) / 2,
            borderWidth,
            borderColor: colors.$textSecondary
          },
          circle1Style
        ]}
      />

      {/* Center icon */}
      <View
        style={{
          width: iconSize + 16,
          height: iconSize + 16,
          borderRadius: (iconSize + 16) / 2,
          backgroundColor: colors.$surfaceSecondary,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10
        }}>
        <Icons.Custom.Ledger
          color={colors.$textPrimary}
          width={iconSize}
          height={iconSize}
        />
      </View>
    </View>
  )
}

import React, { FC, useCallback } from 'react'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  interpolate,
  withTiming
} from 'react-native-reanimated'
import { alpha } from '../../utils'
import { Pressable } from '../Primitives'
import { useTheme } from '../../hooks'

interface ToggleProps {
  value: boolean
  onValueChange?: (value: boolean) => void
  variant?: 'small' | 'large'
  testID?: string
  disabled?: boolean
}

export const Toggle: FC<ToggleProps> = ({
  value,
  onValueChange,
  variant,
  disabled,
  testID
}) => {
  const {
    theme: { isDark }
  } = useTheme()
  const isSmall = variant === 'small'
  const width = isSmall ? 34 : 47
  const height = isSmall ? 18 : 26
  const trackSize = isSmall ? 14 : 22
  const offset = useSharedValue(value ? 1 : 0)

  const toggleSwitch = useCallback((): void => {
    if (disabled) return
    const newValue = !value
    offset.value = withTiming(offset.value === 0 ? 1 : 0, { duration: 300 })
    onValueChange?.(newValue)
  }, [disabled, value, offset, onValueChange])

  const animatedBackgroundStyles = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      offset.value,
      [0, 1],
      [isDark ? '#FFFFFF4D' : '#28282E4D', '#3AC489']
    )
    return {
      backgroundColor: disabled ? '#28282E33' : backgroundColor
    }
  })

  const animatedTrackStyles = useAnimatedStyle(() => {
    const translateX = interpolate(offset.value, [0, 1], [1, isSmall ? 15 : 20])
    return {
      transform: [{ translateX }]
    }
  })

  return (
    <Pressable onPress={toggleSwitch} testID={testID}>
      <Animated.View
        style={[
          {
            width,
            height,
            borderRadius: 1000,
            padding: 2
          },
          animatedBackgroundStyles
        ]}>
        <Animated.View
          style={[
            {
              width: trackSize,
              height: trackSize,
              borderRadius: 1000,
              backgroundColor: disabled ? alpha('#FFFFFF', 0.6) : '#FFFFFF'
            },
            animatedTrackStyles
          ]}
        />
      </Animated.View>
    </Pressable>
  )
}

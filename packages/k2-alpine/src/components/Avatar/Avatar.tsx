import React, { useEffect } from 'react'
import { ImageSourcePropType, ViewStyle } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { View } from '../Primitives'
import { GlassView } from '../GlassView/GlassView'
import { HexagonImageView, HexagonBorder } from './HexagonImageView'

export const Avatar = ({
  source,
  size,
  isSelected,
  isPressed,
  hasBlur,
  style
}: {
  source: ImageSourcePropType
  size: number | 'small' | 'large'
  isSelected?: boolean
  isPressed?: boolean
  hasBlur?: boolean
  style?: ViewStyle
}): JSX.Element => {
  const blurAreaInset = 50

  const height = typeof size === 'number' ? size : size === 'small' ? 90 : 150

  const pressedAnimation = useSharedValue(1)
  const pressedAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressedAnimation.value }]
  }))

  useEffect(() => {
    pressedAnimation.value = withTiming(isPressed ? 0.95 : 1, {
      duration: 150,
      easing: Easing.inOut(Easing.ease)
    })
  }, [isPressed, pressedAnimation])

  return (
    <Animated.View
      style={[
        { width: height, height: height, overflow: 'visible' },
        pressedAnimatedStyle,
        style
      ]}>
      {hasBlur === true && (
        <View
          sx={{
            position: 'absolute',
            top: 10,
            left: 0,
            right: 0,
            bottom: 0
          }}>
          <HexagonImageView source={source} height={height} />
          <GlassView
            style={{
              position: 'absolute',
              top: -blurAreaInset,
              left: -blurAreaInset,
              right: 0,
              bottom: 0,
              width: height + blurAreaInset * 2,
              height: height + blurAreaInset * 2
            }}
          />
        </View>
      )}
      <HexagonImageView
        source={source}
        height={height}
        isSelected={isSelected}
      />
      <HexagonBorder height={height} />
    </Animated.View>
  )
}

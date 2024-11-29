import React, { useEffect } from 'react'
import { ImageSourcePropType, ViewStyle } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
import { View } from '../Primitives'
import { useTheme } from '../..'
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
  const { theme } = useTheme()
  const blurAreaInset = 50

  const height = typeof size === 'number' ? size : size === 'small' ? 90 : 150

  const pressedAnimation = useSharedValue(1)
  const pressedAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressedAnimation.value }]
  }))
  const surfacePrimaryBlurBg = theme.isDark ? '#050506' : undefined // to cancel out the blur effect on the $surfacePrimary, we need to use a darker background color for the blur view, only for dark mode

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
            backgroundColor: surfacePrimaryBlurBg,
            position: 'absolute',
            top: -blurAreaInset + 10,
            left: -blurAreaInset,
            right: 0,
            bottom: 0,
            width: height + blurAreaInset * 2,
            height: height + blurAreaInset * 2,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          <HexagonImageView source={source} height={height} />
          <BlurView
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
            tint={theme.isDark ? 'dark' : undefined}
            intensity={75}
            experimentalBlurMethod="dimezisBlurView"
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

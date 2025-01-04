import React, { useEffect } from 'react'
import { ImageSourcePropType, Platform, ViewStyle } from 'react-native'
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
import { useGlowAnimatedStyle } from './useGlowAnimatedStyle'

export const Avatar = ({
  source,
  size,
  isSelected,
  isPressed,
  hasBlur,
  style,
  backgroundColor,
  glowEffect
}: {
  source: ImageSourcePropType
  size: number | 'small' | 'large'
  backgroundColor: string
  isSelected?: boolean
  isPressed?: boolean
  hasBlur?: boolean
  style?: ViewStyle
  glowEffect?: { imageSource: ImageSourcePropType; size: number; delay: number }
}): JSX.Element => {
  const { theme } = useTheme()

  const height = typeof size === 'number' ? size : size === 'small' ? 90 : 150

  const pressedAnimation = useSharedValue(1)
  const pressedAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressedAnimation.value }]
  }))
  // to cancel out the blur effect on the backgroundColor, we need to use a darker background color for the blur view
  const surfacePrimaryBlurBgMap = theme.isDark
    ? {
        [theme.colors.$surfacePrimary]:
          Platform.OS === 'ios' ? '#050506' : '#0a0a0b',
        [theme.colors.$surfaceSecondary]:
          Platform.OS === 'ios' ? '#37373f' : '#373743',
        [theme.colors.$surfaceTertiary]:
          Platform.OS === 'ios' ? '#1A1A1C' : '#1C1C1F'
      }
    : {
        [theme.colors.$surfacePrimary]: undefined,
        [theme.colors.$surfaceSecondary]: undefined,
        [theme.colors.$surfaceTertiary]:
          Platform.OS === 'ios' ? '#8b8b8c' : '#79797c'
      }

  const { animatedStyle, isAnimating } = useGlowAnimatedStyle(
    glowEffect?.delay ?? 0
  )

  const renderBlur = (): JSX.Element => {
    return (
      <View
        sx={{
          backgroundColor: surfacePrimaryBlurBgMap[backgroundColor],
          position: 'absolute',
          top: -AVATAR_BLURAREA_INSET + 10,
          left: -AVATAR_BLURAREA_INSET,
          right: 0,
          bottom: 0,
          width: height + AVATAR_BLURAREA_INSET * 2,
          height: height + AVATAR_BLURAREA_INSET * 2,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        {(isAnimating === false || Platform.OS === 'ios') && (
          <>
            <HexagonImageView
              backgroundColor={backgroundColor}
              source={source}
              height={height}
            />
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
          </>
        )}
        {glowEffect !== undefined && isAnimating && (
          <Animated.Image
            source={glowEffect.imageSource}
            style={[
              {
                position: 'absolute',
                width: glowEffect.size,
                height: glowEffect.size
              },
              animatedStyle
            ]}
          />
        )}
      </View>
    )
  }

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
      {hasBlur === true && renderBlur()}
      <HexagonImageView
        source={source}
        height={height}
        backgroundColor={'white'}
        isSelected={isSelected}
        hasLoading={true}
      />
      <HexagonBorder height={height} />
    </Animated.View>
  )
}

export const AVATAR_BLURAREA_INSET = 50

import { BlurView } from 'expo-blur'
import React from 'react'
import { ImageSourcePropType, Platform, ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { SvgProps } from 'react-native-svg'
import { useBlurBackgroundColor } from '../../hooks/useBlurBackgroundColor'
import { useTheme } from '../../hooks'
import { View } from '../Primitives'
import { HexagonBorder, HexagonImageView } from './HexagonImageView'
import { TestnetHexagonImageView } from './TestnetHexagonImageView'
import { useGlowAnimatedStyle } from './useGlowAnimatedStyle'

export type AvatarType = {
  id: string
  source: ImageSourcePropType | React.FC<SvgProps>
}

export const Avatar = ({
  source,
  size,
  isSelected,
  hasBlur,
  style,
  backgroundColor,
  glowEffect,
  testID,
  hasLoading = true,
  isDeveloperMode = false,
  showAddIcon = false
}: {
  source?: AvatarType['source']
  size: number | 'small' | 'large'
  backgroundColor?: string
  isSelected?: boolean
  hasBlur?: boolean
  style?: ViewStyle
  glowEffect?: { imageSource: ImageSourcePropType; size: number; delay: number }
  testID?: string
  hasLoading?: boolean
  isDeveloperMode?: boolean
  showAddIcon?: boolean
}): JSX.Element => {
  const { theme } = useTheme()

  const height = typeof size === 'number' ? size : size === 'small' ? 90 : 150

  const pressedAnimation = useSharedValue(1)
  const pressedAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressedAnimation.value }]
  }))
  const blurBackgroundColor = useBlurBackgroundColor(backgroundColor)

  const { animatedStyle, isAnimating } = useGlowAnimatedStyle(
    glowEffect?.delay ?? 0
  )

  const renderBlur = (): JSX.Element => {
    return (
      <View
        sx={{
          backgroundColor: blurBackgroundColor,
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
              backgroundColor={
                backgroundColor ? backgroundColor : 'transparent'
              }
              source={source}
              height={height}
            />
            <BlurView
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden'
              }}
              tint={theme.isDark ? 'dark' : 'light'}
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

  return (
    <Animated.View
      testID={testID}
      style={[
        { width: height, height: height, overflow: 'visible' },
        pressedAnimatedStyle,
        style
      ]}>
      {hasBlur === true && renderBlur()}
      {isDeveloperMode ? (
        <TestnetHexagonImageView height={height} size={size} />
      ) : (
        <HexagonImageView
          source={source}
          height={height}
          backgroundColor={backgroundColor ?? theme.colors.$surfaceSecondary}
          isSelected={isSelected}
          hasLoading={hasLoading}
          showAddIcon={showAddIcon}
        />
      )}
      <HexagonBorder height={height} />
    </Animated.View>
  )
}

export const AVATAR_BLURAREA_INSET = 50

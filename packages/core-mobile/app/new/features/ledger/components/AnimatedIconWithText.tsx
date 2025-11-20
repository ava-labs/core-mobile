import React from 'react'
import { View } from 'react-native'
import LottieView from 'lottie-react-native'
import { Text, useTheme } from '@avalabs/k2-alpine'

// Import animation at the top level
const connectWavesAnimation = require('assets/lotties/connect-waves.json')

interface AnimatedIconWithTextProps {
  /** The icon component to display */
  icon: React.ReactNode
  /** The main title text */
  title: string
  /** The style for the title text */
  titleStyle?: React.ComponentProps<typeof Text>['style']
  /** The subtitle/description text */
  subtitle: string
  /** The style for the subtitle text */
  subtitleStyle?: React.ComponentProps<typeof Text>['style']
  /** Whether to show the animation behind the icon */
  showAnimation?: boolean
  /** Custom animation source (defaults to connect-waves.json) - Lottie animation JSON
   * In React Native, require() for a Lottie JSON returns either a number (asset reference) or an object (parsed JSON).
   * This union type matches what LottieView expects and removes the any lint error.
   */
  animationSource?: number | object
  /** Custom animation size (defaults to 220x220) */
  animationSize?: { width: number; height: number }
  /** Custom icon positioning offset for animation centering */
  animationOffset?: { top: number; left: number }
  /** Custom color for the animation (defaults to theme textPrimary) */
  animationColor?: string
}

export const AnimatedIconWithText: React.FC<AnimatedIconWithTextProps> = ({
  icon,
  title,
  titleStyle,
  subtitle,
  subtitleStyle,
  showAnimation = false,
  animationSource = connectWavesAnimation,
  animationSize = { width: 220, height: 220 },
  animationColor
}) => {
  const {
    theme: { colors }
  } = useTheme()

  // Calculate dynamic positioning based on animation size
  const iconContainerHeight = 44 // Assuming standard icon size
  const animationRadius = animationSize.width / 2
  const iconRadius = iconContainerHeight / 2

  // Calculate animation offset to center it around the icon
  const dynamicAnimationOffset = {
    top: -(animationRadius - iconRadius),
    left: -(animationRadius - iconRadius)
  }

  return (
    <View
      style={{
        alignItems: 'center',
        paddingHorizontal: 16
      }}>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        {showAnimation && (
          <LottieView
            source={animationSource}
            autoPlay
            loop
            resizeMode="contain"
            colorFilters={[
              {
                keypath: '*', // Apply to all layers
                color: animationColor || colors.$textPrimary // Use custom color or theme default
              }
            ]}
            style={{
              position: 'absolute',
              width: animationSize.width,
              height: animationSize.height,
              top: dynamicAnimationOffset.top,
              left: dynamicAnimationOffset.left
            }}
          />
        )}
        {icon}
      </View>
      <Text
        variant="heading6"
        style={[
          {
            textAlign: 'center',
            marginBottom: 4
          },
          titleStyle
        ]}>
        {title}
      </Text>
      <Text
        variant="body1"
        style={[
          {
            textAlign: 'center',
            color: colors.$textSecondary,
            maxWidth: 280
          },
          subtitleStyle
        ]}>
        {subtitle}
      </Text>
    </View>
  )
}

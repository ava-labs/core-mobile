import React from 'react'
import { View } from 'react-native'
import LottieView from 'lottie-react-native'
import { Text, useTheme } from '@avalabs/k2-alpine'
import { Space } from 'common/components/Space'

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
  /** Custom color for the animation (defaults to theme textPrimary) */
  animationColor?: string
  /** Optional vertical space between icon and title */
  space?: number
  /** Optional container style */
  style?: React.ComponentProps<typeof View>['style']
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
  animationColor,
  space = 34,
  style
}) => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      style={[
        {
          alignItems: 'center',
          paddingHorizontal: 16
        },
        style
      ]}>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        {showAnimation && (
          <View
            style={{
              position: 'absolute'
            }}>
            <LottieView
              source={animationSource}
              autoPlay
              loop
              resizeMode="contain"
              style={{
                width: animationSize.width,
                height: animationSize.height
              }}
              colorFilters={[
                {
                  keypath: '*', // Apply to all layers
                  color: animationColor || colors.$textPrimary // Use custom color or theme default
                }
              ]}
            />
          </View>
        )}
        {icon}
      </View>
      <Space y={space} />
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

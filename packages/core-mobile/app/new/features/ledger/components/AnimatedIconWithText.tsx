import React from 'react'
import { View } from 'react-native'
import LottieView from 'lottie-react-native'
import { Text, useTheme } from '@avalabs/k2-alpine'

interface AnimatedIconWithTextProps {
  /** The icon component to display */
  icon: React.ReactNode
  /** The main title text */
  title: string
  /** The subtitle/description text */
  subtitle: string
  /** Whether to show the animation behind the icon */
  showAnimation?: boolean
  /** Custom animation source (defaults to connect-waves.json) */
  animationSource?: any
  /** Custom animation size (defaults to 220x220) */
  animationSize?: { width: number; height: number }
  /** Custom icon positioning offset for animation centering */
  animationOffset?: { top: number; left: number }
}

export const AnimatedIconWithText: React.FC<AnimatedIconWithTextProps> = ({
  icon,
  title,
  subtitle,
  showAnimation = false,
  animationSource = require('assets/lotties/connect-waves.json'),
  animationSize = { width: 220, height: 220 }
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

  // Calculate consistent text position regardless of animation state
  const baseTopPosition = 160 // Base centering position
  const textOverlapPosition = baseTopPosition + iconContainerHeight + 16 // Keep text close to icon for both states

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 32
      }}>
      <View
        style={{
          marginTop: baseTopPosition,
          marginBottom: 0,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        {showAnimation && (
          <LottieView
            source={animationSource}
            autoPlay
            loop
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
      <View
        style={{
          position: 'absolute',
          top: textOverlapPosition,
          left: 0,
          right: 0,
          alignItems: 'center',
          paddingHorizontal: 32
        }}>
        <Text
          variant="heading6"
          style={{
            textAlign: 'center',
            marginBottom: 4
          }}>
          {title}
        </Text>
        <Text
          variant="body1"
          style={{
            textAlign: 'center',
            color: colors.$textSecondary,
            maxWidth: 280
          }}>
          {subtitle}
        </Text>
      </View>
    </View>
  )
}

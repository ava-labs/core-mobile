import React from 'react'
import { View, Platform } from 'react-native'
import { useTheme } from '@avalabs/k2-alpine'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'

interface ProgressDotsProps {
  /** Total number of steps */
  totalSteps: number
  /** Current active step (0-indexed) */
  currentStep: number
  /** Size of each dot */
  dotSize?: number
  /** Gap between dots */
  gap?: number
  /** Test ID for testing */
  testID?: string
}

interface DotProps {
  isActive: boolean
  dotSize: number
  colors: {
    $textPrimary: string
  }
}

const AnimatedDot: React.FC<DotProps> = ({ isActive, dotSize, colors }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(isActive ? dotSize * 2 : dotSize, {
        duration: 200
      }),
      opacity: withTiming(isActive ? 1 : 0.4, {
        duration: 200
      })
    }
  })

  return (
    <Animated.View
      style={[
        {
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: colors.$textPrimary
        },
        animatedStyle
      ]}
    />
  )
}

export const ProgressDots: React.FC<ProgressDotsProps> = ({
  totalSteps,
  currentStep,
  dotSize = 6,
  gap = 6,
  testID
}) => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap,
        height: 56,
        justifyContent: 'center'
      }}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <AnimatedDot
          key={index}
          isActive={index === currentStep}
          dotSize={dotSize}
          colors={colors}
        />
      ))}
    </View>
  )
}

import React, { useEffect } from 'react'
import { ViewStyle } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming
} from 'react-native-reanimated'
import { useTheme } from '../../hooks'
import { colors } from '../../theme/tokens/colors'
import { alpha, easeOutQuart } from '../../utils'

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 30,
  strokeWidth = 3,
  style
}) => {
  const { theme } = useTheme()
  const animatedProgress = useSharedValue(0)

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 600,
      easing: easeOutQuart
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: circumference - circumference * animatedProgress.value
    }
  })

  const backgroundColor = theme.isDark
    ? alpha(colors.$neutralWhite, 0.2)
    : alpha(colors.$neutral850, 0.2)
  const progressColor = theme.colors.$textSuccess

  return (
    <Svg width={size} height={size} style={style}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={backgroundColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={progressColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference}, ${circumference}`}
        animatedProps={animatedProps}
        strokeLinecap="round"
        rotation="-90"
        originX={size / 2}
        originY={size / 2}
      />
    </Svg>
  )
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

type CircularProgressProps = {
  progress: number
  size?: number
  strokeWidth?: number
  backgroundColor?: string
  progressColor?: string
  style?: ViewStyle
}

import React, { FC } from 'react'
import Animated, {
  SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'
import { useTheme } from '../../../hooks'

type Props = {
  x: SharedValue<number>
  y: SharedValue<number>
  isActive: SharedValue<boolean>
  size?: number
  color?: string
}

export const LineChartDot: FC<Props> = ({
  x,
  y,
  isActive,
  size = 9,
  color: colorProp
}) => {
  const { theme } = useTheme()
  const color = colorProp ?? theme.colors.$textPrimary ?? '#000'

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isActive.value ? 1 : 0,
    transform: [
      { translateX: x.value - size / 2 },
      { translateY: y.value - size / 2 }
    ]
  }))

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color
        },
        animatedStyle
      ]}
    />
  )
}

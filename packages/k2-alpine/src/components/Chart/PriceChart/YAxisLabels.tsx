import { Text } from '../../Primitives'
import React, { FC } from 'react'
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'
import { YAxisTick } from './types'

type Props = {
  isActive: SharedValue<boolean>
  /** Pre-computed tick positions matching the gridline y's, so labels stay
   * locked to their gridlines (including any edge clamping). */
  ticks: YAxisTick[]
  /** Total container height — used so absolute children aren't clipped. */
  containerHeight: number
}

const LABEL_HEIGHT = 11 // matches the lineHeight override below
const LABEL_LEFT = 16
const LABEL_GAP_ABOVE_LINE = 6

const formatLabel = (n: number): string =>
  n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(4)}`

export const YAxisLabels: FC<Props> = ({
  isActive,
  ticks,
  containerHeight
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isActive.value ? 1 : 0, { duration: 150 })
  }))

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: LABEL_LEFT,
          top: 0,
          right: LABEL_LEFT,
          height: containerHeight
        },
        animatedStyle
      ]}>
      {ticks.map(({ price, y }, i) => {
        // Label sits 8px above its gridline. Clamp to keep it visible at
        // the canvas edges.
        const top = Math.max(0, y - LABEL_HEIGHT - LABEL_GAP_ABOVE_LINE)
        return (
          <Text
            key={i}
            variant="caption"
            sx={{
              position: 'absolute',
              top,
              left: 0,
              opacity: 0.3,
              lineHeight: 11
            }}>
            {formatLabel(price)}
          </Text>
        )
      })}
    </Animated.View>
  )
}

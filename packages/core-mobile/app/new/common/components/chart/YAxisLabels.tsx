import { Text } from '@avalabs/k2-alpine'
import React, { FC, useMemo } from 'react'
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'
import { yAxisTicks } from './helpers'

type Props = {
  isActive: SharedValue<boolean>
  minPrice: number
  maxPrice: number
  height: number
}

const formatLabel = (n: number): string =>
  n >= 1 ? `$${n.toFixed(0)}` : `$${n.toFixed(3)}`

export const YAxisLabels: FC<Props> = ({
  isActive,
  minPrice,
  maxPrice,
  height
}) => {
  const ticks = useMemo(
    () => yAxisTicks(minPrice, maxPrice, 3),
    [minPrice, maxPrice]
  )

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isActive.value ? 1 : 0, { duration: 150 })
  }))

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: 8,
          top: 0,
          height,
          justifyContent: 'space-between'
        },
        animatedStyle
      ]}>
      {/* Render in reverse so highest price is at the top */}
      {[...ticks].reverse().map((price, i) => (
        <Text
          key={i}
          variant="caption"
          sx={{ color: '$textSecondary', fontSize: 10 }}>
          {formatLabel(price)}
        </Text>
      ))}
    </Animated.View>
  )
}

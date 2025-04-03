import React, { useCallback } from 'react'
import {
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'
import { Line, vec, Circle } from '@shopify/react-native-skia'
import type { SelectionDotProps } from 'react-native-graph'
import { useSelector } from 'react-redux'
import { selectSelectedColorScheme } from 'store/settings/appearance'

export function SelectionDot({
  isActive,
  circleX,
  circleY
}: SelectionDotProps): React.ReactElement {
  const lineOpacity = useSharedValue(0)
  const colorScheme = useSelector(selectSelectedColorScheme)

  const color = colorScheme === 'dark' ? '#ffffff' : '#28282E'

  const point1 = useDerivedValue(() => {
    return vec(circleX.value, 1000)
  }, [circleX])

  const point2 = useDerivedValue(() => {
    return vec(circleX.value, 0)
  }, [circleX])

  const setIsActive = useCallback(
    (active: boolean) => {
      lineOpacity.value = withSpring(active ? 1 : 0, {
        mass: 1,
        stiffness: 1000,
        damping: 50,
        velocity: 0
      })
    },
    [lineOpacity]
  )

  useAnimatedReaction(
    () => isActive.value,
    active => {
      runOnJS(setIsActive)(active)
    },
    [isActive, setIsActive]
  )

  return (
    <>
      <Circle
        cx={circleX}
        cy={circleY}
        r={4}
        color={color}
        opacity={lineOpacity}
      />
      <Line
        opacity={lineOpacity}
        p1={point1}
        p2={point2}
        color={color}
        style="stroke"
        strokeWidth={3}
      />
    </>
  )
}

import React, { useCallback } from 'react'
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated'
import {
  runSpring,
  useValue,
  useComputedValue,
  Circle,
  Group,
  Shadow,
  Line,
  vec
} from '@shopify/react-native-skia'
import type { SelectionDotProps } from 'react-native-graph'
import { CHART_HEIGHT } from './TokenDetails/TokenDetail'

const CIRCLE_RADIUS = 6
const CIRCLE_RADIUS_MULTIPLIER = 2.5

export function SelectionDot({
  isActive,
  circleX,
  circleY
}: SelectionDotProps): React.ReactElement {
  const circleRadius = useValue(0)

  const circleStrokeRadius = useComputedValue(
    () => circleRadius.current * CIRCLE_RADIUS_MULTIPLIER,
    [circleRadius]
  )
  const lineOpacity = useComputedValue(
    () => circleRadius.current * 1,
    [circleRadius]
  )

  const lineP1 = useComputedValue(() => {
    return vec(circleX.current, CHART_HEIGHT)
  }, [circleX])

  const lineP2 = useComputedValue(() => {
    return vec(circleX.current, 0)
  }, [circleX])

  const setIsActive = useCallback(
    (active: boolean) => {
      runSpring(circleRadius, active ? CIRCLE_RADIUS : 0, {
        mass: 1,
        stiffness: 1000,
        damping: 50,
        velocity: 0
      })
    },
    [circleRadius]
  )

  useAnimatedReaction(
    () => isActive.value,
    active => {
      runOnJS(setIsActive)(active)
    },
    [isActive, setIsActive]
  )

  return (
    <Group>
      <Circle
        opacity={0.15}
        cx={circleX}
        cy={circleY}
        r={circleStrokeRadius}
        color="#ffffff"
      />
      <Circle cx={circleX} cy={circleY} r={circleRadius} color={'#ffffff'}>
        <Shadow dx={0} dy={0} color="rgba(0,0,0,0.5)" blur={4} />
      </Circle>
      <Line
        opacity={lineOpacity}
        p1={lineP1}
        p2={lineP2}
        color="#ffffff"
        style="stroke"
        strokeWidth={0.5}
      />
    </Group>
  )
}

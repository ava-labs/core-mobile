import React, { useCallback } from 'react'
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated'
import {
  runSpring,
  useValue,
  useComputedValue,
  Line,
  vec
} from '@shopify/react-native-skia'
import type { SelectionDotProps } from 'react-native-graph'
import { CHART_HEIGHT } from './TokenDetails/TokenDetail'

export function SelectionDot({
  isActive,
  circleX
}: SelectionDotProps): React.ReactElement {
  const lineOpacity = useValue(0)

  const lineP1 = useComputedValue(() => {
    return vec(circleX.current, CHART_HEIGHT)
  }, [circleX])

  const lineP2 = useComputedValue(() => {
    return vec(circleX.current, 0)
  }, [circleX])

  const setIsActive = useCallback(
    (active: boolean) => {
      runSpring(lineOpacity, active ? 1 : 0, {
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
    <Line
      opacity={lineOpacity}
      p1={lineP1}
      p2={lineP2}
      color="#ffffff"
      style="stroke"
      strokeWidth={1}
    />
  )
}

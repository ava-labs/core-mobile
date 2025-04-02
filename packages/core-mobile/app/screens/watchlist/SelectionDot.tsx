import React, { useCallback } from 'react'
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated'
import { Line, vec } from '@shopify/react-native-skia'
import {
  useDerivedValue,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'
import type { SelectionDotProps } from 'react-native-graph'
import { CHART_HEIGHT } from './TokenDetails/TokenDetails'

export function SelectionDot({
  isActive,
  circleX
}: SelectionDotProps): React.ReactElement {
  const lineOpacity = useSharedValue(0)

  const lineP1 = useDerivedValue(() => {
    return vec(circleX.value, CHART_HEIGHT)
  }, [circleX])

  const lineP2 = useDerivedValue(() => {
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

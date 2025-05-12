import React from 'react'
import { useDerivedValue } from 'react-native-reanimated'
import { Line, vec, Circle } from '@shopify/react-native-skia'
import type { SelectionDotProps } from 'react-native-graph'
import { ColorSchemeName } from 'store/settings/appearance'

export function SelectionDot({
  isActive,
  circleX,
  circleY,
  colorScheme
}: SelectionDotProps & {
  colorScheme: ColorSchemeName
}): React.ReactElement | undefined {
  const color = colorScheme === 'dark' ? '#ffffff' : '#28282E'

  const point1 = useDerivedValue(() => {
    return vec(circleX.value, 1000)
  }, [circleX])

  const point2 = useDerivedValue(() => {
    return vec(circleX.value, 0)
  }, [circleX])

  if (!isActive.value) {
    return undefined
  }

  return (
    <>
      <Circle cx={circleX} cy={circleY} r={4} color={color} />
      <Line
        p1={point1}
        p2={point2}
        color={color}
        style="stroke"
        strokeWidth={3}
      />
    </>
  )
}

import React from 'react'
import Svg, { Circle } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  borderColor?: string
  fillColor?: string
  size?: number
  testID?: string
}

export default function DotSVG({
  borderColor,
  fillColor,
  size
}: Prop): JSX.Element {
  const context = useApplicationContext()

  const stroke = fillColor ?? borderColor ?? context.theme.colorStroke
  const computedSize = size ?? 20

  return (
    <Svg
      width={computedSize}
      height={computedSize}
      viewBox="0 0 20 20"
      fill={fillColor}>
      <Circle cx="10" cy="10" r="9.5" stroke={stroke} />
    </Svg>
  )
}

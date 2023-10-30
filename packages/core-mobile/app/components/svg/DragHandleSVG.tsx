import React from 'react'
import Svg, { Path } from 'react-native-svg'

interface Prop {
  fillColor?: string
  size?: number
  testID?: string
}

export default function DragHandleSVG({ fillColor, size }: Prop) {
  const ratio = 16 / 6
  const width = size || 16
  const height = width / ratio

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 16 6"
      fill={fillColor ?? '#F8F8FB'}>
      <Path d="M15 0H1C0.45 0 0 0.45 0 1C0 1.55 0.45 2 1 2H15C15.55 2 16 1.55 16 1C16 0.45 15.55 0 15 0ZM1 6H15C15.55 6 16 5.55 16 5C16 4.45 15.55 4 15 4H1C0.45 4 0 4.45 0 5C0 5.55 0.45 6 1 6Z" />
    </Svg>
  )
}

import React from 'react'
import Svg, { Rect } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  size?: number
}

function GridSVG({ color, size = 24 }: Prop) {
  const context = useApplicationContext()

  const svgColor = color ? color : context.theme.colorPrimary1

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3.75"
        y="3.75"
        width="6.80769"
        height="6.80769"
        rx="2.25"
        fill={svgColor}
      />
      <Rect
        x="3.75"
        y="13.4424"
        width="6.80769"
        height="6.80769"
        rx="2.25"
        fill={svgColor}
      />
      <Rect
        x="13.4423"
        y="3.75"
        width="6.80769"
        height="6.80769"
        rx="2.25"
        fill={svgColor}
      />
      <Rect
        x="13.4423"
        y="13.4424"
        width="6.80769"
        height="6.80769"
        rx="2.25"
        fill={svgColor}
      />
    </Svg>
  )
}

export default GridSVG

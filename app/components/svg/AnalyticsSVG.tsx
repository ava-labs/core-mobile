import React from 'react'
import Svg, { Circle, Rect } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  circleColor?: string
}

function AnalyticsSVG({ color, circleColor }: Prop) {
  const context = useApplicationContext()

  const iconColor = color ?? context.theme.colorIcon1
  const borderColor = circleColor ?? context.theme.colorStroke
  return (
    <Svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <Circle cx="22" cy="22" r="21.5" stroke={borderColor} />
      <Rect x="11" y="28" width="2.5" height="6" rx="1.25" fill={iconColor} />
      <Rect
        x="17.5"
        y="18"
        width="2.5"
        height="16"
        rx="1.25"
        fill={iconColor}
      />
      <Rect x="24" y="10" width="2.5" height="24" rx="1.25" fill={iconColor} />
      <Rect
        x="30.5"
        y="22"
        width="2.5"
        height="12"
        rx="1.25"
        fill={iconColor}
      />
    </Svg>
  )
}

export default AnalyticsSVG

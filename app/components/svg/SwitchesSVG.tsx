import React from 'react'
import Svg, { Circle, Rect } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
}

export default function SwitchesSVG({ color }: Prop) {
  const context = useApplicationContext()

  const iconColor = color ?? context.theme.colorIcon1
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Rect y="5" width="6" height="2.5" rx="1.25" fill={iconColor} />
      <Rect x="15" y="5" width="9" height="2.5" rx="1.25" fill={iconColor} />
      <Circle cx="9" cy="6" r="3.75" stroke={iconColor} strokeWidth="2.5" />
      <Rect
        x="24"
        y="19"
        width="6"
        height="2.5"
        rx="1.25"
        transform="rotate(-180 24 19)"
        fill={iconColor}
      />
      <Rect
        x="9"
        y="19"
        width="9"
        height="2.5"
        rx="1.25"
        transform="rotate(-180 9 19)"
        fill={iconColor}
      />
      <Circle
        cx="15"
        cy="18"
        r="3.75"
        transform="rotate(-180 15 18)"
        stroke={iconColor}
        strokeWidth="2.5"
      />
    </Svg>
  )
}

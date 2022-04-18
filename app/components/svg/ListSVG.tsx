import React from 'react'
import Svg, { Rect } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  size?: number
}

function ListSVG({ color, size = 24 }: Prop) {
  const context = useApplicationContext()

  const svgColor = color ? color : context.theme.colorPrimary1

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="8" y="6" width="12" height="2" rx="1" fill={svgColor} />
      <Rect x="8" y="11" width="12" height="2" rx="1" fill={svgColor} />
      <Rect x="8" y="16" width="12" height="2" rx="1" fill={svgColor} />
      <Rect x="4" y="6" width="2" height="2" rx="1" fill={svgColor} />
      <Rect x="4" y="11" width="2" height="2" rx="1" fill={svgColor} />
      <Rect x="4" y="16" width="2" height="2" rx="1" fill={svgColor} />
    </Svg>
  )
}

export default ListSVG

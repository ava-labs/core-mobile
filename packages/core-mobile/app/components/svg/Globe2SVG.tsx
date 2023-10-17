import React from 'react'
import { ColorValue } from 'react-native'
import Svg, { NumberProp, Path } from 'react-native-svg'

interface Props {
  color?: ColorValue
  size?: NumberProp
  testID?: string
}

export default function Globe2SVG({ size = 20, color = '#fff' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM9 17.93C5.05 17.44 2 14.08 2 10C2 9.38 2.08 8.79 2.21 8.21L7 13V14C7 15.1 7.9 16 9 16V17.93ZM15.9 15.39C15.64 14.58 14.9 14 14 14H13V11C13 10.45 12.55 10 12 10H6V8H8C8.55 8 9 7.55 9 7V5H11C12.1 5 13 4.1 13 3V2.59C15.93 3.78 18 6.65 18 10C18 12.08 17.2 13.97 15.9 15.39Z"
        fill={color}
      />
    </Svg>
  )
}

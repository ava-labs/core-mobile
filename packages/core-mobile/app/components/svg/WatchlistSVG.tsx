import React from 'react'
import Svg, { Rect } from 'react-native-svg'
import { useTheme } from '@avalabs/k2-mobile'

interface Prop {
  selected: boolean
  size?: number
}

function WatchListSVG({ selected, size = 32 }: Prop): JSX.Element {
  const { theme } = useTheme()
  const svgColor = selected ? theme.colors.$blueDark : theme.colors.$neutral600
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      accessible={false}
      testID={'watchlistSVG'}>
      <Rect
        x="9"
        y="8"
        width="20"
        height="2"
        rx="1"
        fill={svgColor}
        stroke={svgColor}
      />
      <Rect
        x="9"
        y="15"
        width="20"
        height="2"
        rx="1"
        fill={svgColor}
        stroke={svgColor}
      />
      <Rect
        x="9"
        y="22"
        width="20"
        height="2"
        rx="1"
        fill={svgColor}
        stroke={svgColor}
      />
      <Rect
        x="3"
        y="8"
        width="2"
        height="2"
        rx="1"
        fill={svgColor}
        stroke={svgColor}
      />
      <Rect
        x="3"
        y="15"
        width="2"
        height="2"
        rx="1"
        fill={svgColor}
        stroke={svgColor}
      />
      <Rect
        x="3"
        y="22"
        width="2"
        height="2"
        rx="1"
        fill={svgColor}
        stroke={svgColor}
      />
    </Svg>
  )
}

export default WatchListSVG

import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { useTheme } from '@avalabs/k2-mobile'

interface Prop {
  color?: string
  width?: number
  height?: number
  testID?: string
}

function TimerSVG({ color, width = 73, height = 72 }: Prop): JSX.Element {
  const { theme } = useTheme()
  const iconColor = color ?? theme.colors.$white
  return (
    <Svg width={width} height={height} viewBox="0 0 73 72" fill="none">
      <Path
        id="Vector"
        d="M45.5 4.5H27.5V10.5H45.5V4.5ZM33.5 43.5H39.5V25.5H33.5V43.5ZM57.59 23.67L61.85 19.41C60.56 17.88 59.15 16.44 57.62 15.18L53.36 19.44C48.71 15.72 42.86 13.5 36.5 13.5C21.59 13.5 9.5 25.59 9.5 40.5C9.5 55.41 21.56 67.5 36.5 67.5C51.44 67.5 63.5 55.41 63.5 40.5C63.5 34.14 61.28 28.29 57.59 23.67ZM36.5 61.5C24.89 61.5 15.5 52.11 15.5 40.5C15.5 28.89 24.89 19.5 36.5 19.5C48.11 19.5 57.5 28.89 57.5 40.5C57.5 52.11 48.11 61.5 36.5 61.5Z"
        fill={iconColor}
      />
    </Svg>
  )
}

export default TimerSVG

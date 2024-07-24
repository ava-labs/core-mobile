import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { useTheme } from '@avalabs/k2-mobile'

interface Prop {
  color?: string
  width?: number
  height?: number
  testID?: string
}

function ErrorOutlineSVG({
  color,
  width = 73,
  height = 72
}: Prop): JSX.Element {
  const { theme } = useTheme()
  const iconColor = color ?? theme.colors.$white
  return (
    <Svg width={width} height={height} viewBox="0 0 73 72" fill="none">
      <Path
        id="Vector"
        d="M36.5 21C38.15 21 39.5 22.35 39.5 24V36C39.5 37.65 38.15 39 36.5 39C34.85 39 33.5 37.65 33.5 36V24C33.5 22.35 34.85 21 36.5 21ZM36.47 6C19.91 6 6.5 19.44 6.5 36C6.5 52.56 19.91 66 36.47 66C53.06 66 66.5 52.56 66.5 36C66.5 19.44 53.06 6 36.47 6ZM36.5 60C23.24 60 12.5 49.26 12.5 36C12.5 22.74 23.24 12 36.5 12C49.76 12 60.5 22.74 60.5 36C60.5 49.26 49.76 60 36.5 60ZM39.5 51H33.5V45H39.5V51Z"
        fill={iconColor}
      />
    </Svg>
  )
}

export default ErrorOutlineSVG

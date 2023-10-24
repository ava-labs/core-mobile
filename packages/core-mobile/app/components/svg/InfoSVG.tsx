import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  size?: number
  testID?: string
}

function InfoSVG({ color, size = 14 }: Prop): JSX.Element {
  const context = useApplicationContext()
  const iconColor = color ?? context.theme.colorText2
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      testID="info_svg">
      <Path
        d="M6.333 3.667h1.334V5H6.333V3.667zm0 2.666h1.334v4H6.333v-4zm.667-6A6.67 6.67 0 00.333 7 6.67 6.67 0 007 13.667 6.67 6.67 0 0013.667 7 6.67 6.67 0 007 .333zm0 12A5.34 5.34 0 011.667 7 5.34 5.34 0 017 1.667 5.34 5.34 0 0112.333 7 5.34 5.34 0 017 12.333z"
        fill={iconColor}
      />
    </Svg>
  )
}

export default InfoSVG

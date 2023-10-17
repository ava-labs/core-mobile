import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  size?: number
}

const aspectRatio = 10 / 12

function CopySVG({ color, size = 16 }: Prop) {
  const theme = useApplicationContext().theme
  const iconColor = color ?? theme.alternateBackground
  return (
    <Svg
      width={size}
      height={aspectRatio * size}
      viewBox="0 0 10 12"
      fill="none">
      <Path
        d="M7.25.5h-6c-.55 0-1 .45-1 1v7h1v-7h6v-1zm1.5 2h-5.5c-.55 0-1 .45-1 1v7c0 .55.45 1 1 1h5.5c.55 0 1-.45 1-1v-7c0-.55-.45-1-1-1zm0 8h-5.5v-7h5.5v7z"
        fill={iconColor}
      />
    </Svg>
  )
}

export default CopySVG

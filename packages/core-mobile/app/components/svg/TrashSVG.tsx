import React from 'react'
import Svg, { ClipPath, Defs, G, Line, Path, Rect } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  size?: number
}

function TrashSVG({ color, size = 32 }: Prop) {
  const theme = useApplicationContext().theme
  const iconColor = color ?? theme.alternateBackground
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <G clip-path="url(#clip0_317_35314)">
        <Path
          d="M3.5 6.73828H12.5V14.2383C12.5 14.7906 12.0523 15.2383 11.5 15.2383H4.5C3.94772 15.2383 3.5 14.7906 3.5 14.2383V6.73828Z"
          stroke={iconColor}
        />
        <Rect
          x="2"
          y="4.73828"
          width="12"
          height="2"
          rx="0.75"
          stroke={iconColor}
        />
        <Path
          d="M6.5 4.73828H6V4.23828V3.48828C6 3.07407 6.33579 2.73828 6.75 2.73828H9.25C9.66421 2.73828 10 3.07407 10 3.48828V4.23828V4.73828H9.5H6.5Z"
          stroke={iconColor}
        />
        <Line
          x1="6"
          y1="9.23828"
          x2="6"
          y2="12.9049"
          stroke={iconColor}
          strokeLinecap="round"
        />
        <Line
          x1="8"
          y1="9.23828"
          x2="8"
          y2="12.9049"
          stroke={iconColor}
          strokeLinecap="round"
        />
        <Line
          x1="10"
          y1="9.23828"
          x2="10"
          y2="12.9049"
          stroke={iconColor}
          strokeLinecap="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_317_35314">
          <Rect
            width={size}
            height={size}
            stroke={iconColor}
            transform="translate(0 0.738281)"
          />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default TrashSVG

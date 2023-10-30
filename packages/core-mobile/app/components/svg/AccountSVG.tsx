import React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  circleColor?: string
}

function AccountSVG({ color, circleColor }: Prop) {
  const context = useApplicationContext()

  const iconColor = color ?? context.theme.colorIcon1
  const borderColor = circleColor ?? context.theme.colorStroke
  return (
    <Svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <Circle cx="22" cy="22" r="21.5" stroke={borderColor} />
      <Circle cx="22" cy="16" r="5" stroke={iconColor} strokeWidth="2" />
      <Path
        d="M32 29C32 29.8347 31.4167 30.8129 29.7212 31.6359C28.0407 32.4517 25.456 33 22 33C18.544 33 15.9593 32.4517 14.2788 31.6359C12.5833 30.8129 12 29.8347 12 29C12 28.1653 12.5833 27.1871 14.2788 26.3641C15.9593 25.5483 18.544 25 22 25C25.456 25 28.0407 25.5483 29.7212 26.3641C31.4167 27.1871 32 28.1653 32 29Z"
        stroke={iconColor}
        strokeWidth="2"
      />
    </Svg>
  )
}

export default AccountSVG

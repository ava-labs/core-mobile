import React from 'react'
import Svg, {Path} from 'react-native-svg'
import {useApplicationContext} from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  size?: number
}

function InfoSVG({color, size = 16}: Prop) {
  const context = useApplicationContext()
  const iconColor = color ?? context.theme.colorText2
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8.00002 0.0288086C3.60509 0.0288086 0.029007 3.60489 0.029007 7.99982C0.029007 12.3947 3.60509 15.9708 8.00002 15.9708C12.3949 15.9708 15.971 12.3947 15.971 7.99982C15.971 3.60489 12.3949 0.0288086 8.00002 0.0288086ZM8.00002 14.5216C4.40437 14.5216 1.47828 11.5955 1.47828 7.99982C1.47828 4.40417 4.40437 1.47808 8.00002 1.47808C11.5957 1.47808 14.5218 4.40417 14.5218 7.99982C14.5218 11.5955 11.5957 14.5216 8.00002 14.5216Z"
        fill={iconColor}
      />
      <Path
        d="M8 5.82617C7.6 5.82617 7.27536 6.15081 7.27536 6.55081V11.6233C7.27536 12.0233 7.6 12.3479 8 12.3479C8.4 12.3479 8.72463 12.0233 8.72463 11.6233V6.55081C8.72463 6.15081 8.4 5.82617 8 5.82617Z"
        fill={iconColor}
      />
      <Path
        d="M8 5.10113C8.4002 5.10113 8.72463 4.7767 8.72463 4.37649C8.72463 3.97629 8.4002 3.65186 8 3.65186C7.59979 3.65186 7.27536 3.97629 7.27536 4.37649C7.27536 4.7767 7.59979 5.10113 8 5.10113Z"
        fill={iconColor}
      />
    </Svg>
  )
}

export default InfoSVG

import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  size?: number
}

function BridgeToggleSVG({ color, size = 20 }: Prop) {
  const { theme } = useApplicationContext()

  const svgColor = color ?? theme.background

  return (
    <Svg width={size} height={size} viewBox="0 0 14 18" fill="none">
      <Path
        d="M11.0025 14.0095V7.99953C11.0025 7.44953 10.5525 6.99953 10.0025 6.99953C9.45247 6.99953 9.00247 7.44953 9.00247 7.99953V14.0095H7.21247C6.76247 14.0095 6.54247 14.5495 6.86247 14.8595L9.65247 17.6395C9.85247 17.8295 10.1625 17.8295 10.3625 17.6395L13.1525 14.8595C13.4725 14.5495 13.2425 14.0095 12.8025 14.0095H11.0025ZM3.65247 0.349531L0.862472 3.13953C0.542472 3.44953 0.762472 3.98953 1.21247 3.98953H3.00247V9.99953C3.00247 10.5495 3.45247 10.9995 4.00247 10.9995C4.55247 10.9995 5.00247 10.5495 5.00247 9.99953V3.98953H6.79247C7.24247 3.98953 7.46247 3.44953 7.14247 3.13953L4.35247 0.349531C4.16247 0.159531 3.84247 0.159531 3.65247 0.349531Z"
        fill={svgColor}
      />
    </Svg>
  )
}

export default BridgeToggleSVG

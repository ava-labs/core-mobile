import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  size?: number
}

export default function QRScanSVG({ color, size = 24 }: Prop) {
  const context = useApplicationContext()

  const iconColor = color ?? context.theme.alternateBackground
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15C3.45 15 3 15.45 3 16V19C3 20.1 3.9 21 5 21H8C8.55 21 9 20.55 9 20C9 19.45 8.55 19 8 19H6C5.45 19 5 18.55 5 18V16C5 15.45 4.55 15 4 15ZM5 6C5 5.45 5.45 5 6 5H8C8.55 5 9 4.55 9 4C9 3.45 8.55 3 8 3H5C3.9 3 3 3.9 3 5V8C3 8.55 3.45 9 4 9C4.55 9 5 8.55 5 8V6ZM19 3H16C15.45 3 15 3.45 15 4C15 4.55 15.45 5 16 5H18C18.55 5 19 5.45 19 6V8C19 8.55 19.45 9 20 9C20.55 9 21 8.55 21 8V5C21 3.9 20.1 3 19 3ZM19 18C19 18.55 18.55 19 18 19H16C15.45 19 15 19.45 15 20C15 20.55 15.45 21 16 21H19C20.1 21 21 20.1 21 19V16C21 15.45 20.55 15 20 15C19.45 15 19 15.45 19 16V18ZM12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8ZM12 14C10.9 14 10 13.1 10 12C10 10.9 10.9 10 12 10C13.1 10 14 10.9 14 12C14 13.1 13.1 14 12 14Z"
        fill={iconColor}
      />
    </Svg>
  )
}

import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  size?: number
}

function CheckmarkSVG({ color, size = 16 }: Prop) {
  const context = useApplicationContext()

  const iconColor = color ?? context.theme.alternateBackground
  return (
    <Svg width={size} height={size * 0.75} viewBox="0 0 16 12" fill="none">
      <Path
        d="M15.2638 0.795116C14.844 0.358154 14.1477 0.349993 13.7178 0.776999L6.20375 8.2408L2.32622 4.33273C1.87713 3.8801 1.1403 3.89663 0.711956 4.36895C0.313259 4.80857 0.329731 5.48372 0.749392 5.90338L5.31142 10.4654C5.80424 10.9582 6.60326 10.9582 7.09608 10.4654L15.2486 2.31293C15.666 1.8955 15.6728 1.22084 15.2638 0.795116Z"
        fill={iconColor}
      />
    </Svg>
  )
}

export default CheckmarkSVG

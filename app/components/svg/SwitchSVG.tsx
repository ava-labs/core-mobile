import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  width?: number
  height?: number
  testID?: string
}

function SwitchSVG({ color, width = 59, height = 44 }: Prop) {
  const context = useApplicationContext()
  const iconColor = color ?? context.theme.white
  return (
    <Svg width={width} height={height} viewBox="0 0 59 44" fill="none">
      <Path
        d="M58.45 8.9496L50.08 0.579603C49.12 -0.380397 47.5 0.279603 47.5 1.6296V6.9996H5.5C3.85 6.9996 2.5 8.3496 2.5 9.9996C2.5 11.6496 3.85 12.9996 5.5 12.9996H47.5V18.3696C47.5 19.7196 49.12 20.3796 50.05 19.4196L58.42 11.0496C59.02 10.4796 59.02 9.5196 58.45 8.9496Z"
        fill="white"
      />
      <Path
        d="M53.5 30.9996H11.5V25.6296C11.5 24.2796 9.88 23.6196 8.95 24.5796L0.580001 32.9496C-0.0199991 33.5196 -0.0199991 34.4796 0.550001 35.0496L8.92 43.4196C9.88 44.3796 11.5 43.7196 11.5 42.3696V36.9996H53.5C55.15 36.9996 56.5 35.6496 56.5 33.9996C56.5 32.3496 55.15 30.9996 53.5 30.9996Z"
        fill={iconColor}
      />
    </Svg>
  )
}

export default SwitchSVG

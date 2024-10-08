import React from 'react'
import { ColorValue } from 'react-native'
import Svg, { NumberProp, Path } from 'react-native-svg'

interface Props {
  color?: ColorValue
  size?: NumberProp
}

export default function EditSVG({ size = 24, color = '#fff' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 17.4601V20.5001C3 20.7801 3.22 21.0001 3.5 21.0001H6.54C6.67 21.0001 6.8 20.9501 6.89 20.8501L17.81 9.94006L14.06 6.19006L3.15 17.1001C3.05 17.2001 3 17.3201 3 17.4601ZM20.71 7.04006C21.1 6.65006 21.1 6.02006 20.71 5.63006L18.37 3.29006C17.98 2.90006 17.35 2.90006 16.96 3.29006L15.13 5.12006L18.88 8.87006L20.71 7.04006Z"
        fill={color}
      />
    </Svg>
  )
}

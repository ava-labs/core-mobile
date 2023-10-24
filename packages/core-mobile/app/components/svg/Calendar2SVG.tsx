import React from 'react'
import { ColorValue } from 'react-native'
import Svg, { NumberProp, Path } from 'react-native-svg'

interface Props {
  color?: ColorValue
  width?: NumberProp
  height?: NumberProp
  testID?: string
}

export default function Calendar2SVG({
  width = 18,
  height = 20,
  color = '#F8F8FB'
}: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 18 20" fill="none">
      <Path
        d="M14 0C13.45 0 13 0.45 13 1V2H5V1C5 0.45 4.55 0 4 0C3.45 0 3 0.45 3 1V2H2C0.89 2 0.00999999 2.9 0.00999999 4L0 18C0 19.1 0.89 20 2 20H16C17.1 20 18 19.1 18 18V4C18 2.9 17.1 2 16 2H15V1C15 0.45 14.55 0 14 0ZM16 18H2V8H16V18ZM8 11C8 10.45 8.45 10 9 10C9.55 10 10 10.45 10 11C10 11.55 9.55 12 9 12C8.45 12 8 11.55 8 11ZM4 11C4 10.45 4.45 10 5 10C5.55 10 6 10.45 6 11C6 11.55 5.55 12 5 12C4.45 12 4 11.55 4 11ZM12 11C12 10.45 12.45 10 13 10C13.55 10 14 10.45 14 11C14 11.55 13.55 12 13 12C12.45 12 12 11.55 12 11ZM8 15C8 14.45 8.45 14 9 14C9.55 14 10 14.45 10 15C10 15.55 9.55 16 9 16C8.45 16 8 15.55 8 15ZM4 15C4 14.45 4.45 14 5 14C5.55 14 6 14.45 6 15C6 15.55 5.55 16 5 16C4.45 16 4 15.55 4 15ZM12 15C12 14.45 12.45 14 13 14C13.55 14 14 14.45 14 15C14 15.55 13.55 16 13 16C12.45 16 12 15.55 12 15Z"
        fill={color}
      />
    </Svg>
  )
}

import React from 'react'
import { ColorValue } from 'react-native'
import Svg, { NumberProp, Path } from 'react-native-svg'

interface Props {
  color?: ColorValue
  width?: NumberProp
  height?: NumberProp
  testID?: string
}

export default function CircularPlusSVG({
  width = 24,
  height = 18,
  color = '#F8F8FB'
}: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 18" fill="none">
      <Path
        d="M15 5C14.45 5 14 5.45 14 6V8H12C11.45 8 11 8.45 11 9C11 9.55 11.45 10 12 10H14V12C14 12.55 14.45 13 15 13C15.55 13 16 12.55 16 12V10H18C18.55 10 19 9.55 19 9C19 8.45 18.55 8 18 8H16V6C16 5.45 15.55 5 15 5ZM2 9C2 6.42 3.4 4.17 5.48 2.96C5.8 2.77 6.01 2.45 6.01 2.08C6.01 1.31 5.17 0.83 4.5 1.22C1.82 2.78 0 5.68 0 9C0 12.32 1.82 15.22 4.5 16.78C5.17 17.17 6.01 16.69 6.01 15.92C6.01 15.55 5.8 15.23 5.48 15.04C3.4 13.83 2 11.58 2 9ZM15 0C10.04 0 6 4.04 6 9C6 13.96 10.04 18 15 18C19.96 18 24 13.96 24 9C24 4.04 19.96 0 15 0ZM15 16C11.14 16 8 12.86 8 9C8 5.14 11.14 2 15 2C18.86 2 22 5.14 22 9C22 12.86 18.86 16 15 16Z"
        fill={color}
      />
    </Svg>
  )
}

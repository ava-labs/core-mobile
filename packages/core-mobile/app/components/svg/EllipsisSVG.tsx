import React from 'react'
import { ColorValue } from 'react-native'
import Svg, { NumberProp, Path } from 'react-native-svg'

interface Props {
  color?: ColorValue
  size?: NumberProp
  testID?: string
}

export default function EllipsisSVG({ size = 32, color = '#fff' }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      testID="ellipsis_svg">
      <Path
        d="M7.99992 13.3333C6.53325 13.3333 5.33325 14.5333 5.33325 15.9999C5.33325 17.4666 6.53325 18.6666 7.99992 18.6666C9.46659 18.6666 10.6666 17.4666 10.6666 15.9999C10.6666 14.5333 9.46659 13.3333 7.99992 13.3333ZM23.9999 13.3333C22.5333 13.3333 21.3333 14.5333 21.3333 15.9999C21.3333 17.4666 22.5333 18.6666 23.9999 18.6666C25.4666 18.6666 26.6666 17.4666 26.6666 15.9999C26.6666 14.5333 25.4666 13.3333 23.9999 13.3333ZM15.9999 13.3333C14.5333 13.3333 13.3333 14.5333 13.3333 15.9999C13.3333 17.4666 14.5333 18.6666 15.9999 18.6666C17.4666 18.6666 18.6666 17.4666 18.6666 15.9999C18.6666 14.5333 17.4666 13.3333 15.9999 13.3333Z"
        fill={color}
      />
    </Svg>
  )
}

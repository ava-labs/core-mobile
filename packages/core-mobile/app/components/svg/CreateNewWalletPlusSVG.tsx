import React from 'react'
import Svg, { Line } from 'react-native-svg'

export enum IconWeight {
  regular = '3.25',
  bold = '5.25',
  extraBold = '9.25'
}

interface Prop {
  size?: number
  weight?: IconWeight
  color?: string
  testID?: string
}

function CreateNewWalletPlusSVG({
  size = 65,
  weight = IconWeight.regular,
  color = 'white'
}: Prop): JSX.Element {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 65 65"
      fill="none"
      testID="create_new_wallet_plus_svg">
      <Line
        x1="32.5956"
        y1="8.125"
        x2="32.5956"
        y2="56.875"
        stroke={color}
        strokeWidth={weight}
        strokeLinecap="round"
      />
      <Line
        x1="8.12497"
        y1="32.4043"
        x2="56.875"
        y2="32.4043"
        stroke={color}
        strokeWidth={weight}
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default CreateNewWalletPlusSVG

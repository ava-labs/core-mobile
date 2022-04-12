import React from 'react'
import Svg, {Line} from 'react-native-svg'

interface Prop {
  size?: number
}

function CreateNewWalletPlusSVG({size = 65}: Prop) {
  return (
    <Svg width={size} height={size} viewBox="0 0 65 65" fill="none">
      <Line
        x1="32.5956"
        y1="8.125"
        x2="32.5956"
        y2="56.875"
        stroke="white"
        strokeWidth="3.25"
        strokeLinecap="round"
      />
      <Line
        x1="8.12497"
        y1="32.4043"
        x2="56.875"
        y2="32.4043"
        stroke="white"
        strokeWidth="3.25"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default CreateNewWalletPlusSVG

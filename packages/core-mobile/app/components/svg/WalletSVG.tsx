import React from 'react'
import Svg, { Path, Rect } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  backgroundColor?: string
  size?: number
}

function WalletSVG({ size = 65, backgroundColor }: Prop) {
  const theme = useApplicationContext().theme
  const bgColor = backgroundColor ?? theme.colorBg1

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 65 65"
      fill="none"
      testID="wallet_svg">
      <Rect
        x="4.87589"
        y="8.125"
        width="44.8322"
        height="23.9881"
        rx="4.875"
        fill={bgColor}
        stroke="white"
        strokeWidth="3.25"
      />
      <Path
        d="M4.87518 18.0293H55.2502C57.9426 18.0293 60.1252 20.2119 60.1252 22.9043V51.9995C60.1252 54.6919 57.9426 56.8745 55.2502 56.8745H9.75018C7.05779 56.8745 4.87518 54.6919 4.87518 51.9995V18.0293Z"
        fill={bgColor}
        stroke="white"
        strokeWidth="3.25"
      />
      <Rect
        x="42"
        y="30.0625"
        width="17.875"
        height="13.8125"
        rx="2.4375"
        stroke="white"
        strokeWidth="3.25"
      />
    </Svg>
  )
}

export default WalletSVG

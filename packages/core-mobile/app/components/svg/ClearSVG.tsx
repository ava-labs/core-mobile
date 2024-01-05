import React from 'react'
import { Platform } from 'react-native'
import Svg, { Path } from 'react-native-svg'

interface Props {
  size?: number
  color: string
  backgroundColor: string
}

function ClearSVG({ color, backgroundColor, size = 24 }: Props): JSX.Element {
  const svgColor = color
  const bgColor = backgroundColor

  return (
    <Svg
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      testID="clear_svg"
      pointerEvents={Platform.OS === 'android' ? 'none' : undefined}>
      <Path
        clip-rule="evenodd"
        d="M0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12Z"
        fill={bgColor}
        fill-rule="evenodd"
      />
      <Path
        clip-rule="evenodd"
        d="M16.6597 8.4312C16.961 8.12994 16.961 7.6415 16.6597 7.34023C16.3585 7.03897 15.87 7.03897 15.5688 7.34023L12 10.909L8.43117 7.34023C8.12991 7.03897 7.64147 7.03897 7.3402 7.34023C7.03894 7.6415 7.03894 8.12994 7.3402 8.4312L10.909 12L7.3402 15.5688C7.03894 15.8701 7.03894 16.3585 7.3402 16.6598C7.64147 16.961 8.12991 16.961 8.43117 16.6598L12 13.091L15.5688 16.6598C15.87 16.961 16.3585 16.961 16.6597 16.6598C16.961 16.3585 16.961 15.8701 16.6597 15.5688L13.0909 12L16.6597 8.4312Z"
        fill={svgColor}
        fill-rule="evenodd"
      />
    </Svg>
  )
}

export default ClearSVG

import React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  circleColor?: string
}

function GraphSVG({ color, circleColor }: Prop) {
  const context = useApplicationContext()

  const iconColor = color ?? context.theme.colorIcon1
  const borderColor = circleColor ?? context.theme.colorStroke

  return (
    <Svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <Circle cx="22" cy="22" r="21.5" stroke={borderColor} />
      <Path
        clipRule="evenodd"
        d="M13.6 31.6C12.9373 31.6 12.4 31.0627 12.4 30.4V11.2C12.4 10.5373 11.8628 10 11.2 10C10.5373 10 10 10.5373 10 11.2V30.4C10 32.3882 11.6118 34 13.6 34H32.8C33.4627 34 34 33.4627 34 32.8C34 32.1372 33.4627 31.6 32.8 31.6H13.6Z"
        fill={iconColor}
        fillRule="evenodd"
      />
      <Path
        d="M32.9927 13.0704C32.4364 12.7154 31.6976 12.8786 31.3426 13.435L26.0287 21.7635C25.7044 22.2719 24.978 22.3147 24.5962 21.848L21.602 18.1883C21.2157 17.7162 20.476 17.7781 20.1736 18.3079L15.3773 26.7112C15.0501 27.2844 15.2496 28.0142 15.8227 28.3414C16.3959 28.6686 17.1258 28.4691 17.453 27.8959L20.7054 22.1976C20.9211 21.8196 21.4489 21.7754 21.7245 22.1123L24.6282 25.6614C25.1125 26.2533 26.0338 26.199 26.4451 25.5543L33.3574 14.7205C33.7124 14.1641 33.5491 13.4253 32.9927 13.0704Z"
        fill={iconColor}
        fill-rule="evenodd"
      />
    </Svg>
  )
}

export default GraphSVG

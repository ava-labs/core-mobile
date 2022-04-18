import React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  circleColor?: string
  size?: number
  hideBorder?: boolean
}

function SearchSVG({ color, circleColor, size = 44, hideBorder }: Prop) {
  const context = useApplicationContext()

  const iconColor = color ?? context.theme.colorText2
  const borderColor = circleColor ?? context.theme.colorStroke

  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Path
        d="M33.2333 31.8602L27.5213 25.9194C28.99 24.1735 29.7947 21.9768 29.7947 19.69C29.7947 14.347 25.4476 10 20.1047 10C14.7617 10 10.4147 14.347 10.4147 19.69C10.4147 25.033 14.7617 29.38 20.1047 29.38C22.1105 29.38 24.0219 28.775 25.6562 27.6265L31.4116 33.6124C31.6522 33.8622 31.9757 34 32.3225 34C32.6507 34 32.962 33.8749 33.1984 33.6474C33.7006 33.1641 33.7166 32.3628 33.2333 31.8602ZM20.1047 12.5278C24.054 12.5278 27.2668 15.7407 27.2668 19.69C27.2668 23.6393 24.054 26.8522 20.1047 26.8522C16.1554 26.8522 12.9425 23.6393 12.9425 19.69C12.9425 15.7407 16.1554 12.5278 20.1047 12.5278Z"
        fill={iconColor}
      />
      {hideBorder || <Circle cx="22" cy="22" r="21.5" stroke={borderColor} />}
    </Svg>
  )
}

export default SearchSVG

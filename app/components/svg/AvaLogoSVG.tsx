import React from 'react'
import Svg, { G, Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Props {
  absolutePosition?: boolean
  size?: number
  logoColor?: string
  backgroundColor?: string
  testID?: string
}

function AvaLogoSVG({
  absolutePosition = false,
  size = 102,
  logoColor,
  backgroundColor
}: Props) {
  const { theme } = useApplicationContext()
  const lgColor = logoColor ?? theme.logoColor
  const bgColor = backgroundColor ?? theme.logoBgColor

  return (
    <Svg
      style={absolutePosition && { position: 'absolute' }}
      width={size}
      height={size}
      viewBox="0 0 57 56"
      fill="none"
      testID="ava_logo">
      <G clipPath="url(#a)">
        <Path fill={lgColor} d="M45.77 9.605H11.193v31.426H45.77V9.605Z" />
        <Path
          fill={bgColor}
          fillRule="evenodd"
          d="M56.481 28c0 15.443-12.527 27.963-27.981 27.963C13.046 55.963.519 43.443.519 28 .519 12.556 13.046.037 28.5.037 43.954.037 56.481 12.557 56.481 28Zm-35.91 11.128h-5.43c-1.142 0-1.705 0-2.049-.22a1.38 1.38 0 0 1-.626-1.079c-.02-.405.262-.9.825-1.889L26.7 12.322c.57-1.003.859-1.504 1.223-1.69.392-.2.86-.2 1.251 0 .365.186.653.687 1.224 1.69l2.756 4.809.014.024c.617 1.076.93 1.622 1.066 2.194a4.077 4.077 0 0 1 0 1.91c-.138.577-.447 1.127-1.073 2.219L26.118 35.92l-.018.032c-.62 1.084-.935 1.634-1.37 2.049a4.1 4.1 0 0 1-1.67.969c-.571.158-1.21.158-2.49.158Zm13.713 0h7.782c1.148 0 1.725 0 2.069-.227.371-.24.605-.646.626-1.085.02-.392-.257-.868-.797-1.8l-.056-.096-3.898-6.664-.044-.075c-.548-.925-.824-1.393-1.18-1.573a1.37 1.37 0 0 0-1.243 0c-.358.185-.646.673-1.217 1.655l-3.884 6.664-.013.023c-.569.98-.853 1.47-.832 1.873.027.44.254.844.625 1.085.337.22.914.22 2.062.22Z"
          clipRule="evenodd"
        />
      </G>
    </Svg>
  )
}

export default AvaLogoSVG

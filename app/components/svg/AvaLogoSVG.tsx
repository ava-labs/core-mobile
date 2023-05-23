import React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'
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
      viewBox="0 0 102 102"
      fill="none"
      testID="ava_logo">
      <Circle cx="50.5216" cy="51.2309" r="50.5216" fill={bgColor} />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23.4033 74.1201H35.2551C37.3585 74.1201 38.4102 74.1201 39.3575 73.8384C40.3886 73.5317 41.3319 72.9846 42.1098 72.2421C42.8244 71.56 43.3461 70.6476 44.3891 68.8225L59.9064 41.6768C60.9345 39.8782 61.4487 38.9787 61.6742 38.0301C61.9197 36.9977 61.9192 35.9221 61.6729 34.8897C61.4464 33.9414 60.9316 33.0425 59.902 31.2449L59.902 31.2448L59.9019 31.2447L53.917 20.7955C52.5012 18.3232 51.7932 17.087 50.894 16.6279C49.9226 16.1317 48.7715 16.1325 47.8008 16.6301C46.9023 17.0906 46.1961 18.3278 44.7838 20.8021L18.8347 66.262L18.8341 66.263C17.4423 68.7013 16.7464 69.9204 16.8027 70.9204C16.8636 72.0009 17.4372 72.9877 18.3466 73.5758C19.1881 74.1201 20.5932 74.1201 23.4033 74.1201ZM63.7978 74.1195H77.5387C80.3785 74.1195 81.7984 74.1195 82.6426 73.5698C83.5552 72.9759 84.1268 71.9805 84.1797 70.8938C84.2286 69.8883 83.5124 68.6633 82.0798 66.2136L75.1981 54.446L75.1976 54.4452C73.7855 52.0303 73.0793 50.8227 72.1866 50.3714C71.2218 49.8837 70.0819 49.8844 69.1178 50.3737C68.2259 50.8264 67.5212 52.0351 66.1122 54.4523L59.253 66.2201C57.8259 68.6683 57.1124 69.8926 57.1624 70.8975C57.2162 71.9832 57.7883 72.9775 58.7004 73.5705C59.5444 74.1195 60.9623 74.1195 63.7978 74.1195Z"
        fill={lgColor}
      />
    </Svg>
  )
}

export default AvaLogoSVG

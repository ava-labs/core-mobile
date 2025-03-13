import React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  selected?: boolean
  size?: number
  color?: string
  testID?: string
}

function BridgeSVG({ testID, selected, color, size = 30 }: Prop): JSX.Element {
  const context = useApplicationContext()

  const svgColor = color
    ? color
    : selected
    ? context.theme.alternateBackground
    : context.theme.colorIcon4
  return (
    <Svg
      testID={testID}
      width={size}
      height={size}
      viewBox="0 0 30 31"
      fill="none">
      <Circle
        cx="15"
        cy="14.9999"
        r="13.8066"
        stroke={svgColor}
        strokeWidth="2.38674"
      />
      <Circle
        cx="15.0001"
        cy="18.7649"
        r="10.3066"
        stroke={svgColor}
        strokeWidth="2.38674"
      />
      <Path
        d="M21.8067 21.5183C21.8067 25.2828 18.7582 28.3326 15.0001 28.3326C11.2419 28.3326 8.19343 25.2828 8.19343 21.5183C8.19343 17.7539 11.2419 14.7041 15.0001 14.7041C18.7582 14.7041 21.8067 17.7539 21.8067 21.5183Z"
        stroke={svgColor}
        strokeWidth="2.38674"
      />
      <Circle
        cx="15.0001"
        cy="24.1494"
        r="3.80663"
        stroke={svgColor}
        strokeWidth="2.38674"
      />
    </Svg>
  )
}

export default BridgeSVG

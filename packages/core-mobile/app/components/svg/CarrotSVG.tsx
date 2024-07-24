import React from 'react'
import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  size?: number
  direction?: 'up' | 'down' | 'left' //default is `right`
  testID?: string
}

function CarrotSVG({ color, size = 14, direction }: Prop) {
  const { theme } = useApplicationContext()

  const stroke = color || theme.colorIcon1

  function getDegrees() {
    let degrees = 0
    switch (direction) {
      case 'up':
        degrees = -90
        break
      case 'down':
        degrees = 90
        break
      case 'left':
        degrees = 180
        break
    }

    return degrees
  }

  /**
   * If user defines a direction, we wrap it in a view and apply the transfor in int since the
   * transform rotation/rotate in the SVG itself behaves differently and not the desired way we want.
   */
  return direction ? (
    <Carrot
      size={size}
      stroke={stroke}
      rotation={getDegrees()}
      testID="back_btn"
    />
  ) : (
    <Carrot size={size} stroke={stroke} testID="carrot_svg" />
  )
}

const Carrot = ({
  size,
  stroke,
  rotation = 0,
  testID
}: {
  size: number
  stroke: string
  rotation?: number
  testID?: string
}) => (
  <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      origin={8}
      testID={testID}>
      <Path
        d="M5 3L10.25 8.25L5 13.5"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
)

export default CarrotSVG

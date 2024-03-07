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
    <Carrot size={size} stroke={stroke} rotation={getDegrees()} />
  ) : (
    <Carrot size={size} stroke={stroke} />
  )
}

const Carrot = ({
  size,
  stroke,
  rotation = 0
}: {
  size: number
  stroke: string
  rotation?: number
}) => (
  <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      origin={8}
      testID="carrot_svg">
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

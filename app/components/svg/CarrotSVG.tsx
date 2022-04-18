import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { View } from 'react-native'

interface Prop {
  color?: string
  size?: number
  direction?: 'up' | 'down' | 'left' //default is `right`
}

function CarrotSVG({ color, size = 16, direction }: Prop) {
  const { theme } = useApplicationContext()

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

    return `${degrees}deg`
  }

  const Carrot = () => (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M5 3L10.25 8.25L5 13.5"
        stroke={color || theme.colorIcon1}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )

  /**
   * If user defines a direction, we wrap it in a view and apply the transfor in int since the
   * transform rotation/rotate in the SVG itself behaves differently and not the desired way we want.
   */
  return direction ? (
    <View style={{ transform: [{ rotate: getDegrees() }] }}>
      <Carrot />
    </View>
  ) : (
    <Carrot />
  )
}

export default CarrotSVG

import React from 'react'
import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

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

    return degrees
  }

  const Carrot = ({ rotation = 0 }: { rotation?: number }) => (
    <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        origin={8}>
        <Path
          d="M5 3L10.25 8.25L5 13.5"
          stroke={color || theme.colorIcon1}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  )

  /**
   * If user defines a direction, we wrap it in a view and apply the transfor in int since the
   * transform rotation/rotate in the SVG itself behaves differently and not the desired way we want.
   */
  return direction ? <Carrot rotation={getDegrees()} /> : <Carrot />
}

export default CarrotSVG

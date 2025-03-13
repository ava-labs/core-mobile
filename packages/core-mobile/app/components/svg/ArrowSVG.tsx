import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { View } from 'react-native'

interface Prop {
  color?: string
  size?: number
  rotate?: number
  testID?: string
}

const Arrow = ({
  size,
  color
}: {
  size: number
  color: string
}): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
    <Path
      d="M10 14c0-.56-.45-1-1-1H3.41L14.3 2.11A.996.996 0 1 0 12.89.7L2 11.59V6c0-.55-.45-1-1-1s-1 .45-1 1v8c0 .55.45 1 1 1h8c.55 0 1-.45 1-1Z"
      fill={color}
    />
  </Svg>
)

function ArrowSVG({
  testID = 'arrow_svg',
  color = '#FFF',
  size = 15,
  rotate = 0
}: Prop): JSX.Element {
  const context = useApplicationContext()

  const iconColor = color ?? context.theme.colorIcon1

  return (
    <View
      testID={testID}
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: `${rotate}deg` }]
      }}>
      <Arrow size={size} color={iconColor} />
    </View>
  )
}

export default ArrowSVG

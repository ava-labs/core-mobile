import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  size?: number
}

function DarkModeSVG({ color, size = 24 }: Prop) {
  const theme = useApplicationContext().theme
  const iconColor = color ?? theme.alternateBackground
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.0543 18.0368C13.1189 18.0368 18.0346 13.1203 18.0346 7.05577C18.0346 4.99005 17.4624 3.05965 16.47 1.41013C16.2114 0.980421 16.6201 0.426967 17.0712 0.646138C21.1716 2.63858 23.9992 6.84024 23.9992 11.7056C23.9992 18.4963 18.4949 24.0007 11.7041 24.0007C6.83905 24.0007 2.63759 21.1734 0.645008 17.0733C0.425782 16.6222 0.979397 16.2135 1.40914 16.4721C3.05876 17.4648 4.98934 18.0368 7.0543 18.0368Z"
        fill={iconColor}
      />
      <Path
        d="M19.3034 2.05444C20.9479 4.14384 21.9361 6.77422 21.9361 9.64051C21.9361 16.4312 16.4317 21.9356 9.641 21.9356C6.77471 21.9356 4.14433 20.9474 2.05493 19.3029C4.30493 22.1592 7.78675 23.9996 11.705 23.9996C18.4958 23.9996 24.0001 18.4953 24.0001 11.7045C24.0001 7.78626 22.1597 4.30521 19.3034 2.05444Z"
        fill={iconColor}
      />
    </Svg>
  )
}

export default DarkModeSVG

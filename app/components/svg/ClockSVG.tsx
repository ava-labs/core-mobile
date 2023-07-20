import { useApplicationContext } from 'contexts/ApplicationContext'
import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

const ClockSVG = () => {
  const { theme } = useApplicationContext()

  return (
    <Svg width={61} height={56} viewBox="0 0 61 56" fill="none">
      <Path
        d="M34.712 1.005c-15.27-.42-27.78 11.85-27.78 27h-5.37c-1.35 0-2.01 1.62-1.05 2.55l8.37 8.4c.6.6 1.53.6 2.13 0l8.37-8.4c.93-.93.27-2.55-1.08-2.55h-5.37c0-11.7 9.54-21.15 21.3-21 11.16.15 20.55 9.54 20.7 20.7.15 11.73-9.3 21.3-21 21.3-4.83 0-9.3-1.65-12.84-4.44-1.2-.93-2.88-.84-3.96.24-1.26 1.26-1.17 3.39.24 4.47 4.56 3.6 10.29 5.73 16.56 5.73 15.15 0 27.42-12.51 27-27.78-.39-14.07-12.15-25.83-26.22-26.22zm-1.53 15c-1.23 0-2.25 1.02-2.25 2.25v11.04c0 1.05.57 2.04 1.47 2.58l9.36 5.55c1.08.63 2.46.27 3.09-.78.63-1.08.27-2.46-.78-3.09l-8.64-5.13v-10.2c0-1.2-1.02-2.22-2.25-2.22z"
        fill={theme.colorIcon1}
      />
    </Svg>
  )
}

export default ClockSVG

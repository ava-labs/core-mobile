import { useApplicationContext } from 'contexts/ApplicationContext'
import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

const PersonSVG = () => {
  const { theme } = useApplicationContext()

  return (
    <Svg width={48} height={48} fill="none">
      <Path
        d="M24 5.7a6.3 6.3 0 0 1 6.3 6.3 6.3 6.3 0 0 1-6.3 6.3 6.3 6.3 0 0 1-6.3-6.3A6.3 6.3 0 0 1 24 5.7Zm0 27c8.91 0 18.3 4.38 18.3 6.3v3.3H5.7V39c0-1.92 9.39-6.3 18.3-6.3ZM24 0c-6.63 0-12 5.37-12 12s5.37 12 12 12 12-5.37 12-12S30.63 0 24 0Zm0 27c-8.01 0-24 4.02-24 12v6c0 1.65 1.35 3 3 3h42c1.65 0 3-1.35 3-3v-6c0-7.98-15.99-12-24-12Z"
        fill={theme.colorIcon1}
      />
    </Svg>
  )
}
export default PersonSVG

import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
}

function ReloadSVG({ color }: Prop) {
  const context = useApplicationContext()

  const iconColor = color ?? context.theme.colorIcon1
  return (
    <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <Path
        d="M9.76122 2.23426C8.67455 1.1476 7.13455 0.520931 5.44122 0.694264C2.99455 0.940931 0.981221 2.9276 0.707887 5.37426C0.341221 8.6076 2.84122 11.3343 5.99455 11.3343C8.12122 11.3343 9.94789 10.0876 10.8012 8.29426C11.0146 7.8476 10.6946 7.33426 10.2012 7.33426C9.95455 7.33426 9.72122 7.4676 9.61455 7.6876C8.86122 9.3076 7.05455 10.3343 5.08122 9.89426C3.60122 9.5676 2.40789 8.36093 2.09455 6.88093C1.53455 4.29426 3.50122 2.00093 5.99455 2.00093C7.10122 2.00093 8.08789 2.46093 8.80789 3.1876L7.80122 4.19426C7.38122 4.61426 7.67455 5.33426 8.26789 5.33426H10.6612C11.0279 5.33426 11.3279 5.03426 11.3279 4.6676V2.27426C11.3279 1.68093 10.6079 1.38093 10.1879 1.80093L9.76122 2.23426Z"
        fill={iconColor}
      />
    </Svg>
  )
}

export default ReloadSVG

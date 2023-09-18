import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  testID?: string
}

function MoneySVG({ color }: Prop) {
  const context = useApplicationContext()

  const iconColor = color ?? context.theme.colorIcon1
  return (
    <Svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      testID="money_svg">
      <Path
        d="M12.3 11.4C10.03 10.81 9.3 10.2 9.3 9.25C9.3 8.16 10.31 7.4 12 7.4C13.42 7.4 14.13 7.94 14.39 8.8C14.51 9.2 14.84 9.5 15.26 9.5H15.56C16.22 9.5 16.69 8.85 16.46 8.23C16.04 7.05 15.06 6.07 13.5 5.69V5C13.5 4.17 12.83 3.5 12 3.5C11.17 3.5 10.5 4.17 10.5 5V5.66C8.56 6.08 7 7.34 7 9.27C7 11.58 8.91 12.73 11.7 13.4C14.2 14 14.7 14.88 14.7 15.81C14.7 16.5 14.21 17.6 12 17.6C10.35 17.6 9.5 17.01 9.17 16.17C9.02 15.78 8.68 15.5 8.27 15.5H7.99C7.32 15.5 6.85 16.18 7.1 16.8C7.67 18.19 9 19.01 10.5 19.33V20C10.5 20.83 11.17 21.5 12 21.5C12.83 21.5 13.5 20.83 13.5 20V19.35C15.45 18.98 17 17.85 17 15.8C17 12.96 14.57 11.99 12.3 11.4Z"
        fill={iconColor}
      />
    </Svg>
  )
}

export default MoneySVG

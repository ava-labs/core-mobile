import React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  circleColor?: string
  size?: number
  hideBorder?: boolean
}

function SearchSVG({
  color,
  circleColor,
  size = 44,
  hideBorder
}: Prop): JSX.Element {
  const context = useApplicationContext()

  const iconColor = color ?? context.theme.colorText2
  const borderColor = circleColor ?? context.theme.colorStroke

  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Path
        d="M15.9766 14.4713H15.1866L14.9066 14.2013C16.1066 12.8013 16.7266 10.8913 16.3866 8.86133C15.9166 6.08133 13.5966 3.86133 10.7966 3.52133C6.56658 3.00133 3.00658 6.56133 3.52658 10.7913C3.86658 13.5913 6.08658 15.9113 8.86658 16.3813C10.8966 16.7213 12.8066 16.1013 14.2066 14.9013L14.4766 15.1813V15.9713L18.7266 20.2213C19.1366 20.6313 19.8066 20.6313 20.2166 20.2213C20.6266 19.8113 20.6266 19.1413 20.2166 18.7313L15.9766 14.4713ZM9.97658 14.4713C7.48658 14.4713 5.47658 12.4613 5.47658 9.97133C5.47658 7.48133 7.48658 5.47133 9.97658 5.47133C12.4666 5.47133 14.4766 7.48133 14.4766 9.97133C14.4766 12.4613 12.4666 14.4713 9.97658 14.4713Z"
        fill={iconColor}
      />
      {hideBorder || <Circle cx="22" cy="22" r="21.5" stroke={borderColor} />}
    </Svg>
  )
}

export default SearchSVG

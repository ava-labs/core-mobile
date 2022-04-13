import React from 'react'
import Svg, { Path } from 'react-native-svg'

interface Props {
  size?: number
  color: string
}

function ClearInputSVG({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <Path
        fill={color}
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14ZM3.81802 9.47485L6.29288 6.99999L3.81802 4.52514L4.52513 3.81803L6.99998 6.29289L9.47488 3.81799L10.182 4.5251L7.70709 6.99999L10.182 9.47489L9.47488 10.182L6.99998 7.7071L4.52513 10.182L3.81802 9.47485Z"
      />
    </Svg>
  )
}

export default ClearInputSVG

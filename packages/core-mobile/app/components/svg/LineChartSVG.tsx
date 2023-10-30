import React from 'react'
import Svg, { Path } from 'react-native-svg'

interface Prop {
  color?: string
  size?: number
}

function ListChartSVG({ color, size = 24 }: Prop) {
  const iconColor = color ?? '#B4B4B7'
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.334 5.33405L16.2414 14.855C16.0931 15.1324 15.7191 15.1878 15.4966 14.9654L12.3345 11.8033C12.1351 11.6039 11.8062 11.6244 11.633 11.8469L7.35276 17.3502C7.18337 17.5679 6.86344 17.5931 6.66216 17.4043L3.28717 14.2403"
        stroke={iconColor}
        stroke-width="2"
        strokeLinecap={'round'}
      />
    </Svg>
  )
}

export default ListChartSVG

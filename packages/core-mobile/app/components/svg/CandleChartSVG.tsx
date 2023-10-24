import React from 'react'
import Svg, { Path, Rect } from 'react-native-svg'

interface Prop {
  color?: string
  size?: number
}

function CandleChartSVG({ color, size = 24 }: Prop) {
  const iconColor = color ?? '#6C6C6E'
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 5C6 4.44772 5.55228 4 5 4C4.44772 4 4 4.44772 4 5H6ZM4 19C4 19.5523 4.44772 20 5 20C5.55228 20 6 19.5523 6 19H4ZM4 5L4 19H6L6 5H4Z"
        fill={iconColor}
      />
      <Rect
        x="3"
        y="7"
        width="4"
        height="6"
        rx="1.5"
        fill={iconColor}
        stroke={iconColor}
        strokeWidth="1"
      />
      <Path
        d="M13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5H13ZM11 19C11 19.5523 11.4477 20 12 20C12.5523 20 13 19.5523 13 19H11ZM11 5V19H13V5H11Z"
        fill={iconColor}
      />
      <Rect
        x="10"
        y="9"
        width="4"
        height="9"
        rx="1.5"
        fill={iconColor}
        stroke={iconColor}
        strokeWidth="1"
      />
      <Path
        d="M11 11.5C11 11.2239 11.2239 11 11.5 11H12.5C12.7761 11 13 11.2239 13 11.5V15.5C13 15.7761 12.7761 16 12.5 16H11.5C11.2239 16 11 15.7761 11 15.5V11.5Z"
        fill={iconColor}
      />
      <Path
        d="M11.5 13H12.5V9H11.5V13ZM11 11.5V15.5H15V11.5H11ZM12.5 14H11.5V18H12.5V14ZM13 15.5V11.5H9V15.5H13ZM11.5 14C12.3284 14 13 14.6716 13 15.5H9C9 16.8807 10.1193 18 11.5 18V14ZM11 15.5C11 14.6716 11.6716 14 12.5 14V18C13.8807 18 15 16.8807 15 15.5H11ZM12.5 13C11.6716 13 11 12.3284 11 11.5H15C15 10.1193 13.8807 9 12.5 9V13ZM11.5 9C10.1193 9 9 10.1193 9 11.5H13C13 12.3284 12.3284 13 11.5 13V9Z"
        fill={iconColor}
        mask="url(#path-4-outside-1_5588_54451)"
      />
      <Path
        d="M20 4C20 3.44772 19.5523 3 19 3C18.4477 3 18 3.44772 18 4H20ZM18 19C18 19.5523 18.4477 20 19 20C19.5523 20 20 19.5523 20 19H18ZM18 4V19H20V4H18Z"
        fill={iconColor}
      />
      <Rect
        x="17"
        y="6"
        width="4"
        height="10"
        rx="1.5"
        fill={iconColor}
        stroke={iconColor}
        strokeWidth="1"
      />
    </Svg>
  )
}

export default CandleChartSVG

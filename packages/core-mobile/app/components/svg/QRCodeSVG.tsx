import React from 'react'
import Svg, { Path, Rect, Mask } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Prop {
  color?: string
  size?: number
  testID?: string
}

export default function QRCodeSVG({
  color,
  testID,
  size = 24
}: Prop): JSX.Element {
  const context = useApplicationContext()

  const iconColor = color ?? context.theme.alternateBackground
  return (
    <Svg
      testID={testID}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none">
      <Path
        d="M15 20C14.4477 20 14 20.4477 14 21C14 21.5523 14.4477 22 15 22H20C21.1046 22 22 21.1046 22 20V15C22 14.4477 21.5523 14 21 14C20.4477 14 20 14.4477 20 15V19.3571C20 19.7122 19.7122 20 19.3571 20H15Z"
        fill={iconColor}
      />
      <Path
        d="M4 15C4 14.4477 3.55228 14 3 14C2.44772 14 2 14.4477 2 15V20C2 21.1046 2.89543 22 4 22H9C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20H4.64286C4.28782 20 4 19.7122 4 19.3571V15Z"
        fill={iconColor}
      />
      <Path
        d="M15 4C14.4477 4 14 3.55228 14 3C14 2.44772 14.4477 2 15 2H20C21.1046 2 22 2.89543 22 4V9C22 9.55228 21.5523 10 21 10C20.4477 10 20 9.55228 20 9V4.64286C20 4.28782 19.7122 4 19.3571 4H15Z"
        fill={iconColor}
      />
      <Path
        d="M9 4C9.55228 4 10 3.55228 10 3C10 2.44772 9.55228 2 9 2H4C2.89543 2 2 2.89543 2 4V9C2 9.55228 2.44772 10 3 10C3.55228 10 4 9.55228 4 9V4.64286C4 4.28782 4.28782 4 4.64286 4H9Z"
        fill={iconColor}
      />
      <Mask id="path-6-inside-1_5088_89422" fill="white">
        <Rect x="6" y="6" width="5" height="5" rx="1" />
      </Mask>
      <Rect
        x="6"
        y="6"
        width="5"
        height="5"
        rx="1"
        stroke={iconColor}
        strokeWidth="3.5"
        strokeLinejoin="bevel"
        mask="url(#path-6-inside-1_5088_89422)"
      />
      <Mask id="path-7-inside-2_5088_89422" fill="white">
        <Rect x="13" y="6" width="5" height="5" rx="1" />
      </Mask>
      <Rect
        x="13"
        y="6"
        width="5"
        height="5"
        rx="1"
        stroke={iconColor}
        strokeWidth="3.5"
        strokeLinejoin="bevel"
        mask="url(#path-7-inside-2_5088_89422)"
      />
      <Mask id="path-8-inside-3_5088_89422" fill="white">
        <Rect x="13" y="13" width="5" height="5" rx="1" />
      </Mask>
      <Rect
        x="13"
        y="13"
        width="5"
        height="5"
        rx="1"
        stroke={iconColor}
        strokeWidth="3.5"
        strokeLinejoin="bevel"
        mask="url(#path-8-inside-3_5088_89422)"
      />
      <Mask id="path-9-inside-4_5088_89422" fill="white">
        <Rect x="6" y="13" width="5" height="5" rx="1" />
      </Mask>
      <Rect
        x="6"
        y="13"
        width="5"
        height="5"
        rx="1"
        stroke={iconColor}
        strokeWidth="3.5"
        strokeLinejoin="bevel"
        mask="url(#path-9-inside-4_5088_89422)"
      />
    </Svg>
  )
}

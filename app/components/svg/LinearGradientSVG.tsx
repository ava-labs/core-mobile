import React from 'react'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'

interface Prop {
  colorFrom: string
  colorTo: string
  loop?: boolean
  orientation?: 'horizontal' | 'vertical'
  opacityFrom?: number
  opacityTo?: number
  borderRadius?: number
  overflow?: 'hidden' | 'visible'
}

function LinearGradientSVG({
  colorFrom,
  colorTo,
  orientation = 'vertical',
  loop = false,
  opacityFrom = 1,
  opacityTo = 1,
  overflow = 'hidden',
  borderRadius = 0
}: Prop): JSX.Element {
  const endPoint =
    orientation === 'horizontal' ? { x: 1, y: 0 } : { x: 0, y: 1 }
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      preserveAspectRatio={'none'}
      style={{ borderRadius: borderRadius, overflow: overflow }}>
      <Defs>
        {loop ? (
          <LinearGradient
            id="grad"
            x1="0"
            y1="0"
            x2={endPoint.x}
            y2={endPoint.y}>
            <Stop offset="0" stopColor={colorFrom} stopOpacity={opacityFrom} />
            <Stop offset="0.5" stopColor={colorTo} stopOpacity={opacityTo} />
            <Stop offset="1" stopColor={colorFrom} stopOpacity={opacityFrom} />
          </LinearGradient>
        ) : (
          <LinearGradient
            id="grad"
            x1="0"
            y1="0"
            x2={endPoint.x}
            y2={endPoint.y}>
            <Stop offset="0" stopColor={colorFrom} stopOpacity={opacityFrom} />
            <Stop offset="1" stopColor={colorTo} stopOpacity={opacityTo} />
          </LinearGradient>
        )}
      </Defs>

      <Rect x="0" y="0" width="24" height="24" fill="url(#grad)" />
    </Svg>
  )
}

export default LinearGradientSVG

import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { useTheme } from '@avalabs/k2-mobile'

type Props = {
  negative?: boolean
  color?: string
}

export default function MarketTriangleSVG({
  negative,
  color
}: Props): JSX.Element {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <Svg
      width="8"
      height="7"
      viewBox="0 0 8 7"
      fill="none"
      style={negative && { transform: [{ rotateX: '180deg' }] }}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.63378 7H6.36204C7.05959 7 7.41042 7 7.61929 6.86405C7.84482 6.7198 7.98683 6.47667 7.99939 6.21295C8.01148 5.97786 7.84392 5.69262 7.51559 5.13377C7.50439 5.11469 7.49299 5.09535 7.48143 5.07565L5.11314 1.0786L5.08618 1.03364C4.75338 0.478366 4.5853 0.198007 4.36965 0.0896377C4.13156 -0.0298792 3.85174 -0.0298792 3.61365 0.0896377C3.39643 0.200859 3.22099 0.493455 2.87431 1.08269L0.514388 5.07974L0.506294 5.09354C0.160827 5.68184 -0.0118272 5.97584 0.000629122 6.2171C0.0173427 6.48081 0.155151 6.72394 0.380732 6.86814C0.585394 7 0.936221 7 1.63378 7Z"
        fill={color ?? (negative ? colors.$dangerLight : colors.$successMain)}
      />
    </Svg>
  )
}

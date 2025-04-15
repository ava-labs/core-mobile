import React, { ReactNode } from 'react'
import Svg, {
  Circle,
  G,
  Text as SvgText,
  TextPath,
  TSpan
} from 'react-native-svg'

interface Props {
  text: string
  textColor?: string
  circleBackgroundColor?: string
  size: number
}

export const CircularText = ({
  text,
  textColor = '#000000',
  circleBackgroundColor = '#FFFFFF',
  size
}: Props): ReactNode => {
  return (
    <Svg height={size} width={size} viewBox="0 0 300 300">
      <G id="circle">
        <Circle
          r={75}
          x={150}
          y={150}
          fill="none"
          stroke={circleBackgroundColor}
          strokeWidth={44}
          transform="rotate(-145)"
        />
      </G>
      <SvgText fill={textColor} fontSize="14">
        <TextPath href="#circle">
          <TSpan dx="0" dy={5}>
            {` ${text.trim()} `.repeat(10)}
          </TSpan>
        </TextPath>
      </SvgText>
    </Svg>
  )
}

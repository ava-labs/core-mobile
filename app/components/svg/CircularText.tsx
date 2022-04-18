import React from 'react'
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
}

function CircularText({
  text,
  textColor = 'white',
  circleBackgroundColor = '#3A3A3C'
}: Props) {
  return (
    <Svg height="100" width="100" viewBox="0 0 300 300">
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
            {`${text.trim()} `.repeat(10)}
          </TSpan>
        </TextPath>
      </SvgText>
    </Svg>
  )
}

export default CircularText

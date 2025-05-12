import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useSharedValue
} from 'react-native-reanimated'
import Svg, {
  Circle,
  G,
  Text as SvgText,
  TextPath,
  TSpan
} from 'react-native-svg'
import { Text, View } from 'react-native'

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
  const rotation = useSharedValue(0)
  const [textWidth, setTextWidth] = useState(0)
  const textRef = useRef<Text>(null)

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 15000,
        easing: Easing.linear
      }),
      -1
    )
  }, [rotation])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${rotation.value}deg`
        }
      ]
    }
  })

  // Number of text elements and dots
  const repetitions = useMemo(() => {
    if (text.length > 20) return 2
    if (text.length > 15) return 3
    if (text.length > 12) return 4
    if (text.length > 8) return 5
    return 6
  }, [text])

  // Calculate the circumference of the circle in pixels
  const radius = 75 // This should match the r attribute in the Circle element
  const circumference = 2 * Math.PI * radius

  // Calculate positions for text and dots based on text width
  const textPositions = Array.from({ length: repetitions }, (_, i) => {
    // Calculate the starting position for each text
    const startPos = (i * circumference) / repetitions
    // Convert to percentage of the circle
    return `${(startPos / circumference) * 100}%`
  })

  // Calculate positions for dots based on text width
  const dotPositions = Array.from({ length: repetitions }, (_, i) => {
    // Calculate the position between two texts
    const startPos = (i * circumference) / repetitions
    const endPos = ((i + 1) * circumference) / repetitions
    // Add half of the text width to center the dot between texts
    // Apply a small correction of 4px to fix the offset
    const centerPos = (startPos + endPos) / 2 + textWidth / 2 - 3.5
    // Convert to percentage of the circle
    return `${(centerPos / circumference) * 100}%`
  })

  return (
    <Animated.View style={animatedStyle}>
      <View style={{ position: 'absolute', opacity: 0, left: -9999 }}>
        <Text
          ref={textRef}
          onLayout={({ nativeEvent }) => {
            setTextWidth(nativeEvent.layout.width)
          }}
          style={{
            fontFamily: 'Inter-Regular',
            fontSize: 13.6,
            color: textColor
          }}>
          {text.trim()}
        </Text>
      </View>

      <Svg height={size} width={size} viewBox={`0 0 300 300`}>
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

        {textPositions.map((position, index) => (
          <SvgText key={`text-${index}`} fill={textColor} fontSize="14">
            <TextPath href="#circle" startOffset={position}>
              <TSpan dx="0" dy={6} fontFamily="Inter-Regular" fontSize={13.6}>
                {text.trim()}
              </TSpan>
            </TextPath>
          </SvgText>
        ))}

        {dotPositions.map((position, index) => (
          <SvgText key={`dot-${index}`} fill={textColor} fontSize="14">
            <TextPath href="#circle" startOffset={position}>
              <TSpan dx="0" dy={6} fontFamily="Inter-Regular" fontSize={13.6}>
                •
              </TSpan>
            </TextPath>
          </SvgText>
        ))}
      </Svg>
    </Animated.View>
  )
}

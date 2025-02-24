import React, { useEffect, useState } from 'react'
import Animated, {
  Easing,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { View } from '../Primitives'

export const PriceChange = ({ formattedPrice }: { formattedPrice: string }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end'
      }}>
      {formattedPrice
        .toString()
        .split('')
        .map((character, index) => {
          return (
            <AnimatedCharacter
              key={`${character}-${index}`}
              character={character}
              delay={index * 30}
            />
          )
        })}
    </View>
  )
}

const AnimatedCharacter = ({
  character,
  delay
}: {
  character: string
  delay: number
}) => {
  const [animatedValue, setAnimatedValue] = useState(character)
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)

  useEffect(() => {
    animateCharacter()
  }, [character])

  const animateCharacter = () => {
    'worklet'
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: 500,
        easing: Easing.bezier(0.25, 1, 0.5, 1)
      })
    )
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 10, stiffness: 200, mass: 0.5 }, () => {
        runOnJS(setAnimatedValue)(character)
      })
    )
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }]
    }
  })

  return (
    <Animated.Text
      exiting={FadeOut}
      style={[
        animatedStyle,
        {
          fontSize: 36,
          lineHeight: 36,
          fontFamily: 'Aeonik-Bold'
        }
      ]}>
      {animatedValue}
    </Animated.Text>
  )
}

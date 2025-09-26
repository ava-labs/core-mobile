import React, { useEffect, useRef } from 'react'
import { Animated, Easing, ViewStyle } from 'react-native'

export const AnimatedFadeInUp = ({
  children,
  style,
  delay = 0
}: {
  children: React.ReactNode
  style?: ViewStyle
  delay?: number
}): JSX.Element => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateYAnim = useRef(new Animated.Value(-100)).current

  useEffect(() => {
    // Create the entering animation equivalent to FadeInUp
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
        useNativeDriver: true
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        delay,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
        useNativeDriver: true
      })
    ]).start()
  }, [delay, fadeAnim, translateYAnim])

  return (
    <Animated.View
      style={{
        ...style,
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: translateYAnim }]
      }}>
      {children}
    </Animated.View>
  )
}

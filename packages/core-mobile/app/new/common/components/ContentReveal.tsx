import { View } from '@avalabs/k2-alpine'
import React, { useEffect, useRef, useState } from 'react'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'

export const ContentReveal = ({
  children,
  isVisible
}: {
  children: React.ReactNode
  isVisible: boolean
}): JSX.Element => {
  const contentRef = useRef<Animated.View>(null)
  const [contentHeight, setContentHeight] = useState(0)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(isVisible ? contentHeight : 0, { duration: 250 }),
      opacity: withTiming(isVisible ? 1 : 0)
    }
  })

  useEffect(() => {
    if (isVisible) {
      contentRef.current?.measure((x, y, width, height) => {
        setContentHeight(height)
      })
    }
  }, [isVisible])

  return (
    <Animated.View style={animatedStyle}>
      <View
        ref={contentRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0
        }}>
        {children}
      </View>
    </Animated.View>
  )
}

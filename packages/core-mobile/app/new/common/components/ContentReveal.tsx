import { View } from '@avalabs/k2-alpine'
import React, { useState } from 'react'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'

export const ContentReveal = ({
  children,
  isVisible
}: {
  children: React.ReactNode
  isVisible: boolean
}): JSX.Element => {
  const [contentHeight, setContentHeight] = useState(0)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(isVisible ? contentHeight : 0, { duration: 250 }),
      opacity: withTiming(isVisible ? 1 : 0)
    }
  })

  return (
    // `overflow: 'hidden'` clips the absolutely-positioned child to the animated
    // height. Without it, when the height is 0 (collapsed, or before the child
    // is measured) the child still renders and bleeds out behind sibling
    // content — on the New Architecture (Fabric) Android this left the revealed
    // content (e.g. the balance-error banner) showing underneath the list.
    <Animated.View style={[animatedStyle, { overflow: 'hidden' }]}>
      {/* Measure via onLayout, not the legacy `ref.measure()` callback, which
          is unreliable on Fabric (returns 0 on Android) — leaving the reveal
          stuck at height 0. onLayout fires with the child's natural height on
          both platforms and re-fires when the content changes. */}
      <View
        onLayout={event => setContentHeight(event.nativeEvent.layout.height)}
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

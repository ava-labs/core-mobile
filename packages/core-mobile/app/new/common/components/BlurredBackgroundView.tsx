import React from 'react'
import { Separator, View } from '@avalabs/k2-alpine'
import Animated, {
  SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'
import { BlurViewWithFallback } from './BlurViewWithFallback'

const BlurredBackgroundView = ({
  separator
}: {
  separator?: {
    opacity: SharedValue<number>
    position: 'top' | 'bottom'
  }
}): JSX.Element => {
  const animatedBorderStyle = useAnimatedStyle(() => ({
    opacity: separator?.opacity.value
  }))

  return (
    <View style={{ flex: 1 }}>
      {separator?.position === 'top' && (
        <Animated.View style={animatedBorderStyle}>
          <Separator />
        </Animated.View>
      )}
      <BlurViewWithFallback
        style={{
          flex: 1
        }}
      />
      {separator?.position === 'bottom' && (
        <Animated.View style={animatedBorderStyle}>
          <Separator />
        </Animated.View>
      )}
    </View>
  )
}

export default BlurredBackgroundView

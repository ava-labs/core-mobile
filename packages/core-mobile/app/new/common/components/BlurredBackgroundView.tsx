import React from 'react'
import { Separator, View } from '@avalabs/k2-alpine'
import Animated, {
  SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'
import { BlurViewWithFallback } from './BlurViewWithFallback'
import Grabber from './Grabber'

const BlurredBackgroundView = ({
  hasGrabber = false,
  separator,
  backgroundColor
}: {
  hasGrabber?: boolean
  separator?: {
    opacity: SharedValue<number>
    position: 'top' | 'bottom'
  }
  backgroundColor?: string
}): JSX.Element => {
  const animatedBorderStyle = useAnimatedStyle(() => ({
    opacity: separator?.opacity.value
  }))

  return (
    <View
      style={{
        flex: 1,
        backgroundColor
      }}>
      {separator?.position === 'top' && (
        <Animated.View style={animatedBorderStyle}>
          <Separator />
        </Animated.View>
      )}
      {hasGrabber === false && (
        <BlurViewWithFallback
          style={{
            flex: 1
          }}
        />
      )}
      {hasGrabber === true && <Grabber />}
      {separator?.position === 'bottom' && (
        <Animated.View style={animatedBorderStyle}>
          <Separator />
        </Animated.View>
      )}
    </View>
  )
}

export default BlurredBackgroundView

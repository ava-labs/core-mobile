import { Separator, View } from '@avalabs/k2-alpine'
import React from 'react'
import Animated, {
  SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'
import { BlurViewWithFallback } from './BlurViewWithFallback'
import Grabber from './Grabber'

const BlurredBackgroundView = ({
  hasGrabber = false,
  separator,
  shouldDelayBlurOniOS = false
}: {
  hasGrabber?: boolean
  separator?: {
    opacity: SharedValue<number>
    position: 'top' | 'bottom'
  }
  shouldDelayBlurOniOS?: boolean
}): JSX.Element => {
  const animatedBorderStyle = useAnimatedStyle(() => ({
    opacity: separator?.opacity.value
  }))

  return (
    <View
      pointerEvents={hasGrabber ? 'auto' : 'none'}
      style={{
        flex: 1
      }}>
      {separator?.position === 'top' && (
        <Animated.View style={animatedBorderStyle}>
          <Separator />
        </Animated.View>
      )}
      {hasGrabber === false && (
        <BlurViewWithFallback
          shouldDelayBlurOniOS={shouldDelayBlurOniOS}
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

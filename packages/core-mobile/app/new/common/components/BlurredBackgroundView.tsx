import { BlurViewWithFallback, Separator, View } from '@avalabs/k2-alpine'
import React from 'react'
import { Platform } from 'react-native'
import Animated, {
  SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Grabber from './Grabber'

const BlurredBackgroundView = ({
  hasGrabber = false,
  separator,
  shouldDelayBlurOniOS = false,
  backgroundColor,
  hasAnimation = false
}: {
  hasGrabber?: boolean
  separator?: {
    opacity: SharedValue<number>
    position: 'top' | 'bottom'
  }
  shouldDelayBlurOniOS?: boolean
  backgroundColor?: string
  hasAnimation?: boolean
}): JSX.Element => {
  const animatedBorderStyle = useAnimatedStyle(() => ({
    opacity: separator?.opacity.value
  }))
  const blurViewStyle = useAnimatedStyle(() => ({
    opacity:
      Platform.OS === 'ios' && hasAnimation ? separator?.opacity.value : 1
  }))
  const insets = useSafeAreaInsets()
  return (
    <View
      testID={hasGrabber ? 'grabber' : undefined}
      pointerEvents={hasGrabber ? 'auto' : 'none'}
      style={{
        flex: 1,
        // Android formsheet in native-stack has a default top padding of insets.top
        // so we need to add this to adjust the grabber position
        marginTop: hasGrabber && Platform.OS === 'android' ? insets.top - 8 : 0
      }}>
      {separator?.position === 'top' && (
        <Animated.View style={animatedBorderStyle}>
          <Separator />
        </Animated.View>
      )}
      {hasGrabber === false && (
        <Animated.View style={[blurViewStyle, { flex: 1 }]}>
          <BlurViewWithFallback
            backgroundColor={backgroundColor}
            shouldDelayBlurOniOS={shouldDelayBlurOniOS}
            style={{
              flex: 1
            }}
          />
        </Animated.View>
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

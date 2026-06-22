import { BlurViewWithFallback, Separator, View } from '@avalabs/k2-alpine'
import React from 'react'
import { Platform } from 'react-native'
import Animated, {
  SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'

// DEBUG_HEADER_BG (CP-14426 duplicate-header-bg investigation): tints the
// navigation header background RED so we can tell in a release build whether
// this layer is painting at the same time as ListScreenV2's in-list sticky
// blur. Delete everything tagged DEBUG_HEADER_BG when the investigation ends.
const DEBUG_HEADER_BG_TINT: string | undefined = 'rgba(255,0,0,0.5)'

const BlurredBackgroundView = ({
  separator,
  shouldDelayBlurOniOS = false,
  backgroundColor,
  hasAnimation = false
}: {
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

  return (
    <View
      pointerEvents="none"
      style={{
        flex: 1
      }}>
      {separator?.position === 'top' && (
        <Animated.View style={animatedBorderStyle}>
          <Separator />
        </Animated.View>
      )}
      <Animated.View style={[blurViewStyle, { flex: 1 }]}>
        <BlurViewWithFallback
          backgroundColor={DEBUG_HEADER_BG_TINT ?? backgroundColor}
          shouldDelayBlurOniOS={shouldDelayBlurOniOS}
          style={{
            flex: 1
          }}
        />
      </Animated.View>
      {separator?.position === 'bottom' && (
        <Animated.View style={animatedBorderStyle}>
          <Separator />
        </Animated.View>
      )}
    </View>
  )
}

export default BlurredBackgroundView

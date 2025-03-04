import React from 'react'
import { Separator, useTheme, View } from '@avalabs/k2-alpine'
import Animated, {
  SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'
import { BlurViewWithFallback } from './BlurViewWithFallback'
import Grabber from './Grabber'

const BlurredBackgroundView = ({
  hasGrabber = false,
  separator
}: {
  hasGrabber?: boolean
  separator?: {
    opacity: SharedValue<number>
    position: 'top' | 'bottom'
  }
}): JSX.Element => {
  const {
    theme: { isDark }
  } = useTheme()
  const animatedBorderStyle = useAnimatedStyle(() => ({
    opacity: separator?.opacity.value
  }))

  return (
    <View
      style={{ flex: 1, backgroundColor: isDark ? '#1E1E2499' : '#FFFFFFCC' }}>
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

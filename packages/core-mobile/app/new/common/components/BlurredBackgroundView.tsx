import React from 'react'
import { Separator, useTheme, View } from '@avalabs/k2-alpine'
import Animated, {
  SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { BlurViewWithFallback } from './BlurViewWithFallback'
import Grabber from './Grabber'
import { TestnetBanner } from './TestnetBanner'

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
  const {
    theme: { colors }
  } = useTheme()
  const isDeveloperModeEnabled = useSelector(selectIsDeveloperMode)
  const animatedBorderStyle = useAnimatedStyle(() => ({
    opacity: separator?.opacity.value
  }))

  return (
    <View
      style={{
        flex: 1,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        backgroundColor: backgroundColor ?? colors.$surfacePrimary
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
      {hasGrabber === true && isDeveloperModeEnabled === false && <Grabber />}
      {hasGrabber === true && isDeveloperModeEnabled && <TestnetBanner />}
      {separator?.position === 'bottom' && (
        <Animated.View style={animatedBorderStyle}>
          <Separator />
        </Animated.View>
      )}
    </View>
  )
}

export default BlurredBackgroundView

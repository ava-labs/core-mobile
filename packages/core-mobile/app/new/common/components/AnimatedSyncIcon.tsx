import { Icons, useTheme } from '@avalabs/k2-alpine'
import React, { useEffect } from 'react'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated'

type AnimatedSyncIconProps = {
  size?: number
}

export const AnimatedSyncIcon = ({
  size = 20
}: AnimatedSyncIconProps): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const rotation = useSharedValue(0)

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1
    )

    return () => {
      cancelAnimation(rotation)
    }
  }, [rotation])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }))

  return (
    <Animated.View style={animatedStyle}>
      <Icons.Notification.Sync
        color={colors.$textPrimary}
        width={size}
        height={size}
      />
    </Animated.View>
  )
}

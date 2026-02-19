import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated'
import React, { useEffect } from 'react'
import { SwapActivityItem } from '../types'

const STATUS_ICON_SIZE = 20

export const StatusIcon = ({
  status
}: {
  status: SwapActivityItem['status']
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const rotation = useSharedValue(0)

  useEffect(() => {
    if (status === 'in_progress') {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1200, easing: Easing.linear }),
        -1
      )
    }
    return () => {
      cancelAnimation(rotation)
    }
  }, [status, rotation])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }))

  if (status === 'completed') {
    return (
      <View
        sx={{
          width: STATUS_ICON_SIZE,
          height: STATUS_ICON_SIZE,
          borderRadius: STATUS_ICON_SIZE / 2,
          backgroundColor: '$textSuccess',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Icons.Navigation.Check
          color={colors.$surfacePrimary}
          width={STATUS_ICON_SIZE * 0.55}
          height={STATUS_ICON_SIZE * 0.55}
        />
      </View>
    )
  }

  if (status === 'failed') {
    return (
      <View
        sx={{
          width: STATUS_ICON_SIZE,
          height: STATUS_ICON_SIZE,
          borderRadius: STATUS_ICON_SIZE / 2,
          backgroundColor: '$textDanger',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Icons.Content.Close
          color={colors.$surfacePrimary}
          width={STATUS_ICON_SIZE * 0.55}
          height={STATUS_ICON_SIZE * 0.55}
        />
      </View>
    )
  }

  return (
    <View
      sx={{
        width: STATUS_ICON_SIZE,
        height: STATUS_ICON_SIZE,
        borderRadius: STATUS_ICON_SIZE / 2,
        backgroundColor: '$surfaceSecondary',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Animated.View style={animatedStyle}>
        <Icons.Notification.Sync
          color={colors.$textPrimary}
          width={STATUS_ICON_SIZE * 0.65}
          height={STATUS_ICON_SIZE * 0.65}
        />
      </Animated.View>
    </View>
  )
}

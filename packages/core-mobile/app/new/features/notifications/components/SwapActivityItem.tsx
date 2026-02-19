import React, { FC, useEffect } from 'react'
import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated'
import { SwapActivityItem as SwapActivityItemType } from '../types'
import NotificationListItem from './NotificationListItem'

const ICON_SIZE = 32

type SwapIconProps = {
  status: SwapActivityItemType['status']
}

/**
 * Icon shown on the left of each swap item:
 *  - completed  → static green circle with a white checkmark
 *  - in_progress → grey circle with a continuously spinning sync icon
 */
const SwapIcon: FC<SwapIconProps> = ({ status }) => {
  const {
    theme: { colors }
  } = useTheme()

  const rotation = useSharedValue(0)

  useEffect(() => {
    if (status === 'in_progress') {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1200, easing: Easing.linear }),
        -1 // repeat indefinitely
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
          width: ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: ICON_SIZE / 2,
          backgroundColor: '$textSuccess',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Icons.Navigation.Check
          color={colors.$surfacePrimary}
          width={ICON_SIZE / 2}
          height={ICON_SIZE / 2}
        />
      </View>
    )
  }

  return (
    <View
      sx={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: ICON_SIZE / 2,
        backgroundColor: '$surfaceSecondary',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Animated.View style={animatedStyle}>
        <Icons.Notification.Sync color={colors.$textPrimary} />
      </Animated.View>
    </View>
  )
}

type SwapActivityItemProps = {
  item: SwapActivityItemType
  showSeparator: boolean
  testID?: string
}

/**
 * List item for a swap transaction in the notification center.
 *
 * Title is derived from the item's fromToken / toToken
 */
const SwapActivityItem: FC<SwapActivityItemProps> = ({
  item,
  showSeparator,
  testID
}) => {
  const title =
    item.status === 'completed'
      ? `Swapped ${item.fromToken} to ${item.toToken}`
      : `Swapping ${item.fromToken} to ${item.toToken} in progress...`

  return (
    <NotificationListItem
      title={title}
      subtitle="Tap for more details"
      icon={<SwapIcon status={item.status} />}
      timestamp={item.timestamp}
      showSeparator={showSeparator}
      accessoryType="chevron"
      testID={testID}
    />
  )
}

export default SwapActivityItem

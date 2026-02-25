import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import React, { forwardRef } from 'react'
import { View as RNView } from 'react-native'
import { AnimatedSyncIcon } from './AnimatedSyncIcon'
import NavigationBarButton from './NavigationBarButton'

const BADGE_SIZE = 5

interface NotificationBarButtonProps {
  onPress?: () => void
  hasUnread?: boolean
  isInProgress?: boolean
}

export const NotificationBarButton = forwardRef<
  RNView,
  NotificationBarButtonProps
>(({ onPress, hasUnread = false, isInProgress = false }, ref): JSX.Element => {
  const { theme } = useTheme()

  return (
    <NavigationBarButton ref={ref} onPress={onPress} testID="notification_icon">
      <View sx={{ position: 'relative' }}>
        {isInProgress ? (
          <AnimatedSyncIcon />
        ) : (
          <Icons.Social.Notifications color={theme.colors.$textPrimary} />
        )}
        {hasUnread && !isInProgress && (
          <View
            sx={{
              position: 'absolute',
              top: -1,
              right: 1,
              width: BADGE_SIZE,
              height: BADGE_SIZE,
              borderRadius: BADGE_SIZE / 2,
              backgroundColor: '$textDanger'
            }}
          />
        )}
      </View>
    </NavigationBarButton>
  )
})

import React, { useCallback } from 'react'
import { router } from 'expo-router'
import { useUnreadCount } from 'features/notifications/hooks/useNotifications'
import { NotificationBarButton } from './NotificationBarButton'

/**
 * NotificationBarButton connected to notification state.
 * Shows badge when there are unread notifications.
 */
export const ConnectedNotificationBarButton = (): JSX.Element => {
  const unreadCount = useUnreadCount()

  const handlePress = useCallback(() => {
    // @ts-expect-error - expo-router route not typed
    router.navigate('/notifications')
  }, [])

  return (
    <NotificationBarButton onPress={handlePress} hasUnread={unreadCount > 0} />
  )
}

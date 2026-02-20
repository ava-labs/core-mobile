import React, { useCallback, useMemo } from 'react'
import { router } from 'expo-router'
import { useUnreadCount } from 'features/notifications/hooks/useNotifications'
import { useSwapActivitiesStore } from 'features/notifications/store'
import { mapTransferToSwapStatus } from 'features/notifications/utils'
import { NotificationBarButton } from './NotificationBarButton'

/**
 * NotificationBarButton connected to notification state.
 * Shows badge when there are unread notifications.
 * Shows animated rotating icon when there are swaps in progress.
 */
export const ConnectedNotificationBarButton = (): JSX.Element => {
  const unreadCount = useUnreadCount()
  const { swapActivities } = useSwapActivitiesStore()

  const isSwapInProgress = useMemo(() => {
    return Object.values(swapActivities).some(
      item => mapTransferToSwapStatus(item.transfer) === 'in_progress'
    )
  }, [swapActivities])

  const handlePress = useCallback(() => {
    // @ts-ignore - expo-router route not typed
    router.navigate('/notifications')
  }, [])

  return (
    <NotificationBarButton
      onPress={handlePress}
      hasUnread={unreadCount > 0}
      isSwapInProgress={isSwapInProgress}
    />
  )
}

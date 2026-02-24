import React, { useCallback, useMemo } from 'react'
import { router } from 'expo-router'
import { useUnreadCount } from 'features/notifications/hooks/useNotifications'
import { mapTransferToSwapStatus } from 'features/notifications/utils'
import { useFusionTransfers } from 'features/swapV2/hooks/useZustandStore'
import { NotificationBarButton } from './NotificationBarButton'

/**
 * NotificationBarButton connected to notification state.
 * Shows badge when there are unread notifications.
 * Shows animated rotating icon when there are swaps in progress.
 */
export const ConnectedNotificationBarButton = (): JSX.Element => {
  const unreadCount = useUnreadCount()
  const { transfers } = useFusionTransfers()

  const isSwapInProgress = useMemo(() => {
    return Object.values(transfers).some(
      item => mapTransferToSwapStatus(item.transfer) === 'in_progress'
    )
  }, [transfers])

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

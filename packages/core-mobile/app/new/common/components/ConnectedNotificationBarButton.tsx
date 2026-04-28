import React, { useCallback, useMemo } from 'react'
import { router } from 'expo-router'
import { useSelector } from 'react-redux'
import { useUnreadCount } from 'features/notifications/hooks/useNotifications'
import { mapTransferToSwapStatus } from 'features/notifications/utils'
import { useFusionTransfers } from 'features/swap/hooks/useZustandStore'
import { selectIsAllNotificationsBlocked } from 'store/posthog'
import { NotificationBarButton } from './NotificationBarButton'

/**
 * NotificationBarButton connected to notification state.
 * Shows badge when there are unread notifications.
 * Shows animated rotating icon when there are swaps in progress.
 *
 * Hidden when all notifications are blocked (e.g. LIMITED_MODE) — the
 * /notifications route is empty without any notification subscriptions.
 */
export const ConnectedNotificationBarButton = (): JSX.Element | null => {
  const isAllNotificationsBlocked = useSelector(selectIsAllNotificationsBlocked)
  const unreadCount = useUnreadCount()
  const { transfers } = useFusionTransfers()

  const isSwapInProgress = useMemo(() => {
    return Object.values(transfers).some(
      item => mapTransferToSwapStatus(item.transfer) === 'in_progress'
    )
  }, [transfers])

  const handlePress = useCallback(() => {
    router.navigate('/notifications')
  }, [])

  if (isAllNotificationsBlocked) {
    return null
  }

  return (
    <NotificationBarButton
      onPress={handlePress}
      hasUnread={unreadCount > 0}
      isInProgress={isSwapInProgress}
    />
  )
}

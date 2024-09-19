import React, { useCallback } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useDispatch } from 'react-redux'
import { turnOnNotificationsFor } from 'store/notifications'
import NotificationsService from 'services/notifications/NotificationsService'

type ScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.EnableNotificationsPrompt
>

const EnableNotificationsModal = (): JSX.Element => {
  const { params } = useRoute<ScreenProps['route']>()
  const { notificationChannel, title, message } = params
  const { goBack, canGoBack } = useNavigation<ScreenProps['navigation']>()
  const dispatch = useDispatch()

  const onTurnOnNotifications = useCallback(async () => {
    const { permission, blockedNotifications } =
      await NotificationsService.getAllPermissions(false)
    if (
      permission === 'authorized' &&
      blockedNotifications.get(notificationChannel) !== true
    ) {
      dispatch(turnOnNotificationsFor({ channelId: notificationChannel }))
    }
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, dispatch, goBack, notificationChannel])

  const onLater = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  return (
    <WarningModal
      testID="turn_on_notifications_modal"
      title={title}
      message={message}
      actionText={'Turn on Notifications'}
      dismissText={'Not Now'}
      onAction={onTurnOnNotifications}
      onDismiss={onLater}
    />
  )
}
export default EnableNotificationsModal

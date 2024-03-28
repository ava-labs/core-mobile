import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { EarnScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useDispatch } from 'react-redux'
import { turnOnNotificationsFor } from 'store/notifications'
import { ChannelId } from 'services/notifications/channels'
import NotificationsService from 'services/notifications/NotificationsService'

type ScreenProps = EarnScreenProps<
  typeof AppNavigation.Earn.EarnNotificationsPrompt
>

export const EarnNotificationsModal = () => {
  const { goBack, canGoBack } = useNavigation<ScreenProps['navigation']>()
  const dispatch = useDispatch()

  const onTurnOnNotifications = useCallback(async () => {
    const { permission, blockedNotifications } =
      await NotificationsService.getAllPermissions(false)
    if (
      permission === 'authorized' &&
      blockedNotifications.get(ChannelId.STAKING_COMPLETE) !== true
    ) {
      dispatch(
        turnOnNotificationsFor({ channelId: ChannelId.STAKING_COMPLETE })
      )
    }
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, dispatch, goBack])

  const onLater = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  return (
    <WarningModal
      testID="turn_on_notifications_modal"
      title={'Turn on Notifications?'}
      message={
        'You will be notified when staking is complete. You can change your preference in settings.'
      }
      actionText={'Turn on Notifications'}
      dismissText={'Not Now'}
      onAction={onTurnOnNotifications}
      onDismiss={onLater}
    />
  )
}

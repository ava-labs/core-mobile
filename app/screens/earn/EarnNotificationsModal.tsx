import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { useDispatch } from 'react-redux'
import { setNotifyStakingComplete } from 'store/notifications'
import { EarnScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import NotificationsService from 'services/notifications/NotificationsService'
import { stakeCompleteChannel } from 'services/notifications/channels'

type ScreenProps = EarnScreenProps<
  typeof AppNavigation.Earn.EarnNotificationsPrompt
>

export const EarnNotificationsModal = () => {
  const dispatch = useDispatch()
  const { goBack, canGoBack } = useNavigation<ScreenProps['navigation']>()

  const onTurnOnNotifications = useCallback(() => {
    dispatch(setNotifyStakingComplete(true))
    if (canGoBack()) {
      goBack()
    }
    NotificationsService.createChannel(stakeCompleteChannel)
      .then(() => NotificationsService.requestPermission())
      .then(permission => {
        if (permission !== 'authorized') {
          NotificationsService.openSystemSettings()
        }
      })
  }, [canGoBack, dispatch, goBack])

  const onLater = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  return (
    <WarningModal
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

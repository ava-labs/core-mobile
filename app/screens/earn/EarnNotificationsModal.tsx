import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { useDispatch } from 'react-redux'
import { setEarnNotificationsEnabled } from 'store/notifications'
import { EarnScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import NotificationsService from 'services/notifications/NotificationsService'

type ScreenProps = EarnScreenProps<
  typeof AppNavigation.Earn.EarnNotificationsPrompt
>

export const EarnNotificationsModal = () => {
  const dispatch = useDispatch()
  const { goBack, canGoBack, navigate } =
    useNavigation<ScreenProps['navigation']>()

  const onTurnOnNotifications = useCallback(() => {
    dispatch(setEarnNotificationsEnabled(true))
    if (canGoBack()) {
      goBack()
    }
    NotificationsService.getPermission(true).then(value => {
      if (value === 'denied') {
        navigate(AppNavigation.Earn.EarnNotificationsUnAuthorized)
      }
    })
  }, [canGoBack, dispatch, goBack, navigate])

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

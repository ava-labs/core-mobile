import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { useDispatch } from 'react-redux'
import { setNotificationsEarn } from 'store/notifications'
import notifee, { AuthorizationStatus } from '@notifee/react-native'
import { EarnScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'

type ScreenProps = EarnScreenProps<
  typeof AppNavigation.Earn.EarnNotificationsPrompt
>

export const EarnNotificationsModal = () => {
  const dispatch = useDispatch()
  const { goBack, canGoBack, navigate } =
    useNavigation<ScreenProps['navigation']>()

  const onTurnOnNotifications = useCallback(() => {
    dispatch(setNotificationsEarn(true))
    if (canGoBack()) {
      goBack()
    }
    hasPermissions().then(value => {
      if (!value) {
        navigate(AppNavigation.Earn.EarnNotificationsUnAuthorized)
      }
    })
  }, [canGoBack, dispatch, goBack, navigate])

  const onLater = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  async function hasPermissions(): Promise<boolean> {
    let settings = await notifee.getNotificationSettings()
    switch (settings.authorizationStatus) {
      case AuthorizationStatus.AUTHORIZED:
      case AuthorizationStatus.PROVISIONAL:
        return true
      case AuthorizationStatus.NOT_DETERMINED:
        settings = await notifee.requestPermission()
        return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED
      case AuthorizationStatus.DENIED:
        return false
    }
  }

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

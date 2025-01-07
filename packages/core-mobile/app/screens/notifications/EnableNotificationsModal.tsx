import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useDispatch } from 'react-redux'
import { turnOnAllNotifications } from 'store/notifications'
import NotificationsService from 'services/notifications/NotificationsService'

type ScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.EnableNotificationsPrompt
>

const EnableNotificationsModal = (): JSX.Element => {
  const { goBack, canGoBack } = useNavigation<ScreenProps['navigation']>()
  const dispatch = useDispatch()

  const onTurnOnNotifications = useCallback(async () => {
    const { permission } = await NotificationsService.getAllPermissions(false)

    if (permission === 'authorized') {
      dispatch(turnOnAllNotifications())
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

  // TODO: add title and message
  return (
    <WarningModal
      testID="turn_on_notifications_modal"
      title={'TBD title'}
      message={'TBD'}
      actionText={'Turn on Notifications'}
      dismissText={'Not Now'}
      onAction={onTurnOnNotifications}
      onDismiss={onLater}
    />
  )
}
export default EnableNotificationsModal

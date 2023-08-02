import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'

export const EarnNotificationsUnAuthorizedModal = () => {
  const { goBack, canGoBack } = useNavigation()

  const onOk = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  return (
    <WarningModal
      title={'Notifications denied'}
      message={
        'Notifications are denied. You can always enable notification later in \nMenu > Notifications'
      }
      dismissText={'OK'}
      onDismiss={onOk}
    />
  )
}

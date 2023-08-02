import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'

export const EarnNotificationsUnAuthorizedModal = () => {
  const { getParent } = useNavigation()

  const onOk = useCallback(() => {
    getParent()?.goBack()
  }, [getParent])

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

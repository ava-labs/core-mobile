import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'

export const CancelModal = () => {
  const { goBack, canGoBack, getParent } = useNavigation()

  const onClose = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  const onCancel = useCallback(() => {
    getParent()?.goBack()
  }, [getParent])

  return (
    <WarningModal
      title={'Cancel Staking Setup?'}
      message={'Your staking setup will not go through if you close now.'}
      actionText={'Cancel'}
      dismissText={'Back'}
      onAction={onCancel}
      onDismiss={onClose}
    />
  )
}

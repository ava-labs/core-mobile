import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'

export const FeeUnavailableModal = () => {
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
      title={'Network Error'}
      message={
        'Core was unabe to calculate the network fee due to network issues. Would you like to try again?'
      }
      actionText={'Try Again'}
      dismissText={'Cancel'}
      onAction={onClose}
      onDismiss={onCancel}
    />
  )
}

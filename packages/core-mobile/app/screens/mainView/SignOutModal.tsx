import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'

const SignOutModal = ({ onConfirm }: { onConfirm: () => void }) => {
  const { goBack, canGoBack } = useNavigation()

  const onClose = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  return (
    <WarningModal
      title={'Are you sure you want to delete your wallet?'}
      message={
        'This will remove all wallet related data from your device. This cannot be undone. \n\nYou can always recover this wallet with your recovery phrase. Core wallet does not store your recovery phrase.'
      }
      actionText={'I understand, continue'}
      dismissText={'Cancel'}
      onAction={onConfirm}
      onDismiss={onClose}
    />
  )
}

export default SignOutModal

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
      title={'Are you sure you want to erase your wallet?'}
      message={
        'Your current wallet will be removed from this app permanently. This cannot be undone. \n\nYou can ONLY recover this wallet with your recovery phrase. Core wallet does not store your recovery phrase.'
      }
      actionText={'Yes'}
      dismissText={'No'}
      onAction={onConfirm}
      onDismiss={onClose}
    />
  )
}

export default SignOutModal

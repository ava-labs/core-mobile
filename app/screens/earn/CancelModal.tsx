import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { noop } from '@avalabs/utils-sdk'

export const CancelModal = () => {
  const { goBack, canGoBack } = useNavigation()

  const onClose = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  // TODO: navigate/reset to Dashboard on cancel
  return (
    <WarningModal
      title={'Cancel Staking Setup?'}
      message={'Your staking setup will not go through if you close now.'}
      actionText={'Cancel'}
      dismissText={'Back'}
      onAction={noop}
      onDismiss={onClose}
    />
  )
}

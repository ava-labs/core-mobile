import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'

export const AreYouSureModal: () => JSX.Element = () => {
  const { goBack, canGoBack, getParent } = useNavigation()

  const onYes = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  const onNo = useCallback(() => {
    getParent()?.goBack()
  }, [getParent])

  return (
    <WarningModal
      title={'Are you sure?'}
      message={'Do you really want to delete all history?'}
      actionText={'Yes'}
      dismissText={'No'}
      onAction={onYes}
      onDismiss={onNo}
    />
  )
}

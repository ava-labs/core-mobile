import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { useDispatch } from 'react-redux'
import { removeAllHistories } from 'store/browser/slices/globalHistory'

export const ClearAllHistoryModal: () => JSX.Element = () => {
  const dispatch = useDispatch()
  const { goBack, canGoBack } = useNavigation()

  const onGoBack = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  const onYes = useCallback(() => {
    dispatch(removeAllHistories())
    onGoBack()
  }, [dispatch, onGoBack])

  return (
    <WarningModal
      title={'Clear History?'}
      message={
        'Clearing your history will permanently remove this information.'
      }
      actionText={'Yes'}
      dismissText={'Cancel'}
      onAction={onYes}
      onDismiss={onGoBack}
    />
  )
}

import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { useDispatch } from 'react-redux'
import { removeAllHistories } from 'store/browser/slices/globalHistory'

export const AreYouSureModal: () => JSX.Element = () => {
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
      title={'Close All Tabs?'}
      message={
        'Closing all tabs will permanently remove them from this page. You can still access them from your History.'
      }
      actionText={'Yes'}
      dismissText={'Cancel'}
      onAction={onYes}
      onDismiss={onGoBack}
    />
  )
}

import React, { useCallback } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { RootStackScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'

type ScreenProps = RootStackScreenProps<typeof AppNavigation.Root.ForgotPin>

const ForgotPinModal = (): JSX.Element => {
  const { goBack, canGoBack } = useNavigation<ScreenProps['navigation']>()
  const {
    params: { onConfirm, title, message }
  } = useRoute<ScreenProps['route']>()
  const onClose = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  const onAction = useCallback(() => {
    onConfirm()

    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack, onConfirm])

  return (
    <WarningModal
      title={title}
      message={message}
      actionText={'Continue'}
      dismissText={'Cancel'}
      onAction={onAction}
      onDismiss={onClose}
    />
  )
}

export default ForgotPinModal

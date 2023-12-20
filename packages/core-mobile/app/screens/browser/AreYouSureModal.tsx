import React, { useCallback } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { RootStackScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'

type ScreenProps = RootStackScreenProps<
  typeof AppNavigation.Root.BrowserTabCloseAll
>

export const AreYouSureModal: () => JSX.Element = () => {
  const {
    params: { onConfirm }
  } = useRoute<ScreenProps['route']>()
  const { goBack, canGoBack } = useNavigation()

  const onGoBack = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  const onYes = useCallback(() => {
    onConfirm()

    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack, onConfirm])

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

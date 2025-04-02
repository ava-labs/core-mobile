import React, { useCallback } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { StakeSetupScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'

type RouteProp = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.FundsStuck
>['route']

export const FundsStuckModal = ({
  title,
  message,
  dismissText
}: {
  title: string
  message: string
  dismissText: string
}): JSX.Element => {
  const { goBack, canGoBack, getParent } = useNavigation()
  const { onTryAgain } = useRoute<RouteProp>().params

  const onAction = useCallback(() => {
    onTryAgain()
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack, onTryAgain])

  const onCancel = useCallback(() => {
    getParent()?.goBack()
  }, [getParent])

  return (
    <WarningModal
      title={title}
      message={message}
      actionText={'Try Again'}
      dismissText={dismissText}
      onAction={onAction}
      onDismiss={onCancel}
    />
  )
}

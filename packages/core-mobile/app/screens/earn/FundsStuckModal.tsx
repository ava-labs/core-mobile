import React, { useCallback } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { StakeSetupScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'

type RouteProp = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.FundsStuck
>['route']

export const FundsStuckModal = () => {
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
      title={'Stake Failed'}
      message={
        'Your stake failed due to network issues. Would you like to keep trying to stake your funds?'
      }
      actionText={'Try Again'}
      dismissText={'Cancel Stake'}
      onAction={onAction}
      onDismiss={onCancel}
    />
  )
}

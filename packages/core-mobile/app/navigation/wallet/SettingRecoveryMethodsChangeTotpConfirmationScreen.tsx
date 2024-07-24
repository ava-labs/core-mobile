import React from 'react'
import { useNavigation } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import useSeedlessManageMFA from 'seedless/hooks/useSeedlessManageMFA'
import AppNavigation from 'navigation/AppNavigation'
import { SettingRecoveryMethodsScreenProps } from 'navigation/types'
import { TotpChallenge } from '@cubist-labs/cubesigner-sdk'

export type SettingRecoveryMethodsChangeTotpConfirmationScreenProps =
  SettingRecoveryMethodsScreenProps<
    typeof AppNavigation.SettingRecoveryMethods.ChangeTotpConfirmation
  >

const SettingRecoveryMethodsChangeTotpConfirmationScreen = (): JSX.Element => {
  const { navigate, goBack } =
    useNavigation<
      SettingRecoveryMethodsChangeTotpConfirmationScreenProps['navigation']
    >()
  const { totpResetInit } = useSeedlessManageMFA()

  const handleTotpResetInitialized = (challenge: TotpChallenge): void => {
    navigate(AppNavigation.SettingRecoveryMethods.SettingAuthenticatorSetup, {
      totpChallenge: challenge
    })
  }

  const handleConfirm = (): void => {
    goBack()
    totpResetInit(handleTotpResetInitialized)
  }

  return (
    <WarningModal
      title="Change Authenticator?"
      message="You will no longer be able to use this authenticator once you switch. You can always re-add an authenticator app."
      actionText={'Change'}
      dismissText={'Cancel'}
      onAction={handleConfirm}
      onDismiss={goBack}
    />
  )
}

export default SettingRecoveryMethodsChangeTotpConfirmationScreen

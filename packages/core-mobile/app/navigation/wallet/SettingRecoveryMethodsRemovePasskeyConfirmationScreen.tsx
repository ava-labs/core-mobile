import React from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import useSeedlessManageMFA from 'seedless/hooks/useSeedlessManageMFA'
import AppNavigation from 'navigation/AppNavigation'
import { SettingRecoveryMethodsScreenProps } from 'navigation/types'
import { ShowSnackBar } from 'components/Snackbar'
import { SnackBarMessage } from 'seedless/components/SnackBarMessage'

export type SettingRecoveryMethodsRemovePasskeyConfirmationScreenProps =
  SettingRecoveryMethodsScreenProps<
    typeof AppNavigation.SettingRecoveryMethods.RemovePasskeyConfirmation
  >

const SettingRecoveryMethodsRemovePasskeyConfirmationScreen =
  (): JSX.Element => {
    const { goBack, replace } =
      useNavigation<
        SettingRecoveryMethodsRemovePasskeyConfirmationScreenProps['navigation']
      >()
    const { fidoId } =
      useRoute<
        SettingRecoveryMethodsRemovePasskeyConfirmationScreenProps['route']
      >().params

    const { fidoDelete } = useSeedlessManageMFA()

    const handleConfirm = (): void => {
      goBack()

      fidoDelete(fidoId, () => {
        replace(AppNavigation.SecurityPrivacy.SettingRecoveryMethods)
        ShowSnackBar(<SnackBarMessage message="Passkey removed" />)
      })
    }

    return (
      <WarningModal
        title="Remove Recovery Method?"
        message="Are you sure you want to remove this recovery method?"
        actionText={'Remove'}
        dismissText={'Cancel'}
        onAction={handleConfirm}
        onDismiss={goBack}
        primaryButtonType="primaryDanger"
      />
    )
  }

export default SettingRecoveryMethodsRemovePasskeyConfirmationScreen

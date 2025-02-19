import { useNavigation, useRoute } from '@react-navigation/native'
import { ShowSnackBar } from 'components/Snackbar'
import AppNavigation from 'navigation/AppNavigation'
import { SettingRecoveryMethodsScreenProps } from 'navigation/types'
import React from 'react'
import { ScanQrCode } from 'seedless/components/ScanQrCode'
import { SnackBarMessage } from 'seedless/components/SnackBarMessage'
import useVerifyMFA from 'seedless/hooks/useVerifyMFA'
import SeedlessService from 'seedless/services/SeedlessService'

type SettingScanQrCodeScreenProps = SettingRecoveryMethodsScreenProps<
  typeof AppNavigation.SettingRecoveryMethods.SettingScanQrCode
>

export const SettingScanQrCodeScreen = (): JSX.Element => {
  const { totpChallenge } =
    useRoute<SettingScanQrCodeScreenProps['route']>().params
  const { goBack, navigate } =
    useNavigation<SettingScanQrCodeScreenProps['navigation']>()
  const { verifyTotp } = useVerifyMFA(SeedlessService.session)

  const handleVerifyCode = (): void => {
    verifyTotp({
      onVerifyCode: async code => {
        await totpChallenge.answer(code)

        return { success: true, value: undefined }
      },
      onVerifySuccess: () => {
        navigate(AppNavigation.SettingRecoveryMethods.SettingRecoveryMethods)
        ShowSnackBar(<SnackBarMessage message="Authenticator Changed" />)
      }
    })
  }

  const handlePressEnterManually = (): void => {
    goBack()
  }

  return (
    <ScanQrCode
      totpUrl={totpChallenge.url}
      onPressEnterManually={handlePressEnterManually}
      onVeryfiCode={handleVerifyCode}
    />
  )
}

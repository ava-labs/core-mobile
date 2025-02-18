import React, { useMemo } from 'react'
import { SettingRecoveryMethodsScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import Loader from 'components/Loader'
import { AuthenticatorSetup } from 'seedless/components/AuthenticatorSetup'
import { ShowSnackBar } from 'components/Snackbar'
import SeedlessService from 'seedless/services/SeedlessService'
import useVerifyMFA from 'seedless/hooks/useVerifyMFA'
import { SnackBarMessage } from 'seedless/components/SnackBarMessage'

type SettingAuthenticatorSetupScreenProps = SettingRecoveryMethodsScreenProps<
  typeof AppNavigation.SettingRecoveryMethods.SettingAuthenticatorSetup
>

export const SettingAuthenticatorSetupScreen = (): JSX.Element => {
  const { totpChallenge } =
    useRoute<SettingAuthenticatorSetupScreenProps['route']>().params
  const { navigate } =
    useNavigation<SettingAuthenticatorSetupScreenProps['navigation']>()
  const { verifyTotp } = useVerifyMFA(SeedlessService.session)

  const handleLearnMore = (): void => {
    if (!totpKey) return

    navigate(AppNavigation.SettingRecoveryMethods.SettingLearnMore, {
      totpKey
    })
  }

  const handleScanQrCode = (): void => {
    navigate(AppNavigation.SettingRecoveryMethods.SettingScanQrCode, {
      totpChallenge
    })
  }

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

  const totpKey = useMemo(() => {
    if (totpChallenge.url) {
      return new URL(totpChallenge.url).searchParams.get('secret') ?? undefined
    }
  }, [totpChallenge])

  return totpKey === undefined ? (
    <Loader />
  ) : (
    <AuthenticatorSetup
      totpKey={totpKey}
      onLearnMore={handleLearnMore}
      onScanQrCode={handleScanQrCode}
      onVerifyCode={handleVerifyCode}
    />
  )
}

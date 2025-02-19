import { useNavigation, useRoute } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { RecoveryMethodsScreenProps } from 'navigation/types'
import React from 'react'
import { ScanQrCode } from 'seedless/components/ScanQrCode'
import useVerifyMFA from 'seedless/hooks/useVerifyMFA'
import SeedlessService from 'seedless/services/SeedlessService'
import AnalyticsService from 'services/analytics/AnalyticsService'

type ScanQrCodeScreenProps = RecoveryMethodsScreenProps<
  typeof AppNavigation.RecoveryMethods.ScanQrCode
>

export const ScanQrCodeScreen = (): JSX.Element => {
  const { totpChallenge, oidcAuth, onAccountVerified } =
    useRoute<ScanQrCodeScreenProps['route']>().params
  const { getParent, goBack } =
    useNavigation<ScanQrCodeScreenProps['navigation']>()
  const { verifyTotp } = useVerifyMFA(SeedlessService.session)

  const handleVerifyCode = (): void => {
    verifyTotp({
      onVerifyCode: async code => {
        await totpChallenge.answer(code)

        if (oidcAuth) {
          return SeedlessService.session.verifyCode(
            oidcAuth.oidcToken,
            oidcAuth.mfaId,
            code
          )
        } else {
          return { success: true, value: undefined }
        }
      },
      onVerifySuccess: () => {
        getParent()?.goBack()
        onAccountVerified(true)
        AnalyticsService.capture('SeedlessMfaVerified', {
          type: 'Authenticator'
        })
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

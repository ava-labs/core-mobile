import React, { useEffect, useMemo, useState } from 'react'
import { RecoveryMethodsScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import Loader from 'components/Loader'
import { TotpChallenge } from '@cubist-labs/cubesigner-sdk'
import SeedlessService from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { AuthenticatorSetup } from 'seedless/components/AuthenticatorSetup'
import useVerifyMFA from 'seedless/hooks/useVerifyMFA'
import useSeedlessManageMFA from 'seedless/hooks/useSeedlessManageMFA'

type AuthenticatorSetupScreenProps = RecoveryMethodsScreenProps<
  typeof AppNavigation.RecoveryMethods.AuthenticatorSetup
>

export const AuthenticatorSetupScreen = (): JSX.Element => {
  const [totpChallenge, setTotpChallenge] = useState<TotpChallenge>()
  const { oidcAuth, onAccountVerified } =
    useRoute<AuthenticatorSetupScreenProps['route']>().params

  const { navigate, goBack } =
    useNavigation<AuthenticatorSetupScreenProps['navigation']>()
  const { verifyTotp } = useVerifyMFA(SeedlessService.session)
  const { totpResetInit } = useSeedlessManageMFA()

  const handleLearnMore = (totpKey: string): void => {
    navigate(AppNavigation.RecoveryMethods.LearnMore, { totpKey })
  }

  const handleScanQrCode = (challenge: TotpChallenge): void => {
    navigate(AppNavigation.RecoveryMethods.ScanQrCode, {
      oidcAuth,
      totpChallenge: challenge,
      onAccountVerified
    })
  }

  const handleVerifyCode = (challenge: TotpChallenge): void => {
    verifyTotp({
      onVerifyCode: async code => {
        await challenge.answer(code)

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
        goBack()
        onAccountVerified(true)
        AnalyticsService.capture('SeedlessMfaVerified', {
          type: 'Authenticator'
        })
      }
    })
  }

  useEffect(() => {
    const initChallenge = async (): Promise<void> => {
      try {
        totpResetInit(challenge => {
          setTotpChallenge(challenge)
        })
      } catch (e) {
        Logger.error('registerTotp error', e)
        AnalyticsService.capture('SeedlessRegisterTOTPStartFailed')
      }
    }

    if (totpChallenge === undefined) {
      initChallenge()
    }
  }, [totpResetInit, totpChallenge])

  const totpKey = useMemo(() => {
    if (totpChallenge?.url) {
      return new URL(totpChallenge.url).searchParams.get('secret') ?? undefined
    }
  }, [totpChallenge])

  return totpChallenge === undefined || totpKey === undefined ? (
    <Loader />
  ) : (
    <AuthenticatorSetup
      totpKey={totpKey}
      onLearnMore={() => handleLearnMore(totpKey)}
      onScanQrCode={() => handleScanQrCode(totpChallenge)}
      onVerifyCode={() => handleVerifyCode(totpChallenge)}
    />
  )
}

import { useRouter } from 'expo-router'
import { AuthenticatorSetup as AuthenticatorSetupComponent } from 'features/onboarding/components/AuthenticatorSetup'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import useSeedlessManageMFA from 'features/onboarding/hooks/useSeedlessManageMFA'
import React, { useEffect } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'

export default function AuthenticatorSetup(): JSX.Element {
  const { totpKey, handleCopyCode, totpChallenge, setTotpChallenge } =
    useRecoveryMethodContext()
  const router = useRouter()
  const { totpResetInit } = useSeedlessManageMFA()

  const goToVerifyCode = (): void => {
    // @ts-ignore TODO: make routes typesafe
    router.push('/onboarding/seedless/verifyCode')
  }

  const goToScanQrCode = (): void => {
    // @ts-ignore TODO: make routes typesafe
    router.navigate('/onboarding/seedless/scanQrCode')
  }

  useEffect(() => {
    const initChallenge = async (): Promise<void> => {
      try {
        totpResetInit(challenge => {
          setTotpChallenge(challenge)
        }, '')
      } catch (e) {
        Logger.error('registerTotp error', e)
        AnalyticsService.capture('SeedlessRegisterTOTPStartFailed')
      }
    }

    if (totpChallenge === undefined) {
      initChallenge()
    }
  }, [totpResetInit, totpChallenge, setTotpChallenge])

  return (
    <AuthenticatorSetupComponent
      totpKey={totpKey}
      onScanQrCode={goToScanQrCode}
      onCopyCode={handleCopyCode}
      onVerifyCode={goToVerifyCode}
      isLoading={totpChallenge === undefined || totpKey === undefined}
    />
  )
}

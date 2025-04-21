import React, { useEffect } from 'react'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import useSeedlessManageMFA from 'features/onboarding/hooks/useSeedlessManageMFA'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'
import { Loader } from 'common/components/Loader'
import { AuthenticatorSetup as AuthenticatorSetupComponent } from 'features/onboarding/components/AuthenticatorSetup'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

export default function AuthenticatorSetup(): JSX.Element {
  const { totpKey, handleCopyCode, totpChallenge, setTotpChallenge } =
    useRecoveryMethodContext()
  const router = useDebouncedRouter()
  const { totpResetInit } = useSeedlessManageMFA()

  const goToVerifyCode = (): void => {
    router.push('./verifyCode')
  }

  const goToScanQrCode = (): void => {
    router.navigate('./scanQrCode')
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
  }, [totpResetInit, totpChallenge, setTotpChallenge])

  if (totpChallenge === undefined || totpKey === undefined) {
    return <Loader />
  }

  return (
    <BlurredBarsContentLayout>
      <AuthenticatorSetupComponent
        totpKey={totpKey}
        onScanQrCode={goToScanQrCode}
        onCopyCode={handleCopyCode}
        onVerifyCode={goToVerifyCode}
      />
    </BlurredBarsContentLayout>
  )
}

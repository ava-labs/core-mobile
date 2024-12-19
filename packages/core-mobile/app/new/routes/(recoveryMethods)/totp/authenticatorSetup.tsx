import React, { useEffect } from 'react'
import { useSignupContext } from 'new/contexts/SignupProvider'
import useSeedlessManageMFA from 'new/hooks/useSeedlessManageMFA'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'
import { AuthenticatorSetup as AuthenticatorSetupComponent } from '../components/AuthenticatorSetup'
import { Loader } from '../components/Loader'

export default function AuthenticatorSetup(): JSX.Element {
  const {
    totpKey,
    goToScanQrCode,
    handleCopyCode,
    goToVerifyCode,
    totpChallenge,
    setTotpChallenge
  } = useSignupContext()

  const { totpResetInit } = useSeedlessManageMFA()

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
    <AuthenticatorSetupComponent
      totpKey={totpKey}
      onScanQrCode={goToScanQrCode}
      onCopyCode={handleCopyCode}
      onVerifyCode={goToVerifyCode}
    />
  )
}

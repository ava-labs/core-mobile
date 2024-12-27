import React, { useEffect } from 'react'
import { useRecoveryMethodContext } from 'new/contexts/RecoveryMethodProvider'
import useSeedlessManageMFA from 'new/hooks/useSeedlessManageMFA'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'
import { useRouter } from 'expo-router'
import { AuthenticatorSetup as AuthenticatorSetupComponent } from '../../../components/totp/AuthenticatorSetup'
import { Loader } from '../../../components/totp/Loader'

export default function AuthenticatorSetup(): JSX.Element {
  const { totpKey, handleCopyCode, totpChallenge, setTotpChallenge } =
    useRecoveryMethodContext()
  const router = useRouter()
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
    <AuthenticatorSetupComponent
      totpKey={totpKey}
      onScanQrCode={goToScanQrCode}
      onCopyCode={handleCopyCode}
      onVerifyCode={goToVerifyCode}
    />
  )
}

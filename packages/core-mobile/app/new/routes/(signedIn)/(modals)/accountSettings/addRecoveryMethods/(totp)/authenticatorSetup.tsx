import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { Loader } from 'common/components/Loader'
import { AuthenticatorSetup as AuthenticatorSetupComponent } from 'features/onboarding/components/AuthenticatorSetup'
import { useRecoveryMethodsContext } from 'features/accountSettings/context/RecoverMethodsProvider'

export default function AuthenticatorSetup(): JSX.Element {
  const { totpKey, handleCopyCode } = useRecoveryMethodsContext()
  const router = useRouter()

  const goToVerifyCode = useCallback((): void => {
    router.push('./verifyCode')
  }, [router])

  const goToScanQrCode = useCallback((): void => {
    router.navigate('./scanQrCode')
  }, [router])

  return totpKey === undefined ? (
    <Loader />
  ) : (
    <AuthenticatorSetupComponent
      totpKey={totpKey}
      onScanQrCode={goToScanQrCode}
      onCopyCode={handleCopyCode}
      onVerifyCode={goToVerifyCode}
    />
  )
}

import { useRouter } from 'expo-router'
import { useRecoveryMethodsContext } from 'features/accountSettings/context/RecoverMethodsProvider'
import { AuthenticatorSetup as AuthenticatorSetupComponent } from 'features/onboarding/components/AuthenticatorSetup'
import React, { useCallback } from 'react'

export default function AuthenticatorSetup(): JSX.Element {
  const { totpKey, handleCopyCode } = useRecoveryMethodsContext()
  const router = useRouter()

  const goToVerifyCode = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    router.push('/accountSettings/addRecoveryMethods/verifyCode')
  }, [router])

  const goToScanQrCode = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    router.navigate('/accountSettings/addRecoveryMethods/scanQrCode')
  }, [router])

  return (
    <AuthenticatorSetupComponent
      totpKey={totpKey}
      onScanQrCode={goToScanQrCode}
      onCopyCode={handleCopyCode}
      onVerifyCode={goToVerifyCode}
      isLoading={totpKey === undefined}
    />
  )
}

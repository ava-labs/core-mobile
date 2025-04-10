import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { Loader } from 'common/components/Loader'
import { AuthenticatorSetup as AuthenticatorSetupComponent } from 'features/onboarding/components/AuthenticatorSetup'
import { useSeedlessManageRecoveryMethodsContext } from 'features/accountSettings/context/SeedlessManageRecoveryMethodsProvider'

export default function AuthenticatorSetup(): JSX.Element {
  const { totpKey, handleCopyCode } = useSeedlessManageRecoveryMethodsContext()
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

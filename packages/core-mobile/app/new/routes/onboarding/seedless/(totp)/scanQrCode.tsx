import React from 'react'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import { useRouter } from 'expo-router'
import { ScanQrCode as ScanQrCodeComponent } from 'features/onboarding/components/ScanQrCode'

export default function ScanQrCode(): JSX.Element {
  const { totpChallenge } = useRecoveryMethodContext()
  const router = useRouter()

  const goToVerifyCode = (): void => {
    router.push('./verifyCode')
  }

  const goToEnterCodeManually = (): void => {
    router.navigate('./copyCode')
  }

  return (
    <ScanQrCodeComponent
      totpChallenge={totpChallenge}
      onEnterCodeManually={goToEnterCodeManually}
      onVerifyCode={goToVerifyCode}
    />
  )
}
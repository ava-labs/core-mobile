import { useRouter } from 'expo-router'
import { ScanQrCode as ScanQrCodeComponent } from 'features/onboarding/components/ScanQrCode'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import React from 'react'

export default function ScanQrCode(): JSX.Element {
  const { totpChallenge } = useRecoveryMethodContext()
  const router = useRouter()

  const goToVerifyCode = (): void => {
    // @ts-ignore TODO: make routes typesafe
    router.push('/onboarding/seedless/verifyCode')
  }

  const goToEnterCodeManually = (): void => {
    // @ts-ignore TODO: make routes typesafe
    router.navigate('/onboarding/seedless/copyCode')
  }

  return (
    <ScanQrCodeComponent
      totpChallenge={totpChallenge}
      onEnterCodeManually={goToEnterCodeManually}
      onVerifyCode={goToVerifyCode}
    />
  )
}

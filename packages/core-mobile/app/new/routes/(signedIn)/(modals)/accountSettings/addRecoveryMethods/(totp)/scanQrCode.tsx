import React from 'react'
import { useRouter } from 'expo-router'
import { ScanQrCode as ScanQrCodeComponent } from 'features/onboarding/components/ScanQrCode'
import { useRecoveryMethodsContext } from 'features/accountSettings/context/RecoverMethodsProvider'

export default function ScanQrCode(): JSX.Element {
  const { verifiedTotpChallenge } = useRecoveryMethodsContext()
  const router = useRouter()

  const goToVerifyCode = (): void => {
    router.push('/accountSettings/addRecoveryMethods/verifyCode')
  }

  const goToEnterCodeManually = (): void => {
    router.navigate('/accountSettings/addRecoveryMethods/copyCode')
  }

  return (
    <ScanQrCodeComponent
      totpChallenge={verifiedTotpChallenge}
      onEnterCodeManually={goToEnterCodeManually}
      onVerifyCode={goToVerifyCode}
    />
  )
}

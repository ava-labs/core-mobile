import React from 'react'
import { useSignupContext } from 'new/contexts/SignupProvider'
import { useRouter } from 'expo-router'
import { ScanQrCode as ScanQrCodeComponent } from '../../components/totp/ScanQrCode'

export default function ScanQrCode(): JSX.Element {
  const { totpChallenge } = useSignupContext()
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

import React from 'react'
import { useSignupContext } from 'new/contexts/SignupProvider'
import { ScanQrCode as ScanQrCodeComponent } from '../components/ScanQrCode'

export default function ScanQrCode(): JSX.Element {
  const { goToVerifyCode, goToEnterCodeManually, totpChallenge } =
    useSignupContext()

  return (
    <ScanQrCodeComponent
      totpChallenge={totpChallenge}
      onEnterCodeManually={goToEnterCodeManually}
      onVerifyCode={goToVerifyCode}
    />
  )
}

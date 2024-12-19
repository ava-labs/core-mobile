import React from 'react'
import { useSignupContext } from 'new/contexts/SignupProvider'
import { VerifyCode as VerifyCodeComponent } from '../components/VerifyCode'

export default function VerifyCode(): JSX.Element {
  const { onVerifyCode, onVerifySuccess } = useSignupContext()

  return (
    <VerifyCodeComponent
      onVerifyCode={onVerifyCode}
      onVerifySuccess={onVerifySuccess}
    />
  )
}

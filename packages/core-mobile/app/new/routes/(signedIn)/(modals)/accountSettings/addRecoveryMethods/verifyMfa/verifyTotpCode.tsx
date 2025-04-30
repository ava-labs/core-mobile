import React from 'react'
import { VerifyCode as VerifyCodeComponent } from 'features/onboarding/components/VerifyCode'
import { useRecoveryMethodsContext } from 'features/accountSettings/context/RecoverMethodsProvider'

export default function VerifyTotpCodeScreen(): JSX.Element {
  const { onVerifyCode, onVerifySuccess } = useRecoveryMethodsContext()

  return (
    <VerifyCodeComponent
      onVerifyCode={onVerifyCode}
      onVerifySuccess={onVerifySuccess}
    />
  )
}

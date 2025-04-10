import React from 'react'
import { VerifyCode as VerifyCodeComponent } from 'features/onboarding/components/VerifyCode'
import { useSeedlessManageRecoveryMethodsContext } from 'features/accountSettings/context/SeedlessManageRecoveryMethodsProvider'

export default function VerifyTotpCodeScreen(): JSX.Element {
  const { onVerifyCode, onVerifySuccess } =
    useSeedlessManageRecoveryMethodsContext()

  return (
    <VerifyCodeComponent
      onVerifyCode={onVerifyCode}
      onVerifySuccess={onVerifySuccess}
      sx={{ marginTop: 25 }}
    />
  )
}

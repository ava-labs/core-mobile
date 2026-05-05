import React from 'react'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { VerifyRecoveryPhrase as Component } from 'features/onboarding/components/VerifyRecoveryPhrase'
import { isLimitedMode } from 'utils/limitedMode'

export default function VerifyRecoveryPhrase(): JSX.Element {
  const { navigate } = useRouter()
  const { mnemonic } = useGlobalSearchParams<{ mnemonic: string }>()

  const handleVerified = (): void => {
    navigate({
      pathname: '/onboarding/mnemonic/createPin',
      params: { mnemonic }
    })
  }

  // Step 2 of 6 in the limited-mode mnemonic create flow.
  const wizardStep = isLimitedMode
    ? { currentStep: 2, totalSteps: 6 }
    : undefined

  return (
    <Component
      onVerified={handleVerified}
      mnemonic={mnemonic}
      wizardStep={wizardStep}
    />
  )
}

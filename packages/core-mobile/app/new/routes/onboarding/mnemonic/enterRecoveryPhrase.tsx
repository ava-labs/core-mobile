import { EnterRecoveryPhrase as Component } from 'features/onboarding/components/EnterRecoveryPhrase'
import { useRouter } from 'expo-router'
import React from 'react'
import { isLimitedMode } from 'utils/limitedMode'

export default function EnterRecoveryPhrase(): JSX.Element {
  const { navigate } = useRouter()

  function handleNext(mnemonic: string): void {
    navigate({
      pathname: '/onboarding/mnemonic/createPin',
      params: { mnemonic }
    })
  }

  // Step 1 of 5 in the limited-mode mnemonic recovery flow.
  const wizardStep = isLimitedMode
    ? { currentStep: 1, totalSteps: 5 }
    : undefined

  return <Component onNext={handleNext} wizardStep={wizardStep} />
}

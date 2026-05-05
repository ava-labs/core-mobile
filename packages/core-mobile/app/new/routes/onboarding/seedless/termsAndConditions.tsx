import React, { useCallback } from 'react'
import { TermsAndConditions as Component } from 'features/onboarding/components/TermsAndConditions'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useUserMfa } from 'common/hooks/useUserMfa'
import { isLimitedMode } from 'utils/limitedMode'

export default function TermsAndConditions(): JSX.Element {
  const { navigate } = useRouter()
  const { data: mfas } = useUserMfa()
  const { recovering } = useLocalSearchParams<{ recovering: string }>()

  const handleAgreeAndContinue = useCallback(async (): Promise<void> => {
    const isRecovering = recovering === 'true'
    if (isRecovering) {
      if (mfas?.length === 0) {
        navigate('/onboarding/seedless/addRecoveryMethods')
        return
      }

      navigate('/onboarding/seedless/selectMfaMethod')
      return
    }

    navigate('/onboarding/seedless/addRecoveryMethods')
  }, [mfas?.length, navigate, recovering])

  // Limited mode wizard: seedless create flow is 5 steps (terms, MFA,
  // pin, walletName, success). Terms is always step 0.
  const wizardStep = isLimitedMode
    ? { currentStep: 0, totalSteps: 5 }
    : undefined

  return (
    <Component
      onAgreeAndContinue={handleAgreeAndContinue}
      wizardStep={wizardStep}
    />
  )
}

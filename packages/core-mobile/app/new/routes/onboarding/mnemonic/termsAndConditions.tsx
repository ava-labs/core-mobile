import React from 'react'
import { TermsAndConditions as Component } from 'features/onboarding/components/TermsAndConditions'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { useDispatch } from 'react-redux'
import { setCoreAnalytics } from 'store/settings/securityPrivacy'
import { isLimitedMode } from 'utils/limitedMode'

export default function TermsAndConditions(): JSX.Element {
  const { navigate } = useRouter()
  const dispatch = useDispatch()
  const { recovering } = useGlobalSearchParams<{ recovering: string }>()

  const handleAgreeAndContinue = (): void => {
    if (isLimitedMode) {
      // Skip the analytics-consent ("Unlock airdrops") step in limited mode.
      // Default to opted-out for the demo build.
      dispatch(setCoreAnalytics(false))
      navigate(
        recovering === 'true'
          ? '/onboarding/mnemonic/enterRecoveryPhrase'
          : '/onboarding/mnemonic/recoveryPhrase'
      )
      return
    }
    navigate('/onboarding/mnemonic/analyticsConsent')
  }

  // Limited mode wizard: mnemonic create has 6 steps (terms, recovery,
  // verify, pin, walletName, success); recovery flow has 5 (terms,
  // enterPhrase, pin, walletName, success). Terms is always step 0.
  const wizardStep = isLimitedMode
    ? { currentStep: 0, totalSteps: recovering === 'true' ? 5 : 6 }
    : undefined

  return (
    <Component
      onAgreeAndContinue={handleAgreeAndContinue}
      wizardStep={wizardStep}
    />
  )
}

import React from 'react'
import { TermsAndConditions as Component } from 'features/onboarding/components/TermsAndConditions'
import { useRouter } from 'expo-router'
import { useDispatch } from 'react-redux'
import { setCoreAnalytics } from 'store/settings/securityPrivacy'
import { isLimitedMode } from 'utils/limitedMode'

export default function TermsAndConditions(): JSX.Element {
  const { navigate } = useRouter()
  const dispatch = useDispatch()

  const handleAgreeAndContinue = (): void => {
    if (isLimitedMode) {
      // Skip the analytics-consent ("Unlock airdrops") step in limited mode.
      // Default to opted-out for the demo build.
      dispatch(setCoreAnalytics(false))
      navigate('/onboarding/mnemonic/recoveryPhrase')
      return
    }
    navigate('/onboarding/mnemonic/analyticsConsent')
  }

  return <Component onAgreeAndContinue={handleAgreeAndContinue} />
}

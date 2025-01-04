import React from 'react'
import { TermsAndConditions as Component } from 'features/onboarding/components/TermsAndConditions'
import { useRouter } from 'expo-router'

export default function TermsAndConditions(): JSX.Element {
  const { navigate } = useRouter()

  const handleAgreeAndContinue = (): void => {
    navigate('./analyticsConsent')
  }

  return <Component onAgreeAndContinue={handleAgreeAndContinue} />
}

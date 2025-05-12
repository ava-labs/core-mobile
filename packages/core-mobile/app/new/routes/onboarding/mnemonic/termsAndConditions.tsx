import React from 'react'
import { TermsAndConditions as Component } from 'features/onboarding/components/TermsAndConditions'
import { useRouter } from 'expo-router'

export default function TermsAndConditions(): JSX.Element {
  const { navigate } = useRouter()

  const handleAgreeAndContinue = (): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/onboarding/mnemonic/analyticsConsent')
  }

  return <Component onAgreeAndContinue={handleAgreeAndContinue} />
}

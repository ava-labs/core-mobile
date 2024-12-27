import React from 'react'
import { TermsAndConditions as Component } from 'new/components/onboarding/TermsAndConditions'
import { useRouter } from 'expo-router'

export default function TermsAndConditions(): JSX.Element {
  const { navigate } = useRouter()

  const handleAgreeAndContinue = (): void => {
    navigate('./addRecoveryMethods')
  }

  return <Component onAgreeAndContinue={handleAgreeAndContinue} />
}

import React from 'react'
import { TermsAndConditions as Component } from 'features/onboarding/components/TermsAndConditions'
import { useLocalSearchParams, useRouter } from 'expo-router'

export default function TermsAndConditions(): JSX.Element {
  const { navigate } = useRouter()
  const { recovering } = useLocalSearchParams<{ recovering: string }>()

  const handleAgreeAndContinue = (): void => {
    const isRecovering = recovering === 'true'
    if (isRecovering) {
      navigate('./selectMfaMethod')
      return
    }
    navigate('./addRecoveryMethods')
  }

  return <Component onAgreeAndContinue={handleAgreeAndContinue} />
}

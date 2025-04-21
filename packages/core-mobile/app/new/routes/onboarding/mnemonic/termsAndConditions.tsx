import React from 'react'
import { TermsAndConditions as Component } from 'features/onboarding/components/TermsAndConditions'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

export default function TermsAndConditions(): JSX.Element {
  const { navigate } = useDebouncedRouter()

  const handleAgreeAndContinue = (): void => {
    navigate('./analyticsConsent')
  }

  return <Component onAgreeAndContinue={handleAgreeAndContinue} />
}

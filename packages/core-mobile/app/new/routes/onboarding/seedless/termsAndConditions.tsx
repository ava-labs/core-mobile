import React, { useCallback } from 'react'
import { TermsAndConditions as Component } from 'features/onboarding/components/TermsAndConditions'
import { useLocalSearchParams, useRouter } from 'expo-router'
import SeedlessService from 'seedless/services/SeedlessService'

export default function TermsAndConditions(): JSX.Element {
  const { navigate } = useRouter()
  const { recovering } = useLocalSearchParams<{ recovering: string }>()

  const handleAgreeAndContinue = useCallback(async (): Promise<void> => {
    const isRecovering = recovering === 'true'
    if (isRecovering) {
      const mfas = await SeedlessService.session.userMfa()
      if (mfas.length === 0) {
        navigate('./analyticsConsent')
        return
      }
      navigate('./selectMfaMethod')
      return
    }
    navigate('./addRecoveryMethods')
  }, [navigate, recovering])

  return <Component onAgreeAndContinue={handleAgreeAndContinue} />
}

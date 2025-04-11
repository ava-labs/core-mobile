import React, { useCallback } from 'react'
import { TermsAndConditions as Component } from 'features/onboarding/components/TermsAndConditions'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useUserMfa } from 'common/hooks/useUserMfa'

export default function TermsAndConditions(): JSX.Element {
  const { navigate } = useRouter()
  const { data: mfas } = useUserMfa()
  const { recovering } = useLocalSearchParams<{ recovering: string }>()

  const handleAgreeAndContinue = useCallback(async (): Promise<void> => {
    const isRecovering = recovering === 'true'
    if (isRecovering) {
      if (mfas?.length === 0) {
        navigate('./addRecoveryMethods')
        return
      }
      navigate('./selectMfaMethod')
      return
    }
    navigate('./addRecoveryMethods')
  }, [mfas?.length, navigate, recovering])

  return <Component onAgreeAndContinue={handleAgreeAndContinue} />
}

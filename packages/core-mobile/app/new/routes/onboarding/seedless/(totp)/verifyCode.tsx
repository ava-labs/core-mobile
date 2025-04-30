import { useRouter } from 'expo-router'
import { VerifyCode as VerifyCodeComponent } from 'features/onboarding/components/VerifyCode'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import React, { useCallback } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'

export default function VerifyCode(): JSX.Element {
  const { onVerifyCode } = useRecoveryMethodContext()
  const router = useRouter()

  const onVerifySuccess = useCallback((): void => {
    router.dismissAll()
    router.back()

    // @ts-ignore TODO: make routes typesafe
    router.navigate('/onboarding/seedless/analyticsConsent')
    AnalyticsService.capture('SeedlessMfaVerified', {
      type: 'Authenticator'
    })
  }, [router])

  return (
    <VerifyCodeComponent
      onVerifyCode={onVerifyCode}
      onVerifySuccess={onVerifySuccess}
    />
  )
}

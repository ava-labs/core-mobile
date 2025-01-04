import React, { useCallback } from 'react'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import { useRouter } from 'expo-router'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { VerifyCode as VerifyCodeComponent } from 'features/onboarding/components/VerifyCode'

export default function VerifyCode(): JSX.Element {
  const { onVerifyCode } = useRecoveryMethodContext()
  const router = useRouter()

  const onVerifySuccess = useCallback((): void => {
    router.dismissAll()
    router.back()
    router.navigate('./analyticsConsent')
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

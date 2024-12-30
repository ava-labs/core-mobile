import React, { useCallback } from 'react'
import { useRecoveryMethodContext } from 'new/contexts/RecoveryMethodProvider'
import { useRouter } from 'expo-router'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { VerifyCode as VerifyCodeComponent } from '../../../components/totp/VerifyCode'

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

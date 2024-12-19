import React, { useCallback } from 'react'
import { useSignupContext } from 'new/contexts/SignupProvider'
import { useRouter } from 'expo-router'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { VerifyCode as VerifyCodeComponent } from '../../components/totp/VerifyCode'

export default function VerifyCode(): JSX.Element {
  const { onVerifyCode, handleAccountVerified } = useSignupContext()
  const router = useRouter()

  const onVerifySuccess = useCallback((): void => {
    router.dismissAll()
    router.back()
    handleAccountVerified()
    AnalyticsService.capture('SeedlessMfaVerified', {
      type: 'Authenticator'
    })
  }, [router, handleAccountVerified])

  return (
    <VerifyCodeComponent
      onVerifyCode={onVerifyCode}
      onVerifySuccess={onVerifySuccess}
    />
  )
}
